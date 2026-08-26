import { cache } from "react";
import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";
import type { Locale } from "@/i18n/locales";

export type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];
export type PostWithBlocks = Post & { post_blocks: PostBlock[]; translations: { locale: Locale; slug: string }[] };

export type PostInput = {
  title: string;
  subtitle: string | null;
  slug: string;
  status: "draft" | "published";
  pinned: boolean;
  // Create-only: locale defaults to "en"; pass translation_group_id to
  // link this post as the translation of an existing one.
  locale?: Locale;
  translation_group_id?: string;
};

async function unwrapOrThrow<T>(res: Response, key: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const body = await res.json();
  return body[key];
}

// Wrapped in React's cache() so generateMetadata and the page component
// (both called with the same slug/locale during one request) share a
// single fetch instead of hitting the API twice. `locale` defaults to
// "en" server-side if omitted — always pass it from a localized route.
export const getPostBySlug = cache(
  async (slug: string, locale: Locale, accessToken?: string): Promise<PostWithBlocks | null> => {
    const res = await apiFetch(`/posts/${encodeURIComponent(slug)}?locale=${locale}`, { accessToken });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch post "${slug}": ${res.status}`);
    const { post, translations } = await res.json();
    return { ...post, translations };
  },
);

export async function listPosts(
  opts: { status?: string; locale?: Locale; accessToken?: string } = {},
): Promise<Post[]> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.locale) params.set("locale", opts.locale);
  const res = await apiFetch(`/posts${params.size ? `?${params}` : ""}`, {
    accessToken: opts.accessToken,
  });
  return unwrapOrThrow<Post[]>(res, "posts");
}

// Public listing for the landing page — paginated, unlike listPosts (which
// the admin posts list uses unpaginated). `total` reflects the full match
// count regardless of page size, for computing total pages.
export async function listPublishedPosts(
  opts: { locale: Locale; pinned?: boolean; page?: number; perPage?: number },
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({ status: "published", locale: opts.locale });
  if (opts.pinned !== undefined) params.set("pinned", String(opts.pinned));
  if (opts.page) params.set("page", String(opts.page));
  if (opts.perPage) params.set("per_page", String(opts.perPage));

  const res = await apiFetch(`/posts?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  const body = await res.json();
  return { posts: body.posts, total: body.total ?? body.posts.length };
}

export async function getPostById(id: string, accessToken?: string): Promise<Post | null> {
  const res = await apiFetch(`/posts?id=${encodeURIComponent(id)}`, { accessToken });
  const posts = await unwrapOrThrow<Post[]>(res, "posts");
  return posts[0] ?? null;
}

export async function createPost(data: PostInput, accessToken: string): Promise<Post> {
  const res = await apiFetch("/posts", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<Post>(res, "post");
}

export async function updatePost(
  id: string,
  data: Partial<PostInput>,
  accessToken: string,
): Promise<Post> {
  const res = await apiFetch(`/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<Post>(res, "post");
}

export async function setPreviewImage(
  postId: string,
  previewImageBlockId: string | null,
  accessToken: string,
): Promise<Post> {
  const res = await apiFetch(`/posts/${encodeURIComponent(postId)}/preview-image`, {
    method: "PATCH",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preview_image_block_id: previewImageBlockId }),
  });
  return unwrapOrThrow<Post>(res, "post");
}

export async function deletePost(id: string, accessToken: string): Promise<void> {
  const res = await apiFetch(`/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete post: ${res.status}`);
  }
}
