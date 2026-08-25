import { assertEquals } from "jsr:@std/assert@1";
import { validateSubscribeInput } from "./newsletter.ts";

Deno.test("validateSubscribeInput accepts a valid email", () => {
  const result = validateSubscribeInput({ email: "jane@example.com" });
  assertEquals(result, { success: true, data: { email: "jane@example.com" } });
});

Deno.test("validateSubscribeInput rejects a malformed email", () => {
  const result = validateSubscribeInput({ email: "not-an-email" });
  assertEquals(result.success, false);
});

Deno.test("validateSubscribeInput rejects a missing email", () => {
  const result = validateSubscribeInput({});
  assertEquals(result.success, false);
});

Deno.test("validateSubscribeInput rejects unknown fields", () => {
  const result = validateSubscribeInput({ email: "jane@example.com", status: "active" });
  assertEquals(result.success, false);
});
