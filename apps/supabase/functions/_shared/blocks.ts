import { z } from "npm:zod@3";

export const BLOCK_TYPES = ["heading", "subheading", "paragraph", "code", "separator", "image"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

const textBlockContent = z.object({ text: z.string() }).strict();
const codeBlockContent = z.object({ code: z.string(), language: z.string() }).strict();
const separatorBlockContent = z.object({}).strict();
// `url` comes from POST /images (Phase 07) and is always present once a
// block exists — the other fields are admin-filled-in afterward via
// PATCH /blocks/:id, so they're optional until then.
const imageBlockContent = z
  .object({
    url: z.string().min(1),
    alt_text: z.string().optional(),
    caption: z.string().optional(),
    source_text: z.string().optional(),
    source_url: z.string().optional(),
  })
  .strict();

// Content shape validators, keyed by block type. Every type is now
// populated — heading/subheading/paragraph (Phase 05), code/separator
// (Phase 06), image (Phase 07).
const CONTENT_SCHEMAS: Partial<Record<BlockType, z.ZodTypeAny>> = {
  heading: textBlockContent,
  subheading: textBlockContent,
  paragraph: textBlockContent,
  code: codeBlockContent,
  separator: separatorBlockContent,
  image: imageBlockContent,
};

export function validateBlockContent(
  type: string,
  content: unknown,
): { success: true; data: Record<string, unknown> } | { success: false; error: string } {
  const schema = CONTENT_SCHEMAS[type as BlockType];
  if (!schema) return { success: false, error: `Unsupported block type: ${type}` };

  const result = schema.safeParse(content);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}
