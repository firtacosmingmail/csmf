import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { statusForPostgresError } from "../_shared/http.ts";
import { validateSocialLinkInput, validateSocialLinkUpdate } from "../_shared/social-links.ts";

const app = new Hono().basePath("/social-links");

// Public: ordered for display. RLS allows anon reads.
app.get("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  const { data, error } = await supabase.from("social_links").select("*").order("display_order");
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ social_links: data });
});

// Admin only (RLS rejects anon inserts with 42501).
app.post("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validated = validateSocialLinkInput(body);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { data, error } = await supabase.from("social_links").insert(validated.data).select().single();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ social_link: data }, 201);
});

// Admin only.
app.patch("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validated = validateSocialLinkUpdate(body);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { data, error } = await supabase
    .from("social_links")
    .update(validated.data)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ social_link: data });
});

// Admin only.
app.delete("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  const { data, error } = await supabase.from("social_links").delete().eq("id", id).select();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data || data.length === 0) return c.json({ error: "Not found" }, 404);
  return c.body(null, 204);
});

Deno.serve(app.fetch);
