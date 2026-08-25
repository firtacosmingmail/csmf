import { describe, expect, it } from "vitest";
import { insertTab } from "./textarea-tab";

describe("insertTab", () => {
  it("inserts a tab at the cursor position", () => {
    expect(insertTab("ab", 1, 1)).toEqual({ text: "a\tb", cursor: 2 });
  });

  it("replaces a selection with a tab", () => {
    expect(insertTab("hello world", 0, 5)).toEqual({ text: "\t world", cursor: 1 });
  });

  it("inserts at the start", () => {
    expect(insertTab("abc", 0, 0)).toEqual({ text: "\tabc", cursor: 1 });
  });

  it("inserts at the end", () => {
    expect(insertTab("abc", 3, 3)).toEqual({ text: "abc\t", cursor: 4 });
  });
});
