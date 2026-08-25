// The block editor's Tiptap instances use a single-paragraph document (so
// bold/italic/code/link marks are available without letting a heading or
// paragraph block contain multiple lines). Blocks store just the inline
// content in `content.text`, so the wrapping <p> is added/removed at the
// editor boundary rather than persisted.
export function stripParagraphWrapper(html: string): string {
  const match = html.match(/^<p>([\s\S]*)<\/p>$/);
  return match ? match[1] : html;
}

export function wrapInParagraph(text: string): string {
  return `<p>${text}</p>`;
}
