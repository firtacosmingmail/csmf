import { assertEquals } from "jsr:@std/assert@1";
import { pickFields, statusForPostgresError } from "./http.ts";

Deno.test("statusForPostgresError maps RLS violations to 403", () => {
  assertEquals(statusForPostgresError("42501"), 403);
});

Deno.test("statusForPostgresError maps CHECK violations to 400", () => {
  assertEquals(statusForPostgresError("23514"), 400);
});

Deno.test("statusForPostgresError defaults everything else to 500", () => {
  assertEquals(statusForPostgresError("23505"), 500);
  assertEquals(statusForPostgresError(undefined), 500);
});

Deno.test("pickFields keeps only the allowed keys present in the body", () => {
  const result = pickFields(
    { title: "Hello", status: "draft", admin_only: true, extra: 1 },
    ["title", "status", "slug"],
  );
  assertEquals(result, { title: "Hello", status: "draft" });
});

Deno.test("pickFields omits keys that are absent from the body entirely", () => {
  const result = pickFields({ title: "Hello" }, ["title", "slug"]);
  assertEquals(result, { title: "Hello" });
  assertEquals("slug" in result, false);
});
