// Inserts a literal tab character at the cursor (replacing any selection),
// for textareas where Tab should indent instead of moving focus away.
export function insertTab(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): { text: string; cursor: number } {
  const next = text.slice(0, selectionStart) + "\t" + text.slice(selectionEnd);
  return { text: next, cursor: selectionStart + 1 };
}
