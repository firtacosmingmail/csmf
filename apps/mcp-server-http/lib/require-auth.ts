import { timingSafeEqual } from "node:crypto";

// Single shared-secret bearer token, checked in constant time. Deliberately
// simpler than OAuth: this endpoint has exactly one intended caller (the
// admin's own MCP client), same trust model as the stdio server's .env
// credentials — see FLE-67.
export function isAuthorized(header: string | null, expected: string | undefined): boolean {
  if (!expected) return false;
  const [scheme, token] = (header ?? "").split(" ");
  if (scheme !== "Bearer" || !token) return false;

  const bufA = Buffer.from(token);
  const bufB = Buffer.from(expected);
  // timingSafeEqual throws on mismatched lengths, so short-circuit first —
  // this length check itself isn't constant-time, but token length isn't
  // secret the way its contents are.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Returns a Response to short-circuit the request with, or null to continue.
export function requireAuth(request: Request): Response | null {
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) {
    return new Response(JSON.stringify({ error: "Server misconfigured: MCP_AUTH_TOKEN is not set." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (!isAuthorized(request.headers.get("authorization"), expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json", "www-authenticate": "Bearer" },
    });
  }

  return null;
}
