import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient, PostBlockType } from "../api-client.js";
import { errorResult, jsonResult } from "./result.js";

const BLOCK_TYPES = ["heading", "subheading", "paragraph", "code", "separator", "image"] as const satisfies readonly PostBlockType[];

const BLOCK_CONTENT_DOC = `Content shape depends on \`type\` (matches apps/supabase/functions/_shared/blocks.ts exactly — extra fields are rejected):
- heading / subheading / paragraph: { text: string } — inline HTML only (e.g. "<strong>bold</strong> and <a href=\\"...\\">links</a>"), no wrapping <p>/<h2> tag. Plain text with no tags is also valid.
- code: { code: string, language: string } — language should be a Shiki bundled language id (e.g. "typescript", "python", "bash", "json", "tsx", "yaml"); unrecognized ids just fall back to unhighlighted text at render time, they don't error.
- separator: {} — no fields.
- image: { url: string, alt_text?: string, caption?: string, source_text?: string, source_url?: string } — \`url\` must come from upload_image first (or create_post_with_content, which can upload for you). source_text/source_url render as an attribution link under the caption.`;

export function registerBlockTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "add_block",
    {
      title: "Add content block",
      description:
        `Append a content block to a post. Blocks render in \`display_order\` (ascending); omit it to default ` +
        `to 0, or pass it explicitly to position the block (the block editor UI itself always sets it, so ` +
        `for a multi-block post it's worth setting explicitly — e.g. 0, 1, 2, ... in the order you add them). ` +
        `The first \`image\` block added to a post automatically becomes its preview image unless one's ` +
        `already set. ${BLOCK_CONTENT_DOC}`,
      inputSchema: {
        postId: z.string().uuid(),
        type: z.enum(BLOCK_TYPES),
        content: z.record(z.string(), z.unknown()),
        displayOrder: z.number().int().optional(),
      },
    },
    async ({ postId, type, content, displayOrder }) => {
      try {
        const block = await api.createBlock(postId, { type, content, display_order: displayOrder });
        return jsonResult({ block });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "update_block",
    {
      title: "Update content block",
      description:
        "Update a block's content and/or display_order. A block's `type` is immutable once created — " +
        `delete_block and add_block again to change it. ${BLOCK_CONTENT_DOC}`,
      inputSchema: {
        id: z.string().uuid(),
        content: z.record(z.string(), z.unknown()).optional(),
        displayOrder: z.number().int().optional(),
      },
    },
    async ({ id, content, displayOrder }) => {
      try {
        const block = await api.updateBlock(id, { content, display_order: displayOrder });
        return jsonResult({ block });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "delete_block",
    {
      title: "Delete content block",
      description: "Permanently delete a single content block from its post. Cannot be undone.",
      inputSchema: { id: z.string().uuid() },
    },
    async ({ id }) => {
      try {
        await api.deleteBlock(id);
        return jsonResult({ deleted: id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "reorder_blocks",
    {
      title: "Reorder content blocks",
      description:
        "Set the display order of a post's blocks in one call: pass the block ids in the order you want " +
        "them to render in, and each one's display_order is set to its position in the array (0-indexed). " +
        "Get the current block ids from get_post (by slug).",
      inputSchema: {
        orderedBlockIds: z.array(z.string().uuid()).min(1),
      },
    },
    async ({ orderedBlockIds }) => {
      try {
        const blocks = await Promise.all(
          orderedBlockIds.map((id, index) => api.updateBlock(id, { display_order: index })),
        );
        return jsonResult({ blocks });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
