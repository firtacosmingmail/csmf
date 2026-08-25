import { z } from "npm:zod@3";

// `.strict()` matters here beyond the usual "reject typos" reason: it's
// what makes a spoofed `status: "approved"` in the submit body 400 instead
// of silently being ignored — the route handler never even sees it to
// (not) forward, on top of RLS's own with-check pinning inserts to pending.
const commentInputSchema = z
  .object({
    author_name: z.string().trim().min(1, "author_name is required"),
    author_email: z.string().trim().email("author_email must be a valid email").optional(),
    body: z.string().trim().min(1, "body is required"),
  })
  .strict();

export type CommentInput = z.infer<typeof commentInputSchema>;

export function validateCommentInput(
  input: unknown,
): { success: true; data: CommentInput } | { success: false; error: string } {
  const result = commentInputSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}

export const COMMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export function isValidCommentStatus(value: unknown): value is CommentStatus {
  return typeof value === "string" && (COMMENT_STATUSES as readonly string[]).includes(value);
}
