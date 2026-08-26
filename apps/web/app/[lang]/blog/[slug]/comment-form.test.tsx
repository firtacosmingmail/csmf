import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentForm } from "./comment-form";
import { createCommentAction } from "./comment-actions";
import { dictionary } from "@/i18n/dictionaries/en";

vi.mock("./comment-actions", () => ({
  createCommentAction: vi.fn(),
}));

describe("CommentForm", () => {
  beforeEach(() => {
    vi.mocked(createCommentAction).mockReset();
  });

  it("submits the name/email/body and shows an awaiting-approval message on success", async () => {
    const user = userEvent.setup();
    vi.mocked(createCommentAction).mockResolvedValue({
      post_id: "post-1",
      author_name: "Jane",
      author_email: "jane@example.com",
      body: "Great post!",
      status: "pending",
    });

    render(<CommentForm postId="post-1" dict={dictionary.comments} />);

    await user.type(screen.getByLabelText("Name"), "Jane");
    await user.type(screen.getByLabelText("Email (optional)"), "jane@example.com");
    await user.type(screen.getByLabelText("Comment"), "Great post!");
    await user.click(screen.getByRole("button", { name: "Submit comment" }));

    await waitFor(() => {
      expect(createCommentAction).toHaveBeenCalledWith("post-1", {
        author_name: "Jane",
        author_email: "jane@example.com",
        body: "Great post!",
      });
    });
    expect(await screen.findByText("Thanks! Your comment is awaiting approval.")).toBeInTheDocument();
  });

  it("submits with no email as undefined rather than an empty string", async () => {
    const user = userEvent.setup();
    vi.mocked(createCommentAction).mockResolvedValue({
      post_id: "post-1",
      author_name: "Jane",
      author_email: null,
      body: "Nice.",
      status: "pending",
    });

    render(<CommentForm postId="post-1" dict={dictionary.comments} />);

    await user.type(screen.getByLabelText("Name"), "Jane");
    await user.type(screen.getByLabelText("Comment"), "Nice.");
    await user.click(screen.getByRole("button", { name: "Submit comment" }));

    await waitFor(() => {
      expect(createCommentAction).toHaveBeenCalledWith("post-1", {
        author_name: "Jane",
        author_email: undefined,
        body: "Nice.",
      });
    });
  });

  it("shows an error message and keeps the form visible when submission fails", async () => {
    const user = userEvent.setup();
    vi.mocked(createCommentAction).mockRejectedValue(new Error("body is required"));

    render(<CommentForm postId="post-1" dict={dictionary.comments} />);

    await user.type(screen.getByLabelText("Name"), "Jane");
    await user.type(screen.getByLabelText("Comment"), "Nice.");
    await user.click(screen.getByRole("button", { name: "Submit comment" }));

    expect(await screen.findByText("body is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
