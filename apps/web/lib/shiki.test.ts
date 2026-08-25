import { describe, expect, it, vi } from "vitest";

const codeToHtml = vi.fn();
vi.mock("shiki", () => ({ codeToHtml: (...args: unknown[]) => codeToHtml(...args) }));

const { highlightCode, highlightCodeBlocks } = await import("./shiki");

describe("highlightCode", () => {
  it("highlights with the given language", async () => {
    codeToHtml.mockResolvedValueOnce("<pre>js</pre>");
    const html = await highlightCode("const x = 1", "js");
    expect(html).toBe("<pre>js</pre>");
    expect(codeToHtml).toHaveBeenCalledWith("const x = 1", { lang: "js", theme: "github-light" });
  });

  it("defaults to the text language when none is given", async () => {
    codeToHtml.mockResolvedValueOnce("<pre>plain</pre>");
    await highlightCode("hello", "");
    expect(codeToHtml).toHaveBeenCalledWith("hello", { lang: "text", theme: "github-light" });
  });

  it("falls back to the text language when the given one isn't recognized", async () => {
    codeToHtml.mockRejectedValueOnce(new Error("Unknown language"));
    codeToHtml.mockResolvedValueOnce("<pre>fallback</pre>");
    const html = await highlightCode("hello", "not-a-real-language");
    expect(html).toBe("<pre>fallback</pre>");
    expect(codeToHtml).toHaveBeenLastCalledWith("hello", { lang: "text", theme: "github-light" });
  });
});

describe("highlightCodeBlocks", () => {
  it("only transforms code blocks, leaving others untouched", async () => {
    codeToHtml.mockResolvedValueOnce("<pre>highlighted</pre>");
    const blocks = [
      { type: "paragraph", content: { text: "hi" } },
      { type: "code", content: { code: "1+1", language: "js" } },
    ];

    const result = await highlightCodeBlocks(blocks);

    expect(result[0]).toEqual(blocks[0]);
    expect(result[1]).toEqual({
      type: "code",
      content: { code: "1+1", language: "js", highlightedHtml: "<pre>highlighted</pre>" },
    });
  });
});
