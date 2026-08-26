import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient, PostBlockType } from "../api-client.js";
import { slugify } from "../slugify.js";
import { errorResult, jsonResult } from "./result.js";

const BLOCK_TYPES = ["heading", "subheading", "paragraph", "code", "separator", "image"] as const satisfies readonly PostBlockType[];

const blockInput = z.object({
  type: z.enum(BLOCK_TYPES),
  content: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Required for heading/subheading/paragraph ({text}), code ({code, language}), and separator ({}). " +
        "For image, omit `url` here and use filePath/imageUrl instead — it gets filled in automatically.",
    ),
  filePath: z.string().optional().describe("image blocks only: local path to upload, in place of content.url."),
  imageUrl: z.string().url().optional().describe("image blocks only: remote URL to re-host, in place of content.url."),
});

export function registerComposeTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "create_post_with_content",
    {
      title: "Create post with content (one call)",
      description:
        "Write an entire post in one call: creates the post, then adds every block in `blocks` in order " +
        "(setting display_order to match array position), then optionally publishes it. This is the " +
        "fastest way to author a post — prefer it over create_post + repeated add_block calls unless you " +
        "need to build the post up incrementally or inspect it between steps. The post is always created " +
        "as a draft first and only flipped to published (if requested) after every block has been added, " +
        "so visitors never see a half-written post. For image blocks, pass `filePath` or `imageUrl` " +
        "instead of content.url and the image is uploaded automatically before the block is created; the " +
        "first image block in the array becomes the post's preview image unless you call " +
        "set_preview_image afterward to override it. On any failure partway through, the post and " +
        "whatever blocks were already added are left in place (as a draft) rather than rolled back — " +
        "check the error message, fix it, and continue with add_block/update_block, or delete_post to " +
        "start over.",
      inputSchema: {
        title: z.string().min(1),
        subtitle: z.string().optional(),
        slug: z.string().optional().describe("Defaults to slugify(title)."),
        locale: z.enum(["en", "ro"]).optional().describe('Defaults to "en".'),
        pinned: z.boolean().optional(),
        publish: z.boolean().optional().describe("Publish immediately after all blocks are added. Defaults to false (stays draft)."),
        blocks: z.array(blockInput).describe("Content blocks in the order they should appear."),
      },
    },
    async ({ title, subtitle, slug, locale, pinned, publish, blocks }) => {
      let post: Awaited<ReturnType<typeof api.createPost>> | undefined;
      const createdBlocks: Awaited<ReturnType<typeof api.createBlock>>[] = [];
      try {
        post = await api.createPost({
          title,
          subtitle: subtitle ?? null,
          slug: slug && slug.length > 0 ? slug : slugify(title),
          locale,
          pinned,
          status: "draft",
        });

        for (let index = 0; index < blocks.length; index++) {
          const b = blocks[index];
          let content = { ...(b.content ?? {}) };
          if (b.type === "image" && typeof content.url !== "string") {
            if (!b.filePath && !b.imageUrl) {
              throw new Error(
                `Block ${index} is type "image" but has no content.url, filePath, or imageUrl to get one from.`,
              );
            }
            const uploaded = b.filePath ? await api.uploadImageFromPath(b.filePath) : await api.uploadImageFromUrl(b.imageUrl!);
            content = { ...content, url: uploaded.url };
          }
          const block = await api.createBlock(post.id, { type: b.type, content, display_order: index });
          createdBlocks.push(block);
        }

        const finalPost = publish ? await api.updatePost(post.id, { status: "published" }) : post;
        return jsonResult({ post: finalPost, blocks: createdBlocks });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (post) {
          return errorResult(
            new Error(
              `${message} (post ${post.id} was already created, with ${createdBlocks.length} of ${blocks.length} block(s) added, and is still there as a draft — fix the problem and continue with add_block/update_block, or delete_post to start over.)`,
            ),
          );
        }
        return errorResult(err);
      }
    },
  );
}
