import { z } from "npm:zod@3";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date (YYYY-MM-DD)");

const workExperienceInputSchema = z
  .object({
    company: z.string().trim().min(1, "company is required"),
    role: z.string().trim().min(1, "role is required"),
    description: z.string().optional(),
    start_date: dateString.nullable().optional(),
    end_date: dateString.nullable().optional(),
    display_order: z.number().int().optional(),
  })
  .strict();

// PATCH accepts any subset of the same fields.
const workExperienceUpdateSchema = workExperienceInputSchema.partial();

export type WorkExperienceInput = z.infer<typeof workExperienceInputSchema>;
export type WorkExperienceUpdate = z.infer<typeof workExperienceUpdateSchema>;

export function validateWorkExperienceInput(
  input: unknown,
): { success: true; data: WorkExperienceInput } | { success: false; error: string } {
  const result = workExperienceInputSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}

export function validateWorkExperienceUpdate(
  input: unknown,
): { success: true; data: WorkExperienceUpdate } | { success: false; error: string } {
  const result = workExperienceUpdateSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}
