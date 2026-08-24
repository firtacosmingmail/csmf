"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPost, updatePost, deletePost, type PostInput } from "@/lib/api/posts";

async function requireAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

function readPostInput(formData: FormData): PostInput {
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: subtitle || null,
    slug: String(formData.get("slug") ?? "").trim(),
    status: formData.get("status") === "published" ? "published" : "draft",
    pinned: formData.get("pinned") === "on",
  };
}

export async function createPostAction(formData: FormData) {
  const accessToken = await requireAccessToken();
  await createPost(readPostInput(formData), accessToken);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function updatePostAction(id: string, formData: FormData) {
  const accessToken = await requireAccessToken();
  await updatePost(id, readPostInput(formData), accessToken);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePostAction(id: string) {
  const accessToken = await requireAccessToken();
  await deletePost(id, accessToken);
  revalidatePath("/admin/posts");
}
