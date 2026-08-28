import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createApiClient, createServer } from "@csmf/mcp-server";
import type { ApiClient } from "@csmf/mcp-server";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

// Lazily constructed, then reused across requests within a warm serverless
// instance — AdminAuth already de-dupes concurrent token refreshes, so this
// saves re-authenticating with Supabase on every call. It's created lazily
// (on first request) rather than as a module-level constant because Next
// imports route modules during `next build`'s page-data-collection step,
// which would otherwise fail without SUPABASE_* env vars present at build
// time.
let api: ApiClient | undefined;
function getApiClient(): ApiClient {
  if (!api) api = createApiClient();
  return api;
}

async function handle(request: Request): Promise<Response> {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  // The McpServer + transport are NOT safe to reuse across requests: a
  // stateless WebStandardStreamableHTTPServerTransport (sessionIdGenerator:
  // undefined) throws "Stateless transport cannot be reused across
  // requests" if handleRequest() is called on it more than once. So both
  // are constructed fresh per request — cheap, since it's just tool
  // registration, not a new network connection.
  const server = createServer(getApiClient());
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);

  return transport.handleRequest(request);
}

export { handle as GET, handle as POST, handle as DELETE };
