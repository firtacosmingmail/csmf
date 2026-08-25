import { assertEquals } from "jsr:@std/assert@1";
import { validateBlockContent } from "./blocks.ts";

Deno.test("validateBlockContent accepts a valid text shape for heading/subheading/paragraph", () => {
  for (const type of ["heading", "subheading", "paragraph"]) {
    const result = validateBlockContent(type, { text: "<p>Hello</p>" });
    assertEquals(result, { success: true, data: { text: "<p>Hello</p>" } });
  }
});

Deno.test("validateBlockContent rejects a missing text field", () => {
  const result = validateBlockContent("paragraph", {});
  assertEquals(result.success, false);
});

Deno.test("validateBlockContent rejects unknown fields on a text block", () => {
  const result = validateBlockContent("heading", { text: "Hello", extra: 1 });
  assertEquals(result.success, false);
});

Deno.test("validateBlockContent rejects block types not yet supported by the editor", () => {
  const result = validateBlockContent("code", { code: "1+1", language: "js" });
  assertEquals(result, { success: false, error: "Unsupported block type: code" });
});

Deno.test("validateBlockContent rejects an unknown block type", () => {
  const result = validateBlockContent("bogus", { text: "x" });
  assertEquals(result.success, false);
});
