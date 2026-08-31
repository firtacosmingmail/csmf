import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import {
  gotrueErrorMessage,
  sessionResponse,
  statusForGotrueError,
  validateRefreshInput,
  validateSignInInput,
} from "./auth.ts";

Deno.test("validateSignInInput accepts an email and password", () => {
  const result = validateSignInInput({ email: "admin@example.com", password: "hunter2" });
  assertEquals(result, { success: true, data: { email: "admin@example.com", password: "hunter2" } });
});

Deno.test("validateSignInInput trims the email", () => {
  const result = validateSignInInput({ email: "  admin@example.com  ", password: "hunter2" });
  assertEquals(result.success && result.data.email, "admin@example.com");
});

Deno.test("validateSignInInput rejects a malformed email", () => {
  assertEquals(validateSignInInput({ email: "nope", password: "hunter2" }).success, false);
});

Deno.test("validateSignInInput rejects an empty password", () => {
  assertEquals(validateSignInInput({ email: "admin@example.com", password: "" }).success, false);
});

Deno.test("validateSignInInput rejects a missing password", () => {
  assertEquals(validateSignInInput({ email: "admin@example.com" }).success, false);
});

Deno.test("validateSignInInput rejects unknown fields", () => {
  assertEquals(
    validateSignInInput({ email: "admin@example.com", password: "hunter2", role: "service_role" }).success,
    false,
  );
});

Deno.test("validateRefreshInput accepts a refresh token", () => {
  assertEquals(validateRefreshInput({ refresh_token: "abc" }), { success: true, data: { refresh_token: "abc" } });
});

Deno.test("validateRefreshInput rejects an empty or missing token", () => {
  assertEquals(validateRefreshInput({ refresh_token: "" }).success, false);
  assertEquals(validateRefreshInput({}).success, false);
});

Deno.test("gotrueErrorMessage prefers error_description, then msg, then message, then error", () => {
  assertEquals(gotrueErrorMessage({ error_description: "Invalid login credentials", msg: "b" }, 400), "Invalid login credentials");
  assertEquals(gotrueErrorMessage({ msg: "Invalid login credentials" }, 400), "Invalid login credentials");
  assertEquals(gotrueErrorMessage({ message: "Email not confirmed" }, 400), "Email not confirmed");
  assertEquals(gotrueErrorMessage({ error: "invalid_grant" }, 400), "invalid_grant");
});

Deno.test("gotrueErrorMessage falls back to the status code", () => {
  assertEquals(gotrueErrorMessage({}, 503), "Authentication failed: HTTP 503");
  assertEquals(gotrueErrorMessage(null, 500), "Authentication failed: HTTP 500");
});

Deno.test("statusForGotrueError maps credential failures to 401", () => {
  assertEquals(statusForGotrueError(400), 401);
  assertEquals(statusForGotrueError(401), 401);
  assertEquals(statusForGotrueError(403), 401);
});

Deno.test("statusForGotrueError passes through validation and rate limiting", () => {
  assertEquals(statusForGotrueError(422), 400);
  assertEquals(statusForGotrueError(429), 429);
});

Deno.test("statusForGotrueError maps upstream failures to 502", () => {
  assertEquals(statusForGotrueError(500), 502);
  assertEquals(statusForGotrueError(503), 502);
});

Deno.test("sessionResponse keeps only the session fields", () => {
  const result = sessionResponse({
    access_token: "eyJhbGciOi",
    refresh_token: "r3fr35h",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 1234567890,
    user: { id: "u1", email: "admin@example.com", app_metadata: { provider: "email" } },
  });
  assertEquals(result, {
    access_token: "eyJhbGciOi",
    refresh_token: "r3fr35h",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 1234567890,
  });
});

Deno.test("sessionResponse derives expires_at when GoTrue omits it", () => {
  const result = sessionResponse({ access_token: "a", refresh_token: "b", expires_in: 60 });
  assertNotEquals(result, null);
  assertEquals(result!.token_type, "bearer");
  assertEquals(result!.expires_in, 60);
  assertEquals(result!.expires_at >= Math.floor(Date.now() / 1000), true);
});

Deno.test("sessionResponse returns null without a token pair", () => {
  assertEquals(sessionResponse({ access_token: "a" }), null);
  assertEquals(sessionResponse({}), null);
  assertEquals(sessionResponse(null), null);
});
