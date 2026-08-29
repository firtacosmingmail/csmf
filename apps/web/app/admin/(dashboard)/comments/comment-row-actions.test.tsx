import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentRowActions } from "./comment-row-actions";
import { moderateCommentAction, deleteCommentAction } from "./actions";

vi.mock("./actions", () => ({
  moderateCommentAction: vi.fn(),
  deleteCommentAction: vi.fn(),
}));

describe("CommentRowActions", () => {
  beforeEach(() => {
    vi.mocked(moderateCommentAction).mockReset();
    vi.mocked(deleteCommentAction).mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows Approve and Reject for a pending comment, and approving calls the action", async () => {
    const user = userEvent.setup();
    render(<CommentRowActions id="c1" status="pending" />);

    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();

    await user.click(screen.getByText("Approve"));
    expect(moderateCommentAction).toHaveBeenCalledWith("c1", "approved");
  });

  it("hides Approve for an already-approved comment", () => {
    render(<CommentRowActions id="c1" status="approved" />);
    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("hides Reject for an already-rejected comment", () => {
    render(<CommentRowActions id="c1" status="rejected" />);
    expect(screen.queryByText("Reject")).not.toBeInTheDocument();
    expect(screen.getByText("Approve")).toBeInTheDocument();
  });

  it("deletes only after the confirm dialog is accepted", async () => {
    const user = userEvent.setup();
    render(<CommentRowActions id="c1" status="pending" />);

    await user.click(screen.getByText("Delete"));
    expect(deleteCommentAction).toHaveBeenCalledWith("c1");
  });

  it("does not delete when the confirm dialog is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<CommentRowActions id="c1" status="pending" />);

    await user.click(screen.getByText("Delete"));
    expect(deleteCommentAction).not.toHaveBeenCalled();
  });
});
