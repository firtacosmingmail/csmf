import { describe, expect, it } from "vitest";
import { totalPages } from "./pagination";

describe("totalPages", () => {
  it("rounds up to cover the remainder", () => {
    expect(totalPages(13, 6)).toBe(3);
  });

  it("returns exactly the quotient when it divides evenly", () => {
    expect(totalPages(12, 6)).toBe(2);
  });

  it("returns at least 1 even when there are no items", () => {
    expect(totalPages(0, 6)).toBe(1);
  });
});
