import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockEditor } from "./block-editor";
import {
  createBlockAction,
  updateBlockAction,
  deleteBlockAction,
  highlightBlocksAction,
} from "@/app/admin/posts/[id]/edit/block-actions";
import type { PostBlock } from "@/lib/api/blocks";

// RichTextBlock wraps Tiptap/ProseMirror, which needs real browser APIs
// jsdom doesn't fully provide — stand in with a plain input so this file
// can test BlockEditor's own insert/delete/reorder wiring instead.
vi.mock("./rich-text-block", () => ({
  RichTextBlock: ({ initialText, onSave }: { initialText: string; onSave: (text: string) => void }) => (
    <input aria-label="block-text" defaultValue={initialText} onChange={(e) => onSave(e.target.value)} />
  ),
}));

vi.mock("@/app/admin/posts/[id]/edit/block-actions", () => ({
  createBlockAction: vi.fn(),
  updateBlockAction: vi.fn(),
  deleteBlockAction: vi.fn(),
  highlightBlocksAction: vi.fn(),
}));

function makeBlock(overrides: Partial<PostBlock>): PostBlock {
  return {
    id: "block-1",
    post_id: "post-1",
    type: "paragraph",
    display_order: 0,
    content: { text: "" },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("BlockEditor", () => {
  beforeEach(() => {
    vi.mocked(createBlockAction).mockReset();
    vi.mocked(updateBlockAction).mockReset();
    vi.mocked(deleteBlockAction).mockReset();
    vi.mocked(highlightBlocksAction).mockReset();
    vi.mocked(updateBlockAction).mockImplementation(async (id, data) =>
      makeBlock({ id, ...data } as Partial<PostBlock>),
    );
    vi.mocked(highlightBlocksAction).mockImplementation(async (blocks) => blocks);
  });

  it("inserting a block calls createBlockAction and adds it to the list", async () => {
    const user = userEvent.setup();
    vi.mocked(createBlockAction).mockResolvedValue(
      makeBlock({ id: "new-block", type: "heading", display_order: 1 }),
    );

    render(<BlockEditor postId="post-1" initialBlocks={[makeBlock({ id: "block-1" })]} title="Title" subtitle={null} />);

    const insertButtons = screen.getAllByLabelText("Insert block");
    await user.click(insertButtons[0]);
    await user.click(screen.getByText("Heading"));

    await waitFor(() => {
      expect(createBlockAction).toHaveBeenCalledWith("post-1", {
        type: "heading",
        content: { text: "" },
        display_order: 0,
      });
    });
    expect(screen.getAllByLabelText("block-text")).toHaveLength(2);
  });

  it("inserting a code block seeds empty code/language content", async () => {
    const user = userEvent.setup();
    vi.mocked(createBlockAction).mockResolvedValue(
      makeBlock({ id: "new-code", type: "code", content: { code: "", language: "" }, display_order: 1 }),
    );

    render(<BlockEditor postId="post-1" initialBlocks={[makeBlock({ id: "block-1" })]} title="Title" subtitle={null} />);

    await user.click(screen.getAllByLabelText("Insert block")[0]);
    await user.click(screen.getByText("Code"));

    await waitFor(() => {
      expect(createBlockAction).toHaveBeenCalledWith("post-1", {
        type: "code",
        content: { code: "", language: "" },
        display_order: 0,
      });
    });
    expect(screen.getByLabelText("Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Code language")).toBeInTheDocument();
  });

  it("inserting a separator block seeds empty content and renders no editable field", async () => {
    const user = userEvent.setup();
    vi.mocked(createBlockAction).mockResolvedValue(
      makeBlock({ id: "new-sep", type: "separator", content: {}, display_order: 1 }),
    );

    render(<BlockEditor postId="post-1" initialBlocks={[makeBlock({ id: "block-1" })]} title="Title" subtitle={null} />);

    await user.click(screen.getAllByLabelText("Insert block")[0]);
    await user.click(screen.getByText("Separator"));

    await waitFor(() => {
      expect(createBlockAction).toHaveBeenCalledWith("post-1", {
        type: "separator",
        content: {},
        display_order: 0,
      });
    });
    expect(screen.queryByLabelText("Code")).not.toBeInTheDocument();
  });

  it("editing a code block's fields calls updateBlockAction with code and language", async () => {
    const user = userEvent.setup();

    render(
      <BlockEditor
        postId="post-1"
        initialBlocks={[makeBlock({ id: "block-1", type: "code", content: { code: "", language: "" } })]}
        title="Title"
        subtitle={null}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Code language"), "javascript");

    await waitFor(() => {
      expect(updateBlockAction).toHaveBeenCalledWith("block-1", { content: { code: "", language: "javascript" } });
    });
  });

  it("deleting a block calls deleteBlockAction and removes it from the list", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteBlockAction).mockResolvedValue(undefined);

    render(
      <BlockEditor
        postId="post-1"
        initialBlocks={[makeBlock({ id: "block-1" }), makeBlock({ id: "block-2", display_order: 1 })]}
        title="Title"
        subtitle={null}
      />,
    );

    expect(screen.getAllByLabelText("block-text")).toHaveLength(2);
    await user.click(screen.getAllByLabelText("Delete block")[0]);

    await waitFor(() => {
      expect(deleteBlockAction).toHaveBeenCalledWith("block-1");
    });
    await waitFor(() => {
      expect(screen.getAllByLabelText("block-text")).toHaveLength(1);
    });
  });

  it("editing a block's text calls updateBlockAction with the new content", async () => {
    const user = userEvent.setup();

    render(<BlockEditor postId="post-1" initialBlocks={[makeBlock({ id: "block-1" })]} title="Title" subtitle={null} />);

    await user.type(screen.getByLabelText("block-text"), "Hi");

    await waitFor(() => {
      expect(updateBlockAction).toHaveBeenCalledWith("block-1", { content: { text: "Hi" } });
    });
  });

  it("toggling preview shows the post title and hides the editable blocks", async () => {
    const user = userEvent.setup();

    render(
      <BlockEditor postId="post-1" initialBlocks={[makeBlock({ id: "block-1" })]} title="My Post" subtitle="Sub" />,
    );

    await user.click(screen.getByText("Preview"));

    await waitFor(() => {
      expect(screen.getByText("My Post")).toBeInTheDocument();
    });
    expect(screen.getByText("Sub")).toBeInTheDocument();
    expect(screen.queryByLabelText("block-text")).not.toBeInTheDocument();
  });

  it("preview runs blocks through highlightBlocksAction and renders the result", async () => {
    const user = userEvent.setup();
    vi.mocked(highlightBlocksAction).mockResolvedValue([
      makeBlock({ id: "block-1", type: "code", content: { code: "1+1", language: "js", highlightedHtml: "<pre>HL</pre>" } }),
    ]);

    render(
      <BlockEditor
        postId="post-1"
        initialBlocks={[makeBlock({ id: "block-1", type: "code", content: { code: "1+1", language: "js" } })]}
        title="My Post"
        subtitle={null}
      />,
    );

    await user.click(screen.getByText("Preview"));

    await waitFor(() => {
      expect(highlightBlocksAction).toHaveBeenCalledWith([
        expect.objectContaining({ id: "block-1", content: { code: "1+1", language: "js" } }),
      ]);
    });
    expect(screen.getByText("HL")).toBeInTheDocument();
  });
});
