import { describe, expect, it } from "vitest";
import { stripParagraphWrapper, wrapInParagraph } from "./block-html";

describe("stripParagraphWrapper", () => {
  it("removes a single wrapping <p> tag", () => {
    expect(stripParagraphWrapper("<p>Hello <strong>world</strong></p>")).toBe("Hello <strong>world</strong>");
  });

  it("returns the input unchanged when there's no wrapping <p>", () => {
    expect(stripParagraphWrapper("Hello world")).toBe("Hello world");
  });

  it("leaves an empty paragraph as an empty string", () => {
    expect(stripParagraphWrapper("<p></p>")).toBe("");
  });
});

describe("wrapInParagraph", () => {
  it("wraps inline HTML in a <p> tag", () => {
    expect(wrapInParagraph("Hello <strong>world</strong>")).toBe("<p>Hello <strong>world</strong></p>");
  });
});

describe("round-trip", () => {
  it("returns the original text after wrap then strip", () => {
    const text = "Some <em>formatted</em> text";
    expect(stripParagraphWrapper(wrapInParagraph(text))).toBe(text);
  });
});
