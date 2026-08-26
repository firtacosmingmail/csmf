#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { AdminAuth } from "./auth.js";
import { ApiClient } from "./api-client.js";
import { registerAllTools } from "./tools/index.js";

async function main() {
  const config = loadConfig();
  const auth = new AdminAuth(config);
  const api = new ApiClient(config, auth);

  const server = new McpServer({ name: "csmf-blog", version: "0.1.0" });
  registerAllTools(server, api);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("csmf-mcp-server failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
