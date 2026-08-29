"use client";

import { useTransition } from "react";
import { moderateCommentAction, deleteCommentAction } from "./actions";
import type { CommentStatus } from "@/lib/api/comments";
import { Spinner } from "@/components/spinner";

export function CommentRowActions({ id, status }: { id: string; status: CommentStatus }) {
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const disabled = isApproving || isRejecting || isDeleting;

  return (
    <div className="flex gap-3">
      {status !== "approved" && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => startApprove(() => moderateCommentAction(id, "approved"))}
          className="flex items-center gap-1.5 text-terracotta hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
        >
          {isApproving && <Spinner className="h-3.5 w-3.5" />}
          {isApproving ? "Approving…" : "Approve"}
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => startReject(() => moderateCommentAction(id, "rejected"))}
          className="flex items-center gap-1.5 text-ink-muted hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
        >
          {isRejecting && <Spinner className="h-3.5 w-3.5" />}
          {isRejecting ? "Rejecting…" : "Reject"}
        </button>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (confirm("Delete this comment? This can't be undone.")) {
            startDelete(() => deleteCommentAction(id));
          }
        }}
        className="flex items-center gap-1.5 text-terracotta hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
      >
        {isDeleting && <Spinner className="h-3.5 w-3.5" />}
        {isDeleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
