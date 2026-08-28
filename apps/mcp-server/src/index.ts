#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createApiClient, createServer } from "./create-server.js";

async function main() {
  const api = createApiClient();
  const server = createServer(api);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("csmf-mcp-server failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
