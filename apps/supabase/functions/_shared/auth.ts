import { z } from "npm:zod@3";

// Pure helpers for the `auth` Edge Function — the one function that
// deliberately does NOT go through _shared/client.ts, because its whole job
// is to hand out the Authorization header every *other* function expects.
// It's a thin proxy in front of GoTrue (`/auth/v1/token`) whose only reason
// to exist is holding SUPABASE_ANON_KEY server-side, so a non-browser
// client (the API skill, a script, CI) needs nothing but the admin
// email/password to obtain a session.

const signInInputSchema = z
  .object({
    email: z.string().trim().email("email must be a valid email"),
    password: z.string().min(1, "password is required"),
  })
  .strict();

const refreshInputSchema = z.object({ refresh_token: z.string().min(1, "refresh_token is required") }).strict();

export type SignInInput = z.infer<typeof signInInputSchema>;
export type RefreshInput = z.infer<typeof refreshInputSchema>;

export type Validated<T> = { success: true; data: T } | { success: false; error: string };

function validate<T>(schema: z.ZodType<T>, input: unknown): Validated<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}

export function validateSignInInput(input: unknown): Validated<SignInInput> {
  return validate(signInInputSchema, input);
}

export function validateRefreshInput(input: unknown): Validated<RefreshInput> {
  return validate(refreshInputSchema, input);
}

// GoTrue's error bodies aren't consistent across versions/endpoints — a
// failed grant can come back as {error, error_description}, {msg}, or
// {message}. Collapse them to one string so callers get a usable message
// instead of "[object Object]".
export function gotrueErrorMessage(body: unknown, status: number): string {
  const b = (body ?? {}) as Record<string, unknown>;
  for (const key of ["error_description", "msg", "message", "error"]) {
    const value = b[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return `Authentication failed: HTTP ${status}`;
}

// Bad credentials must not leak upstream 4xx quirks (GoTrue answers 400 for
// a wrong password); anything outside the client-error range is our
// problem, not the caller's, so it becomes a 502 — this function is acting
// as a gateway to GoTrue.
// The literal union (rather than `number`) is what Hono's `c.json(body,
// status)` overload accepts — it keeps this function's call sites free of
// the cast the other functions in this project need.
export function statusForGotrueError(status: number): 400 | 401 | 429 | 502 {
  if (status === 400 || status === 401 || status === 403) return 401;
  if (status === 422) return 400;
  if (status === 429) return 429;
  return 502;
}

// Only the session fields a client actually needs are echoed back — no user
// object, no app/user metadata. Keeps the response small (it's read by
// token-budgeted agents) and avoids re-publishing profile data through an
// endpoint whose sole purpose is issuing a token.
export function sessionResponse(body: unknown): {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
} | null {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.access_token !== "string" || typeof b.refresh_token !== "string") return null;
  const expiresIn = typeof b.expires_in === "number" ? b.expires_in : 3600;
  return {
    access_token: b.access_token,
    refresh_token: b.refresh_token,
    token_type: typeof b.token_type === "string" ? b.token_type : "bearer",
    expires_in: expiresIn,
    expires_at:
      typeof b.expires_at === "number" ? b.expires_at : Math.floor(Date.now() / 1000) + expiresIn,
  };
}
