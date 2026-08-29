import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "../api-client.js";
import { errorResult, jsonResult } from "./result.js";

const LOCALE = z.enum(["en", "ro"]);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date (YYYY-MM-DD)");

export function registerWorkExperienceTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_work_experience",
    {
      title: "List work experience",
      description:
        "List work experience entries ordered by display_order. Omit `locale` to get every locale's " +
        "entries at once (group them client-side by translation_group_id, like the admin editor does); " +
        "pass it to scope to one language (like the public About page).",
      inputSchema: {
        locale: LOCALE.optional().describe("Filter by locale. Omit to get all locales."),
      },
    },
    async ({ locale }) => {
      try {
        const workExperience = await api.listWorkExperience(locale);
        return jsonResult({ work_experience: workExperience });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "create_work_experience",
    {
      title: "Create work experience entry",
      description:
        'Add a work experience entry. `locale` defaults to "en". Pass `translation_group_id` (from an ' +
        "existing entry) to link this one as its translation into the other language, instead of starting " +
        "a new, unrelated entry.",
      inputSchema: {
        company: z.string().min(1),
        role: z.string().min(1),
        description: z.string().optional(),
        start_date: dateString.nullable().optional(),
        end_date: dateString.nullable().optional().describe("Leave unset (or null) for an ongoing role."),
        display_order: z.number().int().optional(),
        locale: LOCALE.optional().describe('Defaults to "en".'),
        translation_group_id: z.string().uuid().optional(),
      },
    },
    async ({ company, role, description, start_date, end_date, display_order, locale, translation_group_id }) => {
      try {
        const workExperience = await api.createWorkExperience({
          company,
          role,
          description,
          start_date,
          end_date,
          display_order,
          locale,
          translation_group_id,
        });
        return jsonResult({ work_experience: workExperience });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "update_work_experience",
    {
      title: "Update work experience entry",
      description: "Update any subset of a work experience entry's fields.",
      inputSchema: {
        id: z.string().uuid(),
        company: z.string().min(1).optional(),
        role: z.string().min(1).optional(),
        description: z.string().optional(),
        start_date: dateString.nullable().optional(),
        end_date: dateString.nullable().optional().describe("Set to null to mark the role ongoing."),
        display_order: z.number().int().optional(),
        locale: LOCALE.optional(),
        translation_group_id: z.string().uuid().optional(),
      },
    },
    async ({ id, ...patch }) => {
      try {
        const workExperience = await api.updateWorkExperience(id, patch);
        return jsonResult({ work_experience: workExperience });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "delete_work_experience",
    {
      title: "Delete work experience entry",
      description: "Permanently delete a work experience entry. Cannot be undone.",
      inputSchema: { id: z.string().uuid() },
    },
    async ({ id }) => {
      try {
        await api.deleteWorkExperience(id);
        return jsonResult({ deleted: id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "reorder_work_experience",
    {
      title: "Reorder work experience entries",
      description:
        "Set the display order of work experience entries in one call: pass the entry ids in the order " +
        "you want them to render in, and each one's display_order is set to its position in the array " +
        "(0-indexed). Pass ids from a single locale at a time (mixing locales works but its ordering only " +
        "matters within a locale, since that's how entries are grouped for display) — get ids from " +
        "list_work_experience.",
      inputSchema: {
        orderedIds: z.array(z.string().uuid()).min(1),
      },
    },
    async ({ orderedIds }) => {
      try {
        const workExperience = await Promise.all(
          orderedIds.map((id, index) => api.updateWorkExperience(id, { display_order: index })),
        );
        return jsonResult({ work_experience: workExperience });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
