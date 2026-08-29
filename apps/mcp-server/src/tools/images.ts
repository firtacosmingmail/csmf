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
        "`url` field of an image block's content (see add_block). Pass exactly one of:\n" +
        "- `filePath` — a path readable on the machine *running this MCP server*. Only works when that's " +
        "the same machine as the caller (e.g. the local stdio server) — a remotely-deployed server (e.g. " +
        "over HTTP on Vercel) has no access to the caller's filesystem and this will fail.\n" +
        "- `imageUrl` — an existing URL to re-host, e.g. an image the agent generated and hosted elsewhere.\n" +
        "- `fileData` — base64-encoded file bytes, for when the caller has local file access but the " +
        "server doesn't (the remote-deployment case above): read the file yourself and pass its contents " +
        "here instead of a path. Optionally pass `fileName` (used for the upload's filename/extension) " +
        "and/or `mimeType` (used verbatim if given; otherwise inferred from `fileName`'s extension).\n" +
        "This only uploads the file — it doesn't attach it to a post; use add_block afterward, or use " +
        "create_post_with_content which can do both in one call.",
      inputSchema: {
        filePath: z.string().optional(),
        imageUrl: z.string().url().optional(),
        fileData: z.string().optional().describe("Base64-encoded file bytes."),
        fileName: z.string().optional().describe("Only used with fileData, for filename/extension."),
        mimeType: z.string().optional().describe("Only used with fileData, e.g. \"image/png\"."),
      },
    },
    async ({ filePath, imageUrl, fileData, fileName, mimeType }) => {
      try {
        const modes = [filePath, imageUrl, fileData].filter((v) => v !== undefined);
        if (modes.length === 0) return errorResult(new Error("Pass one of filePath, imageUrl, or fileData."));
        if (modes.length > 1) {
          return errorResult(new Error("Pass only one of filePath, imageUrl, or fileData, not more than one."));
        }
        const uploaded = filePath
          ? await api.uploadImageFromPath(filePath)
          : imageUrl
            ? await api.uploadImageFromUrl(imageUrl)
            : await api.uploadImageFromBase64(fileData!, fileName, mimeType);
        return jsonResult(uploaded);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
