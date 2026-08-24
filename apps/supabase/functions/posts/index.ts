import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";

const app = new Hono().basePath("/posts");

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

Deno.serve(app.fetch);
