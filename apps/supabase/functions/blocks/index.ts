import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { statusForPostgresError } from "../_shared/http.ts";
import { validateBlockContent } from "../_shared/blocks.ts";

const app = new Hono().basePath("/blocks");

// Admin only. Updates a block's content and/or position — `type` is
// immutable once a block is created (delete and re-insert to change it).
// Content is validated against the block's existing type, so we look the
// row up before writing.
app.patch("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const updates: Record<string, unknown> = {};

  if ("content" in body) {
    const { data: existing, error: fetchError } = await supabase
      .from("post_blocks")
      .select("type")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) return c.json({ error: fetchError.message }, statusForPostgresError(fetchError.code));
    if (!existing) return c.json({ error: "Not found" }, 404);

    const validated = validateBlockContent(existing.type, body.content);
    if (!validated.success) return c.json({ error: validated.error }, 400);
    updates.content = validated.data;
  }

  if (typeof body.display_order === "number") {
    updates.display_order = body.display_order;
  }

  const { data, error } = await supabase
    .from("post_blocks")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  // Either the block doesn't exist, or RLS hid it from this caller — same
  // response either way, so we don't leak which.
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ block: data });
});

// Admin only.
app.delete("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  const { data, error } = await supabase.from("post_blocks").delete().eq("id", id).select();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data || data.length === 0) return c.json({ error: "Not found" }, 404);
  return c.body(null, 204);
});

Deno.serve(app.fetch);
