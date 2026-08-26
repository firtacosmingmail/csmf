import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client.js";
import { slugify } from "../slugify.js";
import { errorResult, jsonResult } from "./result.js";

const LOCALE = z.enum(["en", "ro"]);

export function registerPostTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_posts",
    {
      title: "List posts",
      description:
        "List posts, most recently created first. With no filters this returns every post " +
        "(draft and published) since this tool authenticates as the admin. Use this to find a " +
        "post's id before editing it, or to check what already exists before creating something new.",
      inputSchema: {
        status: z.enum(["draft", "published"]).optional().describe("Filter by status."),
        locale: LOCALE.optional().describe('Filter by locale. Omit to get all locales.'),
        pinned: z.boolean().optional().describe("Filter to pinned (or unpinned) posts only."),
      },
    },
    async ({ status, locale, pinned }) => {
      try {
        const posts = await api.listPosts({ status, locale, pinned });
        return jsonResult({ posts });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "get_post",
    {
      title: "Get post",
      description:
        "Fetch a single post's metadata. Pass either `id` or `slug` (with `locale`, default \"en\", " +
        "since slugs are only unique per locale). Looking up by slug also returns the post's content " +
        "blocks in order and its published sibling translations; looking up by id returns metadata only " +
        "(use list_posts or fetch blocks via a slug lookup if you need them for an id you already have).",
      inputSchema: {
        id: z.string().uuid().optional(),
        slug: z.string().optional(),
        locale: LOCALE.optional().describe('Only used with `slug`. Defaults to "en".'),
      },
    },
    async ({ id, slug, locale }) => {
      try {
        if (!id && !slug) return errorResult(new Error("Pass either id or slug."));
        if (id) {
          const post = await api.getPostById(id);
          if (!post) return errorResult(new Error(`No post with id ${id}`));
          return jsonResult({ post });
        }
        const result = await api.getPostBySlug(slug!, locale ?? "en");
        if (!result) return errorResult(new Error(`No post with slug "${slug}" (locale ${locale ?? "en"})`));
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "create_post",
    {
      title: "Create post",
      description:
        "Create a new post. Starts with zero content blocks and status \"draft\" — use add_block to add " +
        "content, then publish_post when it's ready (or set the initial status directly). " +
        "For writing a whole post in one call instead, prefer create_post_with_content. " +
        "`slug` defaults to a slugified version of the title if omitted.",
      inputSchema: {
        title: z.string().min(1),
        subtitle: z.string().optional(),
        slug: z.string().optional().describe("Defaults to slugify(title), e.g. \"My Post!\" -> \"my-post\"."),
        pinned: z.boolean().optional().describe("Pin to the top of the post list. Defaults to false."),
        locale: LOCALE.optional().describe('Defaults to "en".'),
        status: z.enum(["draft", "published"]).optional().describe('Defaults to "draft".'),
      },
    },
    async ({ title, subtitle, slug, pinned, locale, status }) => {
      try {
        const post = await api.createPost({
          title,
          subtitle: subtitle ?? null,
          slug: slug && slug.length > 0 ? slug : slugify(title),
          pinned,
          locale,
          status,
        });
        return jsonResult({ post });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "update_post",
    {
      title: "Update post metadata",
      description:
        "Update a post's title, subtitle, slug, and/or pinned state. Does not touch status or content " +
        "blocks — use publish_post/unpublish_post for status, add_block/update_block/delete_block for content.",
      inputSchema: {
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        subtitle: z.string().nullable().optional(),
        slug: z.string().optional(),
        pinned: z.boolean().optional(),
      },
    },
    async ({ id, title, subtitle, slug, pinned }) => {
      try {
        const post = await api.updatePost(id, { title, subtitle, slug, pinned });
        return jsonResult({ post });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "publish_post",
    {
      title: "Publish post",
      description:
        "Set a post's status to \"published\". published_at is stamped automatically the first time " +
        "this happens and never changes on later re-publishes. Publishing makes the post (and its " +
        "blocks) visible to anonymous visitors immediately.",
      inputSchema: { id: z.string().uuid() },
    },
    async ({ id }) => {
      try {
        const post = await api.updatePost(id, { status: "published" });
        return jsonResult({ post });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "unpublish_post",
    {
      title: "Unpublish post",
      description: "Set a post's status back to \"draft\", hiding it from public visitors again.",
      inputSchema: { id: z.string().uuid() },
    },
    async ({ id }) => {
      try {
        const post = await api.updatePost(id, { status: "draft" });
        return jsonResult({ post });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "delete_post",
    {
      title: "Delete post",
      description: "Permanently delete a post and all of its content blocks (cascade). Cannot be undone.",
      inputSchema: { id: z.string().uuid() },
    },
    async ({ id }) => {
      try {
        await api.deletePost(id);
        return jsonResult({ deleted: id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "set_preview_image",
    {
      title: "Set post preview image",
      description:
        "Choose which image block is this post's preview image (used as the thumbnail on list rows and " +
        "the hero image on the post page). Must be the id of an existing `image` block belonging to this " +
        "post — get it from the block returned by add_block, or from get_post's blocks. Pass " +
        "previewImageBlockId: null to clear it. Note: the *first* image block added to a post is set as " +
        "the preview automatically, so you only need this to override that choice.",
      inputSchema: {
        postId: z.string().uuid(),
        previewImageBlockId: z.string().uuid().nullable(),
      },
    },
    async ({ postId, previewImageBlockId }) => {
      try {
        const post = await api.setPreviewImage(postId, previewImageBlockId);
        return jsonResult({ post });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
