"use server";

import { createComment, type SubmittedComment, type CommentInput } from "@/lib/api/comments";

// Public — no access token needed. Routed through a server action anyway
// (rather than calling the Edge Function straight from the browser) to
// match this app's one path for talking to the API, and to sidestep CORS.
export async function createCommentAction(postId: string, data: CommentInput): Promise<SubmittedComment> {
  return createComment(postId, data);
}
