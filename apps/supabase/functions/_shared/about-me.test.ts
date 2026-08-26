import { assertEquals } from "jsr:@std/assert@1";
import { validateAboutMeInput } from "./about-me.ts";

Deno.test("validateAboutMeInput accepts locale with no other fields to update", () => {
  const result = validateAboutMeInput({ locale: "en" });
  assertEquals(result, { success: true, data: { locale: "en" } });
});

Deno.test("validateAboutMeInput accepts a partial update", () => {
  const result = validateAboutMeInput({ locale: "ro", headline: "New headline" });
  assertEquals(result, { success: true, data: { locale: "ro", headline: "New headline" } });
});

Deno.test("validateAboutMeInput accepts a full update", () => {
  const input = {
    locale: "en" as const,
    headline: "Hi",
    bio: "<p>Bio</p>",
    avatar_url: "https://example.com/a.png",
    contact_email: "me@example.com",
  };
  const result = validateAboutMeInput(input);
  assertEquals(result, { success: true, data: input });
});

Deno.test("validateAboutMeInput rejects a missing locale", () => {
  const result = validateAboutMeInput({ headline: "Hi" });
  assertEquals(result.success, false);
});

Deno.test("validateAboutMeInput rejects an unsupported locale", () => {
  const result = validateAboutMeInput({ locale: "fr" });
  assertEquals(result.success, false);
});

Deno.test("validateAboutMeInput rejects a malformed contact_email", () => {
  const result = validateAboutMeInput({ locale: "en", contact_email: "not-an-email" });
  assertEquals(result.success, false);
});
