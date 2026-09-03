import { Hono } from "hono";
import {
  gotrueErrorMessage,
  sessionResponse,
  statusForGotrueError,
  validateRefreshInput,
  validateSignInInput,
} from "../_shared/auth.ts";

// The one function that doesn't use _shared/client.ts: its job is to issue
// the Authorization header every other function consumes. It proxies
// GoTrue's token endpoint, supplying SUPABASE_ANON_KEY from the function's
// own environment — so a non-browser client (the csmf-api skill, a script,
// CI) needs only the admin email/password, not the project's keys.
//
// This grants no privilege the caller didn't already have: sign-in still
// requires valid credentials, and the token it returns is an ordinary user
// session that RLS constrains exactly as it constrains the /admin UI.
const app = new Hono().basePath("/auth");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

async function grant(grantType: "password" | "refresh_token", body: Record<string, string>) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const parsed = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body: parsed };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      body: { message: err instanceof Error ? err.message : String(err) },
    };
  }
}

// POST /auth — email + password in, session out. Returns 401 for bad
// credentials, mirroring what the caller would get from GoTrue itself.
app.post("/", async (c) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return c.json({ error: "Auth is not configured on this deployment" }, 500);
  }

  const input = await c.req.json().catch(() => null);
  const validated = validateSignInInput(input);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { ok, status, body } = await grant("password", validated.data);
  if (!ok) return c.json({ error: gotrueErrorMessage(body, status) }, statusForGotrueError(status));

  const session = sessionResponse(body);
  if (!session) return c.json({ error: "Sign-in succeeded but returned no session" }, 502);
  return c.json(session);
});

// POST /auth/refresh — trade a refresh token for a fresh access token,
// so a long-running client doesn't have to keep the password around.
app.post("/refresh", async (c) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return c.json({ error: "Auth is not configured on this deployment" }, 500);
  }

  const input = await c.req.json().catch(() => null);
  const validated = validateRefreshInput(input);
  if (!validated.success) return c.json({ error: validated.error }, 400);

  const { ok, status, body } = await grant("refresh_token", validated.data);
  if (!ok) return c.json({ error: gotrueErrorMessage(body, status) }, statusForGotrueError(status));

  const session = sessionResponse(body);
  if (!session) return c.json({ error: "Refresh succeeded but returned no session" }, 502);
  return c.json(session);
});

Deno.serve(app.fetch);
