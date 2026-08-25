import { codeToHtml } from "shiki";

const THEME = "github-light";

// Falls back to Shiki's "text" (plain, no-highlight) language whenever the
// language a post's code block was saved with isn't one Shiki recognizes —
// it's free-typed in the editor, not chosen from a fixed list.
export async function highlightCode(code: string, language: string): Promise<string> {
  const lang = language.trim() || "text";
  try {
    return await codeToHtml(code, { lang, theme: THEME });
  } catch {
    return await codeToHtml(code, { lang: "text", theme: THEME });
  }
}

// Renders syntax-highlighted HTML for every code block in a list, leaving
// every other block untouched. Used server-side before handing blocks to
// PostBlocksRenderer, which prefers content.highlightedHtml when present.
export async function highlightCodeBlocks<T extends { type: string; content: unknown }>(
  blocks: T[],
): Promise<T[]> {
  return Promise.all(
    blocks.map(async (block) => {
      if (block.type !== "code") return block;
      const content = block.content as Record<string, unknown>;
      const code = typeof content.code === "string" ? content.code : "";
      const language = typeof content.language === "string" ? content.language : "";
      const highlightedHtml = await highlightCode(code, language);
      return { ...block, content: { ...content, highlightedHtml } };
    }),
  );
}
