import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type CommentStatus = "pending" | "approved" | "rejected";
export type CommentWithPost = Comment & { posts: { title: string; slug: string } | null };

export type CommentInput = {
  author_name: string;
  author_email?: string;
  body: string;
};

// POST /posts/:id/comments echoes the submitted fields instead of reading
// the inserted row back — RLS's SELECT policy only allows `approved`
// comments, so a `pending` row can't be read back right after inserting
// it. No id/created_at.
export type SubmittedComment = Pick<Comment, "post_id" | "author_name" | "author_email" | "body" | "status">;

export async function getComments(postId: string): Promise<Comment[]> {
  const res = await apiFetch(`/posts/${encodeURIComponent(postId)}/comments`);
  if (!res.ok) throw new Error(`Failed to fetch comments: ${res.status}`);
  const { comments } = await res.json();
  return comments;
}

export async function createComment(postId: string, data: CommentInput): Promise<SubmittedComment> {
  const res = await apiFetch(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to submit comment: ${res.status}`);
  }
  const { comment } = await res.json();
  return comment;
}

// Cross-post moderation queue.
export async function listComments(
  opts: { status?: CommentStatus; accessToken: string },
): Promise<CommentWithPost[]> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  const res = await apiFetch(`/comments${params.size ? `?${params}` : ""}`, { accessToken: opts.accessToken });
  if (!res.ok) throw new Error(`Failed to fetch comments: ${res.status}`);
  const { comments } = await res.json();
  return comments;
}

export async function moderateComment(id: string, status: CommentStatus, accessToken: string): Promise<Comment> {
  const res = await apiFetch(`/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to moderate comment: ${res.status}`);
  }
  const { comment } = await res.json();
  return comment;
}

export async function deleteComment(id: string, accessToken: string): Promise<void> {
  const res = await apiFetch(`/comments/${encodeURIComponent(id)}`, { method: "DELETE", accessToken });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete comment: ${res.status}`);
  }
}
