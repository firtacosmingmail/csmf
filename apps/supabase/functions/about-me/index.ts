import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { statusForPostgresError } from "../_shared/http.ts";

const app = new Hono().basePath("/about-me");

// Public: the about_me singleton row. RLS allows anon reads, so this is
// safe to call unauthenticated from the landing page. `about_me` is null
// until a row has been inserted — Phase 11 adds the admin UI/write routes
// for it; until then a row can be hand-inserted (see setup/04_about_me.sql).
app.get("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  const { data, error } = await supabase.from("about_me").select("*").maybeSingle();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ about_me: data });
});

// Public: social links, ordered for display. RLS allows anon reads.
app.get("/social-links", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  const { data, error } = await supabase.from("social_links").select("*").order("display_order");
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ social_links: data });
});

Deno.serve(app.fetch);
