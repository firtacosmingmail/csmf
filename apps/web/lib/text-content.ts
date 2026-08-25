// Block content.text is HTML from the block editor's Tiptap instances (see
// components/block-editor/), not markdown — strip tags for plain-text uses
// like word counts and excerpts.
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const WORDS_PER_MINUTE = 200;

type TextBlock = { type: string; content: unknown };

// Computed on read (from the post's current blocks) rather than stored on
// the post row — blocks change independently of any /posts write, so a
// stored value would drift stale between edits.
export function estimateReadingMinutes(blocks: readonly TextBlock[]): number {
  const text = blocks
    .filter((block) => block.type === "heading" || block.type === "subheading" || block.type === "paragraph")
    .map((block) => {
      const content = block.content as Record<string, unknown>;
      return typeof content.text === "string" ? stripHtml(content.text) : "";
    })
    .join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

const EXCERPT_MAX_LENGTH = 160;

// Falls back to the first paragraph block when there's no subtitle — used
// for SEO/OG descriptions.
export function getExcerpt(subtitle: string | null, blocks: readonly TextBlock[]): string {
  if (subtitle) return subtitle;

  const firstParagraph = blocks.find((block) => block.type === "paragraph");
  if (!firstParagraph) return "";

  const content = firstParagraph.content as Record<string, unknown>;
  const text = typeof content.text === "string" ? stripHtml(content.text) : "";
  return text.length > EXCERPT_MAX_LENGTH ? `${text.slice(0, EXCERPT_MAX_LENGTH - 1).trimEnd()}…` : text;
}
