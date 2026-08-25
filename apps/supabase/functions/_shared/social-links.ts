import { z } from "npm:zod@3";

const socialLinkInputSchema = z
  .object({
    platform: z.string().trim().min(1, "platform is required"),
    url: z.string().trim().url("url must be a valid URL"),
    display_order: z.number().int().optional(),
  })
  .strict();

// PATCH accepts any subset of the same fields — still `.strict()` (typos
// still rejected), just nothing required.
const socialLinkUpdateSchema = socialLinkInputSchema.partial();

export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;
export type SocialLinkUpdate = z.infer<typeof socialLinkUpdateSchema>;

export function validateSocialLinkInput(
  input: unknown,
): { success: true; data: SocialLinkInput } | { success: false; error: string } {
  const result = socialLinkInputSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}

export function validateSocialLinkUpdate(
  input: unknown,
): { success: true; data: SocialLinkUpdate } | { success: false; error: string } {
  const result = socialLinkUpdateSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}
