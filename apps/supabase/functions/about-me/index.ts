import { Hono } from "hono";
import { createScopedClient } from "../_shared/client.ts";
import { pickFields, statusForPostgresError } from "../_shared/http.ts";
import { validateAboutMeInput } from "../_shared/about-me.ts";
import { isLocale } from "../_shared/locales.ts";

const app = new Hono().basePath("/about-me");

const WRITABLE_FIELDS = ["headline", "bio", "avatar_url", "contact_email"] as const;

// Public: the about_me row for a locale (`?locale=en`). RLS allows anon
// reads, so this is safe to call unauthenticated from the landing page.
// `about_me` is null until a row for that locale has been saved.
// Omitting `?locale=` is an admin-only shape (any authenticated session
// managing translations) that returns every locale's row as an array.
app.get("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);
  const locale = c.req.query("locale");

  if (locale === undefined) {
    const { data, error } = await supabase.from("about_me").select("*");
    if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
    return c.json({ about_me: data });
  }

  if (!isLocale(locale)) return c.json({ error: "locale must be one of: en, ro" }, 400);

  const { data, error } = await supabase.from("about_me").select("*").eq("locale", locale).maybeSingle();
  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ about_me: data });
});

// Admin only (RLS rejects anon writes with 42501). Upserts the row for
// body.locale (now the primary key) — works whether or not one already
// exists for that locale, so the admin UI doesn't need to know which case
// it's in.
app.put("/", async (c) => {
  const supabase = createScopedClient(c.req.header("Authorization") ?? null);

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validated = validateAboutMeInput(body);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { data, error } = await supabase
    .from("about_me")
    .upsert({ locale: validated.data.locale, ...pickFields(validated.data, WRITABLE_FIELDS) })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, statusForPostgresError(error.code));
  return c.json({ about_me: data });
});

Deno.serve(app.fetch);
