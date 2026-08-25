import { assertEquals } from "jsr:@std/assert@1";
import { validateCommentInput } from "./comments.ts";

Deno.test("validateCommentInput accepts a valid comment without an email", () => {
  const result = validateCommentInput({ author_name: "Jane", body: "Great post!" });
  assertEquals(result, { success: true, data: { author_name: "Jane", body: "Great post!" } });
});

Deno.test("validateCommentInput accepts a valid comment with an email", () => {
  const result = validateCommentInput({ author_name: "Jane", author_email: "jane@example.com", body: "Nice." });
  assertEquals(result, {
    success: true,
    data: { author_name: "Jane", author_email: "jane@example.com", body: "Nice." },
  });
});

Deno.test("validateCommentInput rejects a missing author_name", () => {
  const result = validateCommentInput({ body: "Nice." });
  assertEquals(result.success, false);
});

Deno.test("validateCommentInput rejects a blank author_name", () => {
  const result = validateCommentInput({ author_name: "   ", body: "Nice." });
  assertEquals(result.success, false);
});

Deno.test("validateCommentInput rejects a missing body", () => {
  const result = validateCommentInput({ author_name: "Jane" });
  assertEquals(result.success, false);
});

Deno.test("validateCommentInput rejects a malformed email", () => {
  const result = validateCommentInput({ author_name: "Jane", author_email: "not-an-email", body: "Nice." });
  assertEquals(result.success, false);
});

Deno.test("validateCommentInput rejects a spoofed status field", () => {
  const result = validateCommentInput({ author_name: "Jane", body: "Nice.", status: "approved" });
  assertEquals(result.success, false);
});
