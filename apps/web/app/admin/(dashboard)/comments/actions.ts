"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { moderateComment, deleteComment, type CommentStatus } from "@/lib/api/comments";

async function requireAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export async function moderateCommentAction(id: string, status: CommentStatus) {
  const accessToken = await requireAccessToken();
  await moderateComment(id, status, accessToken);
  revalidatePath("/admin/comments");
  revalidatePath("/admin");
}

export async function deleteCommentAction(id: string) {
  const accessToken = await requireAccessToken();
  await deleteComment(id, accessToken);
  revalidatePath("/admin/comments");
  revalidatePath("/admin");
}
