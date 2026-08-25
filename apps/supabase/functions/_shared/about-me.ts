import { z } from "npm:zod@3";

// All optional: PUT /about-me accepts any subset of fields, same as
// PATCH /posts/:id — unknown fields are ignored by pickFields, not
// rejected, since this is admin-only and there's no spoofing concern
// like comments' status field.
const aboutMeInputSchema = z.object({
  headline: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
  contact_email: z.string().trim().email("contact_email must be a valid email").optional(),
});

export type AboutMeInput = z.infer<typeof aboutMeInputSchema>;

export function validateAboutMeInput(
  input: unknown,
): { success: true; data: AboutMeInput } | { success: false; error: string } {
  const result = aboutMeInputSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}
