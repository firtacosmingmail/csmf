import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuth = vi.fn();
vi.mock("@/lib/require-auth", () => ({ requireAuth }));

const fakeApiClient = { marker: "api-client" };
const createApiClient = vi.fn(() => ({ ...fakeApiClient }));
const fakeServer = { connect: vi.fn(async () => {}) };
const createServer = vi.fn((_api: unknown) => fakeServer);
vi.mock("@csmf/mcp-server", () => ({ createApiClient, createServer }));

const handleRequest = vi.fn(async () => new Response("ok"));
const WebStandardStreamableHTTPServerTransport = vi.fn(function () {
  return { handleRequest };
});
vi.mock("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js", () => ({
  WebStandardStreamableHTTPServerTransport,
}));

// route.ts keeps its ApiClient singleton in module-scope state, so each test
// needs a fresh module instance to observe getApiClient()'s lazy-init
// behavior in isolation.
async function freshRoute() {
  vi.resetModules();
  return import("./route");
}

const request = new Request("https://example.com/api/mcp", { method: "POST" });

beforeEach(() => {
  requireAuth.mockReset();
  createApiClient.mockClear();
  createServer.mockClear();
  fakeServer.connect.mockClear();
  WebStandardStreamableHTTPServerTransport.mockClear();
  handleRequest.mockClear();
});

describe("MCP route handler", () => {
  it("short-circuits with the auth response and never builds a server when unauthorized", async () => {
    const denied = new Response("nope", { status: 401 });
    requireAuth.mockReturnValue(denied);
    const { POST } = await freshRoute();

    const res = await POST(request);

    expect(res).toBe(denied);
    expect(createApiClient).not.toHaveBeenCalled();
    expect(createServer).not.toHaveBeenCalled();
    expect(WebStandardStreamableHTTPServerTransport).not.toHaveBeenCalled();
  });

  it("builds a server on a fresh transport and returns its handleRequest response when authorized", async () => {
    requireAuth.mockReturnValue(null);
    const { POST } = await freshRoute();

    const res = await POST(request);

    expect(createServer).toHaveBeenCalledTimes(1);
    expect(fakeServer.connect).toHaveBeenCalledTimes(1);
    expect(WebStandardStreamableHTTPServerTransport).toHaveBeenCalledWith({ sessionIdGenerator: undefined });
    expect(handleRequest).toHaveBeenCalledWith(request);
    expect(await res.text()).toBe("ok");
  });

  it("reuses the same ApiClient across requests but builds a new transport for every request", async () => {
    requireAuth.mockReturnValue(null);
    const { POST } = await freshRoute();

    await POST(request);
    await POST(request);

    expect(createApiClient).toHaveBeenCalledTimes(1);
    expect(createServer).toHaveBeenCalledTimes(2);
    expect(WebStandardStreamableHTTPServerTransport).toHaveBeenCalledTimes(2);
    const [firstApiClientArg] = createServer.mock.calls[0];
    const [secondApiClientArg] = createServer.mock.calls[1];
    expect(firstApiClientArg).toBe(secondApiClientArg);
  });
});
