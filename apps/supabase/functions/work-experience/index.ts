import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { statusForPostgresError } from "../_shared/http.ts";
import { validateWorkExperienceInput, validateWorkExperienceUpdate } from "../_shared/work-experience.ts";

const app = new Hono().basePath("/work-experience");

// Public: ordered for display (admin arranges display_order via
// drag-to-reorder; typically newest role first). RLS allows anon reads.
app.get("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  const { data, error } = await supabase.from("work_experience").select("*").order("display_order");
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ work_experience: data });
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

  const validated = validateWorkExperienceInput(body);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { data, error } = await supabase.from("work_experience").insert(validated.data).select().single();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ work_experience: data }, 201);
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

  const validated = validateWorkExperienceUpdate(body);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { data, error } = await supabase
    .from("work_experience")
    .update(validated.data)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ work_experience: data });
});

// Admin only.
app.delete("/:id", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const id = c.req.param("id");

  const { data, error } = await supabase.from("work_experience").delete().eq("id", id).select();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  if (!data || data.length === 0) return c.json({ error: "Not found" }, 404);
  return c.body(null, 204);
});

Deno.serve(app.fetch);
