// Throwaway function proving the Edge Functions + Hono wiring end to end:
// `supabase functions serve` locally, `supabase functions deploy` to the dev
// project, and the shared request-scoped client (packages/supabase/functions/_shared/client.ts)
// forwarding the caller's Authorization header so RLS applies as the caller, not the function.
import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";

const app = new Hono().basePath("/hello");

app.get("/", (c) => c.json({ message: "hello from edge functions" }));

app.get("/posts", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, status");

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ posts: data });
});

Deno.serve(app.fetch);
