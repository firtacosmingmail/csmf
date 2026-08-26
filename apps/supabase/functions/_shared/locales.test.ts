import { assertEquals } from "jsr:@std/assert@1";
import { isLocale } from "./locales.ts";

Deno.test("isLocale accepts supported locales", () => {
  assertEquals(isLocale("en"), true);
  assertEquals(isLocale("ro"), true);
});

Deno.test("isLocale rejects unsupported values", () => {
  assertEquals(isLocale("fr"), false);
  assertEquals(isLocale(""), false);
  assertEquals(isLocale(undefined), false);
  assertEquals(isLocale(42), false);
});
