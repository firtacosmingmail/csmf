import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig, type Config } from "./config.js";
import { AdminAuth } from "./auth.js";
import { ApiClient } from "./api-client.js";
import { registerAllTools } from "./tools/index.js";

export type { ApiClient } from "./api-client.js";

// Factored out of src/index.ts so both the stdio entrypoint (this package)
// and the HTTP entrypoint (apps/mcp-server-http) can build the same
// authenticated API client and the same fully-tooled McpServer, without
// either one owning process-level side effects (reading env, connecting a
// transport) at import time.

export function createApiClient(config: Config = loadConfig()): ApiClient {
  const auth = new AdminAuth(config);
  return new ApiClient(config, auth);
}

export function createServer(api: ApiClient): McpServer {
  const server = new McpServer({ name: "csmf-blog", version: "0.1.0" });
  registerAllTools(server, api);
  return server;
}
