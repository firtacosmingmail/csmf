import { assertEquals } from "jsr:@std/assert@1";
import { validateAboutMeInput } from "./about-me.ts";

Deno.test("validateAboutMeInput accepts an empty object (no fields to update)", () => {
  const result = validateAboutMeInput({});
  assertEquals(result, { success: true, data: {} });
});

Deno.test("validateAboutMeInput accepts a partial update", () => {
  const result = validateAboutMeInput({ headline: "New headline" });
  assertEquals(result, { success: true, data: { headline: "New headline" } });
});

Deno.test("validateAboutMeInput accepts a full update", () => {
  const input = {
    headline: "Hi",
    bio: "<p>Bio</p>",
    avatar_url: "https://example.com/a.png",
    contact_email: "me@example.com",
  };
  const result = validateAboutMeInput(input);
  assertEquals(result, { success: true, data: input });
});

Deno.test("validateAboutMeInput rejects a malformed contact_email", () => {
  const result = validateAboutMeInput({ contact_email: "not-an-email" });
  assertEquals(result.success, false);
});
