"use server";

import { createClient } from "@/lib/supabase/server";
import { createBlock, updateBlock, deleteBlock, type BlockInput, type PostBlock } from "@/lib/api/blocks";
import { highlightCodeBlocks } from "@/lib/shiki";
import { uploadImage, type UploadedImage } from "@/lib/api/images";
import { setPreviewImage, type Post } from "@/lib/api/posts";

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

// Shiki needs a Node/server runtime, so the editor's Preview toggle routes
// through this action to render code blocks the same way the public page
// does — instead of Preview silently falling back to plain text.
export async function highlightBlocksAction(blocks: PostBlock[]): Promise<PostBlock[]> {
  return highlightCodeBlocks(blocks);
}

// FormData (with a File field) is one of the types React lets a client
// component pass straight into a server action.
export async function uploadImageAction(formData: FormData): Promise<UploadedImage> {
  const accessToken = await requireAccessToken();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Missing file");
  return uploadImage(file, accessToken);
}

export async function setPreviewImageAction(postId: string, blockId: string | null): Promise<Post> {
  const accessToken = await requireAccessToken();
  return setPreviewImage(postId, blockId, accessToken);
}
