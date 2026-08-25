import { assertEquals } from "jsr:@std/assert@1";
import { paginationRange, DEFAULT_PER_PAGE } from "./pagination.ts";

Deno.test("paginationRange computes a zero-indexed range for page 1", () => {
  assertEquals(paginationRange("1", "6"), { from: 0, to: 5, page: 1, perPage: 6 });
});

Deno.test("paginationRange computes a zero-indexed range for a later page", () => {
  assertEquals(paginationRange("3", "6"), { from: 12, to: 17, page: 3, perPage: 6 });
});

Deno.test("paginationRange defaults page to 1 when missing or invalid", () => {
  assertEquals(paginationRange(undefined, "6").page, 1);
  assertEquals(paginationRange("bogus", "6").page, 1);
  assertEquals(paginationRange("0", "6").page, 1);
  assertEquals(paginationRange("-3", "6").page, 1);
});

Deno.test("paginationRange defaults perPage to DEFAULT_PER_PAGE when missing or invalid", () => {
  assertEquals(paginationRange("1", undefined).perPage, DEFAULT_PER_PAGE);
  assertEquals(paginationRange("1", "bogus").perPage, DEFAULT_PER_PAGE);
  assertEquals(paginationRange("1", "0").perPage, DEFAULT_PER_PAGE);
});

Deno.test("paginationRange floors fractional values", () => {
  assertEquals(paginationRange("2.9", "6").page, 2);
});
