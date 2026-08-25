import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { statusForPostgresError } from "../_shared/http.ts";
import { isValidCommentStatus } from "../_shared/comments.ts";

const app = new Hono().basePath("/comments");

// Cross-post moderation queue — admin-scoped in practice (RLS's "public
// read approved comments" limits an anon caller to approved rows
// regardless of ?status=). Embeds the post's title/slug so the moderation
// UI can show which post each comment is on in one call, not a fan-out
// per post.
app.get("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const status = c.req.query("status");

  let query = supabase
    .from("comments")
    .select("*, posts(title, slug)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ comments: data });
});

// Admin only (RLS rejects anon updates with 42501). Approve/reject (or
// revert to pending) a comment.
app.patch("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!isValidCommentStatus(body.status)) {
    return c.json({ error: "status must be one of: pending, approved, rejected" }, 400);
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ status: body.status })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ comment: data });
});

// Admin only.
app.delete("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  const { data, error } = await supabase.from("comments").delete().eq("id", id).select();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data || data.length === 0) return c.json({ error: "Not found" }, 404);
  return c.body(null, 204);
});

Deno.serve(app.fetch);
