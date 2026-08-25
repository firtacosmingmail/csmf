import { assertEquals } from "jsr:@std/assert@1";
import { validateSocialLinkInput, validateSocialLinkUpdate } from "./social-links.ts";

Deno.test("validateSocialLinkInput accepts a valid link", () => {
  const result = validateSocialLinkInput({ platform: "GitHub", url: "https://github.com/me" });
  assertEquals(result, { success: true, data: { platform: "GitHub", url: "https://github.com/me" } });
});

Deno.test("validateSocialLinkInput rejects a missing platform", () => {
  const result = validateSocialLinkInput({ url: "https://github.com/me" });
  assertEquals(result.success, false);
});

Deno.test("validateSocialLinkInput rejects an invalid url", () => {
  const result = validateSocialLinkInput({ platform: "GitHub", url: "not-a-url" });
  assertEquals(result.success, false);
});

Deno.test("validateSocialLinkUpdate accepts a partial update", () => {
  const result = validateSocialLinkUpdate({ display_order: 2 });
  assertEquals(result, { success: true, data: { display_order: 2 } });
});

Deno.test("validateSocialLinkUpdate accepts an empty object", () => {
  const result = validateSocialLinkUpdate({});
  assertEquals(result, { success: true, data: {} });
});

Deno.test("validateSocialLinkUpdate rejects unknown fields", () => {
  const result = validateSocialLinkUpdate({ foo: "bar" });
  assertEquals(result.success, false);
});
