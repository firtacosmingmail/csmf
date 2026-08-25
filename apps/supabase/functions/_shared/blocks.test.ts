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

Deno.test("validateBlockContent accepts a valid code block shape", () => {
  const result = validateBlockContent("code", { code: "1+1", language: "js" });
  assertEquals(result, { success: true, data: { code: "1+1", language: "js" } });
});

Deno.test("validateBlockContent rejects a code block missing language", () => {
  const result = validateBlockContent("code", { code: "1+1" });
  assertEquals(result.success, false);
});

Deno.test("validateBlockContent accepts an empty object for a separator block", () => {
  const result = validateBlockContent("separator", {});
  assertEquals(result, { success: true, data: {} });
});

Deno.test("validateBlockContent rejects a separator block with any fields", () => {
  const result = validateBlockContent("separator", { text: "nope" });
  assertEquals(result.success, false);
});

Deno.test("validateBlockContent accepts an image block with just a url", () => {
  const result = validateBlockContent("image", { url: "https://example.com/x.png" });
  assertEquals(result, { success: true, data: { url: "https://example.com/x.png" } });
});

Deno.test("validateBlockContent accepts an image block with all optional fields filled in", () => {
  const content = {
    url: "https://example.com/x.png",
    alt_text: "A cat",
    caption: "My cat",
    source_text: "Photo by me",
    source_url: "https://example.com",
  };
  const result = validateBlockContent("image", content);
  assertEquals(result, { success: true, data: content });
});

Deno.test("validateBlockContent rejects an image block with an empty url", () => {
  const result = validateBlockContent("image", { url: "" });
  assertEquals(result.success, false);
});

Deno.test("validateBlockContent rejects an image block missing url", () => {
  const result = validateBlockContent("image", { alt_text: "A cat" });
  assertEquals(result.success, false);
});

Deno.test("validateBlockContent rejects an unknown block type", () => {
  const result = validateBlockContent("bogus", { text: "x" });
  assertEquals(result.success, false);
});
