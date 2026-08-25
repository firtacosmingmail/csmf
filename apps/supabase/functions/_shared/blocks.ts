import { z } from "npm:zod@3";

export const BLOCK_TYPES = ["heading", "subheading", "paragraph", "code", "separator", "image"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

const textBlockContent = z.object({ text: z.string() }).strict();

// Content shape validators, keyed by block type. Only the types the block
// editor currently supports are populated — later phases (code/separator,
// image) extend this map rather than replacing it.
const CONTENT_SCHEMAS: Partial<Record<BlockType, z.ZodTypeAny>> = {
  heading: textBlockContent,
  subheading: textBlockContent,
  paragraph: textBlockContent,
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
