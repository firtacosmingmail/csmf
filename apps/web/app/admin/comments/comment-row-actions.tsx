"use client";

import { moderateCommentAction, deleteCommentAction } from "./actions";
import type { CommentStatus } from "@/lib/api/comments";

export function CommentRowActions({ id, status }: { id: string; status: CommentStatus }) {
  return (
    <div className="flex gap-3">
      {status !== "approved" && (
        <button
          type="button"
          onClick={() => moderateCommentAction(id, "approved")}
          className="text-terracotta hover:underline"
        >
          Approve
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          onClick={() => moderateCommentAction(id, "rejected")}
          className="text-ink-muted hover:underline"
        >
          Reject
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (confirm("Delete this comment? This can't be undone.")) deleteCommentAction(id);
        }}
        className="text-terracotta hover:underline"
      >
        Delete
      </button>
    </div>
  );
}
