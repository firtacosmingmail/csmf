import { afterEach, describe, expect, it } from "vitest";
import { isAuthorized, requireAuth } from "./require-auth.js";

describe("isAuthorized", () => {
  it("rejects when no token is configured", () => {
    expect(isAuthorized("Bearer anything", undefined)).toBe(false);
    expect(isAuthorized("Bearer anything", "")).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(isAuthorized(null, "secret")).toBe(false);
  });

  it("rejects a non-Bearer scheme", () => {
    expect(isAuthorized("Basic secret", "secret")).toBe(false);
  });

  it("rejects a mismatched token", () => {
    expect(isAuthorized("Bearer wrong", "secret")).toBe(false);
  });

  it("rejects a token of different length (would throw in timingSafeEqual otherwise)", () => {
    expect(isAuthorized("Bearer s", "secret")).toBe(false);
  });

  it("accepts a matching token", () => {
    expect(isAuthorized("Bearer secret", "secret")).toBe(true);
  });
});

describe("requireAuth", () => {
  afterEach(() => {
    delete process.env.MCP_AUTH_TOKEN;
  });

  it("returns 500 when MCP_AUTH_TOKEN is unset", () => {
    const res = requireAuth(new Request("https://example.com/api/mcp"));
    expect(res?.status).toBe(500);
  });

  it("returns 401 when the header is missing or wrong", () => {
    process.env.MCP_AUTH_TOKEN = "secret";
    const res = requireAuth(new Request("https://example.com/api/mcp"));
    expect(res?.status).toBe(401);
  });

  it("returns null (authorized) when the header matches", () => {
    process.env.MCP_AUTH_TOKEN = "secret";
    const res = requireAuth(
      new Request("https://example.com/api/mcp", { headers: { authorization: "Bearer secret" } }),
    );
    expect(res).toBeNull();
  });
});
