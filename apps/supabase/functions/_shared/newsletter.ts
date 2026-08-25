import { z } from "npm:zod@3";

const subscribeInputSchema = z.object({ email: z.string().trim().email("email must be a valid email") }).strict();

export type SubscribeInput = z.infer<typeof subscribeInputSchema>;

export function validateSubscribeInput(
  input: unknown,
): { success: true; data: SubscribeInput } | { success: false; error: string } {
  const result = subscribeInputSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((issue) => issue.message).join(", ") };
  }
  return { success: true, data: result.data };
}
