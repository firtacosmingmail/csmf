import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { pickFields, statusForPostgresError } from "../_shared/http.ts";
import { validateBlockContent } from "../_shared/blocks.ts";

const app = new Hono().basePath("/posts");

const WRITABLE_FIELDS = ["title", "subtitle", "slug", "status", "pinned"] as const;

// List posts. RLS scopes this per caller: anon only ever sees published
// posts regardless of ?status=; an authenticated admin session sees
// everything, optionally filtered by ?status= or a single ?id=.
app.get("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const status = c.req.query("status");
  const id = c.req.query("id");

  let query = supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (id) query = query.eq("id", id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ posts: data });
});

// Public: a published post + its ordered blocks, in one call. RLS (via the
// shared scoped client) is what actually restricts this to published posts
// for anonymous callers — the handler doesn't need to check status itself.
app.get("/:slug", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const slug = c.req.param("slug");

  const { data, error } = await supabase
    .from("posts")
    .select("*, post_blocks!post_blocks_post_id_fkey(*)")
    .eq("slug", slug)
    .order("display_order", { referencedTable: "post_blocks" })
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ post: data });
});

// Admin only (RLS rejects anon inserts with 42501). New posts start with
// zero blocks — the block editor (Phase 05) adds those separately.
app.post("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.title || !body.slug) {
    return c.json({ error: "title and slug are required" }, 400);
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(pickFields(body, WRITABLE_FIELDS))
    .select()
    .single();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ post: data }, 201);
});

// Admin only. Metadata fields only (title/subtitle/slug/status/pinned) —
// unknown fields in the body are silently ignored.
app.patch("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { data, error } = await supabase
    .from("posts")
    .update(pickFields(body, WRITABLE_FIELDS))
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  // Either the post doesn't exist, or RLS hid it from this caller — same
  // response either way, so we don't leak which.
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ post: data });
});

// Admin only.
app.delete("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  const { data, error } = await supabase.from("posts").delete().eq("id", id).select();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data || data.length === 0) return c.json({ error: "Not found" }, 404);
  return c.body(null, 204);
});

// Admin only. Sets (body.preview_image_block_id: string) or clears (null)
// the post's preview image. Denormalizes the chosen block's url/alt_text
// onto the post row so listings never need to join post_blocks just for a
// thumbnail — validates the block belongs to this post and is type
// `image` before doing so.
app.patch("/:id/preview-image", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const postId = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const blockId = body.preview_image_block_id;
  if (blockId !== null && typeof blockId !== "string") {
    return c.json({ error: "preview_image_block_id must be a string or null" }, 400);
  }

  let updates: Record<string, unknown>;
  if (blockId === null) {
    updates = { preview_image_block_id: null, preview_image_url: null, preview_image_alt: null };
  } else {
    const { data: block, error: blockError } = await supabase
      .from("post_blocks")
      .select("type, content")
      .eq("id", blockId)
      .eq("post_id", postId)
      .maybeSingle();
    if (blockError) return c.json({ error: blockError.message }, statusForPostgresError(blockError.code));
    if (!block || block.type !== "image") {
      return c.json({ error: "preview_image_block_id must be an image block belonging to this post" }, 400);
    }

    const content = block.content as Record<string, unknown>;
    updates = {
      preview_image_block_id: blockId,
      preview_image_url: typeof content.url === "string" ? content.url : null,
      preview_image_alt: typeof content.alt_text === "string" ? content.alt_text : null,
    };
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .select()
    .maybeSingle();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ post: data });
});

// Admin only (RLS rejects anon inserts with 42501). Appends a new block to
// the post; pass `display_order` explicitly to control position, otherwise
// it defaults to 0 (the caller/UI is expected to set it for anything after
// the first block).
app.post("/:id/blocks", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const postId = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.type !== "string") {
    return c.json({ error: "type is required" }, 400);
  }

  const validated = validateBlockContent(body.type, body.content ?? {});
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { data, error } = await supabase
    .from("post_blocks")
    .insert({
      post_id: postId,
      type: body.type,
      content: validated.data,
      ...(typeof body.display_order === "number" ? { display_order: body.display_order } : {}),
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ block: data }, 201);
});

Deno.serve(app.fetch);
