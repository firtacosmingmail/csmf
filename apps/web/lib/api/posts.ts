import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];
export type PostWithBlocks = Post & { post_blocks: PostBlock[] };

export type PostInput = {
  title: string;
  subtitle: string | null;
  slug: string;
  status: "draft" | "published";
  pinned: boolean;
};

async function unwrapOrThrow<T>(res: Response, key: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const body = await res.json();
  return body[key];
}

export async function getPostBySlug(slug: string, accessToken?: string): Promise<PostWithBlocks | null> {
  const res = await apiFetch(`/posts/${encodeURIComponent(slug)}`, { accessToken });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch post "${slug}": ${res.status}`);
  const { post } = await res.json();
  return post;
}

export async function listPosts(opts: { status?: string; accessToken?: string } = {}): Promise<Post[]> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  const res = await apiFetch(`/posts${params.size ? `?${params}` : ""}`, {
    accessToken: opts.accessToken,
  });
  return unwrapOrThrow<Post[]>(res, "posts");
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
