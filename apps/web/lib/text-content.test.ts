import { describe, expect, it } from "vitest";
import { stripHtml, estimateReadingMinutes, getExcerpt } from "./text-content";

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("returns an empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("estimateReadingMinutes", () => {
  it("rounds to the nearest minute at 200 words/minute", () => {
    const text = Array(400).fill("word").join(" ");
    const blocks = [{ type: "paragraph", content: { text } }];
    expect(estimateReadingMinutes(blocks)).toBe(2);
  });

  it("returns at least 1 minute for a short post", () => {
    const blocks = [{ type: "paragraph", content: { text: "Hi" } }];
    expect(estimateReadingMinutes(blocks)).toBe(1);
  });

  it("ignores non-text blocks (code, separator, image)", () => {
    const blocks = [
      { type: "paragraph", content: { text: Array(200).fill("word").join(" ") } },
      { type: "code", content: { code: Array(1000).fill("code").join(" "), language: "js" } },
      { type: "separator", content: {} },
    ];
    expect(estimateReadingMinutes(blocks)).toBe(1);
  });

  it("counts heading/subheading/paragraph text together", () => {
    const blocks = [
      { type: "heading", content: { text: Array(100).fill("word").join(" ") } },
      { type: "subheading", content: { text: Array(100).fill("word").join(" ") } },
      { type: "paragraph", content: { text: Array(200).fill("word").join(" ") } },
    ];
    expect(estimateReadingMinutes(blocks)).toBe(2);
  });
});

describe("getExcerpt", () => {
  it("returns the subtitle when present", () => {
    expect(getExcerpt("A subtitle", [])).toBe("A subtitle");
  });

  it("falls back to the first paragraph block's stripped text", () => {
    const blocks = [
      { type: "heading", content: { text: "Heading" } },
      { type: "paragraph", content: { text: "<p>First <em>paragraph</em>.</p>" } },
    ];
    expect(getExcerpt(null, blocks)).toBe("First paragraph .");
  });

  it("returns an empty string when there's no subtitle and no paragraph block", () => {
    expect(getExcerpt(null, [{ type: "heading", content: { text: "Heading" } }])).toBe("");
  });

  it("truncates a long paragraph to 160 characters with an ellipsis", () => {
    const longText = "word ".repeat(50).trim();
    const blocks = [{ type: "paragraph", content: { text: longText } }];
    const excerpt = getExcerpt(null, blocks);
    expect(excerpt.length).toBe(160);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});
