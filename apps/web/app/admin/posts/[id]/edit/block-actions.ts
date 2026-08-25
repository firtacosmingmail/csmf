"use server";

import { createClient } from "@/lib/supabase/server";
import { createBlock, updateBlock, deleteBlock, type BlockInput, type PostBlock } from "@/lib/api/blocks";

async function requireAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

// Called directly from the client block editor (not bound to a <form>) —
// React lets a "use server" action be invoked like any async function, so
// autosave/reorder/insert/delete can each fire as soon as they happen
// rather than waiting on a form submission.
export async function createBlockAction(postId: string, data: BlockInput): Promise<PostBlock> {
  const accessToken = await requireAccessToken();
  return createBlock(postId, data, accessToken);
}

export async function updateBlockAction(
  id: string,
  data: Partial<Pick<BlockInput, "content" | "display_order">>,
): Promise<PostBlock> {
  const accessToken = await requireAccessToken();
  return updateBlock(id, data, accessToken);
}

export async function deleteBlockAction(id: string): Promise<void> {
  const accessToken = await requireAccessToken();
  return deleteBlock(id, accessToken);
}
