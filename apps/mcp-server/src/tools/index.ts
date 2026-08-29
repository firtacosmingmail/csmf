import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client.js";
import { registerPostTools } from "./posts.js";
import { registerBlockTools } from "./blocks.js";
import { registerImageTools } from "./images.js";
import { registerComposeTools } from "./compose.js";
import { registerWorkExperienceTools } from "./work-experience.js";

export function registerAllTools(server: McpServer, api: ApiClient) {
  registerPostTools(server, api);
  registerBlockTools(server, api);
  registerImageTools(server, api);
  registerComposeTools(server, api);
  registerWorkExperienceTools(server, api);
}
