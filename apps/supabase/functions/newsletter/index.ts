import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { statusForPostgresError } from "../_shared/http.ts";
import { validateSubscribeInput } from "../_shared/newsletter.ts";

const app = new Hono().basePath("/newsletter");

// Public. Always inserts as status='active' — the request body's own
// shape (validateSubscribeInput has no status field, `.strict()`) means a
// spoofed status 400s before reaching the insert; RLS's own with-check
// backs this up independently. A duplicate email is treated as a no-op
// success rather than an error — the visitor's intent ("subscribe me") is
// already satisfied either way.
app.post("/subscribe", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validated = validateSubscribeInput(body);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { error } = await supabase
    .from("subscribers")
    .insert({ email: validated.data.email, status: "active" });

  if (error && error.code !== "23505") {
    return c.json({ error: error.message }, statusForPostgresError(error.code));
  }
  return c.json({ success: true }, 201);
});

Deno.serve(app.fetch);
