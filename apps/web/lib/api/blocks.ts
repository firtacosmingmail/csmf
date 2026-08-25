import { apiFetch } from "./client";
import type { Database } from "@csmf/supabase";

export type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];

export type BlockInput = {
  type: string;
  content: Record<string, unknown>;
  display_order?: number;
};

async function unwrapOrThrow<T>(res: Response, key: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const body = await res.json();
  return body[key];
}

export async function createBlock(postId: string, data: BlockInput, accessToken: string): Promise<PostBlock> {
  const res = await apiFetch(`/posts/${encodeURIComponent(postId)}/blocks`, {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<PostBlock>(res, "block");
}

export async function updateBlock(
  id: string,
  data: Partial<Pick<BlockInput, "content" | "display_order">>,
  accessToken: string,
): Promise<PostBlock> {
  const res = await apiFetch(`/blocks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return unwrapOrThrow<PostBlock>(res, "block");
}

export async function deleteBlock(id: string, accessToken: string): Promise<void> {
  const res = await apiFetch(`/blocks/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete block: ${res.status}`);
  }
}
