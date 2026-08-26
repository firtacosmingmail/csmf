"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPost, updatePost, deletePost, type PostInput } from "@/lib/api/posts";
import { isLocale } from "@/i18n/locales";

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
  const locale = formData.get("locale");
  const translationGroupId = formData.get("translation_group_id");
  return {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: subtitle || null,
    slug: String(formData.get("slug") ?? "").trim(),
    status: formData.get("status") === "published" ? "published" : "draft",
    pinned: formData.get("pinned") === "on",
    // Only present on the create form — PATCH ignores these fields
    // server-side even if sent, since a post's locale/group is fixed at
    // creation.
    ...(typeof locale === "string" && isLocale(locale) ? { locale } : {}),
    ...(typeof translationGroupId === "string" && translationGroupId ? { translation_group_id: translationGroupId } : {}),
  };
}

export async function createPostAction(formData: FormData) {
  const accessToken = await requireAccessToken();
  const post = await createPost(readPostInput(formData), accessToken);
  revalidatePath("/admin/posts");
  // Straight into the block editor — a freshly created post has no
  // content yet, and that's the very next thing an admin wants to add.
  redirect(`/admin/posts/${post.id}/edit`);
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
