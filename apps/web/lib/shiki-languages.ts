import { bundledLanguagesInfo } from "shiki";

// Drives the code block's language <select> — sourced straight from
// Shiki's own bundle so it never drifts from what lib/shiki.ts can
// actually highlight.
export const CODE_LANGUAGES: { id: string; name: string }[] = bundledLanguagesInfo
  .map(({ id, name }) => ({ id, name }))
  .sort((a, b) => a.name.localeCompare(b.name));
