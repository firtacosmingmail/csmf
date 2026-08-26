import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client.js";
import { errorResult, jsonResult } from "./result.js";

export function registerImageTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "upload_image",
    {
      title: "Upload image",
      description:
        "Upload an image to storage and get back its public url plus pixel dimensions, for use as the " +
        "`url` field of an image block's content (see add_block). Pass exactly one of `filePath` (a path " +
        "readable on this machine — this server runs locally, so a local screenshot or diagram works " +
        "directly) or `imageUrl` (an existing URL to re-host, e.g. an image the agent generated and hosted " +
        "elsewhere). This only uploads the file — it doesn't attach it to a post; use add_block " +
        "afterward, or use create_post_with_content which can do both in one call.",
      inputSchema: {
        filePath: z.string().optional(),
        imageUrl: z.string().url().optional(),
      },
    },
    async ({ filePath, imageUrl }) => {
      try {
        if (!filePath && !imageUrl) return errorResult(new Error("Pass either filePath or imageUrl."));
        if (filePath && imageUrl) return errorResult(new Error("Pass only one of filePath or imageUrl, not both."));
        const uploaded = filePath ? await api.uploadImageFromPath(filePath) : await api.uploadImageFromUrl(imageUrl!);
        return jsonResult(uploaded);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
