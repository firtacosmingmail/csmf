import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];
export type PostWithBlocks = Post & { post_blocks: PostBlock[] };

export async function getPostBySlug(slug: string): Promise<PostWithBlocks | null> {
  const res = await apiFetch(`/posts/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch post "${slug}": ${res.status}`);
  const { post } = await res.json();
  return post;
}
