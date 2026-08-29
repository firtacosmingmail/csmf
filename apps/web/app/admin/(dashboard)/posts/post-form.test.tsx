import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostForm } from "./post-form";

describe("PostForm", () => {
  it("auto-fills the slug from the title until the slug is edited directly", async () => {
    const user = userEvent.setup();
    render(<PostForm action={vi.fn()} submitLabel="Create" />);

    const title = screen.getByLabelText("Title");
    const slug = screen.getByLabelText("Slug");

    await user.type(title, "Hello, World");
    expect(slug).toHaveValue("hello-world");

    // Once the user edits the slug directly, further title edits stop
    // overwriting it.
    await user.clear(slug);
    await user.type(slug, "custom-slug");
    await user.type(title, "!");
    expect(slug).toHaveValue("custom-slug");
  });

  it("prefills fields from defaultValues and treats an existing slug as already touched", () => {
    render(
      <PostForm
        action={vi.fn()}
        submitLabel="Save"
        defaultValues={{
          title: "Existing post",
          subtitle: "A subtitle",
          slug: "existing-post",
          status: "published",
          pinned: true,
        }}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Existing post");
    expect(screen.getByLabelText("Slug")).toHaveValue("existing-post");
    expect(screen.getByLabelText("Subtitle")).toHaveValue("A subtitle");
    expect(screen.getByLabelText("Pinned")).toBeChecked();
  });

  it("offers a language picker for a brand-new post", () => {
    render(<PostForm action={vi.fn()} submitLabel="Create" translation={{}} />);
    expect(screen.getByLabelText("Language")).toHaveValue("en");
  });

  it("locks the language and carries the translation_group_id when creating a translation", () => {
    const { container } = render(
      <PostForm
        action={vi.fn()}
        submitLabel="Create"
        translation={{ locale: "ro", groupId: "11111111-1111-1111-1111-111111111111" }}
      />,
    );

    expect(screen.getByText("Română")).toBeInTheDocument();
    expect(screen.queryByLabelText("Language")).not.toBeInTheDocument();
    expect(container.querySelector('input[name="locale"]')).toHaveValue("ro");
    expect(container.querySelector('input[name="translation_group_id"]')).toHaveValue(
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("omits the language picker entirely when editing (locale is fixed after creation)", () => {
    render(
      <PostForm
        action={vi.fn()}
        submitLabel="Save"
        defaultValues={{ title: "Existing", subtitle: null, slug: "existing", status: "draft", pinned: false }}
      />,
    );
    expect(screen.queryByLabelText("Language")).not.toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });
});
