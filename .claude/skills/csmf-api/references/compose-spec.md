# The `compose` spec format

`node csmf.mjs compose <spec.json>` writes an entire post — the post row,
every block in order, images uploaded along the way, and optionally the
publish flip — from one JSON file.

## Shape

```jsonc
{
  "title": "Building Custom Composables with Custom Themes",  // required
  "subtitle": "A practical walkthrough",                       // optional
  "slug": "custom-composables-custom-themes",                  // optional, defaults to slugify(title)
  "locale": "en",                                              // "en" | "ro", defaults to "en"
  "pinned": false,                                             // optional
  "publish": false,                                            // optional; false = leave as draft
  "blocks": [ /* in render order */ ]
}
```

Block `display_order` is the array position — don't set it yourself.

## Block types

Each entry is `{ "type": ..., "content": {...} }`. The content shapes are
enforced server-side by `apps/supabase/functions/_shared/blocks.ts`; an
unknown field is a 400, not a silent drop.

| type | content |
|---|---|
| `heading` | `{ "text": "..." }` |
| `subheading` | `{ "text": "..." }` |
| `paragraph` | `{ "text": "..." }` |
| `code` | `{ "code": "...", "language": "kotlin" }` |
| `separator` | `{}` |
| `image` | `{ "url": "...", "alt_text": "...", "caption": "...", "source_text": "...", "source_url": "..." }` — only `url` is required |

### Images without a URL

An image block may carry `file` (a local path) or `imageUrl` (a remote URL
to re-host) **instead of** `content.url`. It's uploaded and the resulting
URL is filled in before the block is created:

```json
{ "type": "image", "file": "./out/hero.png", "content": { "alt_text": "..." } }
{ "type": "image", "imageUrl": "https://example.com/diagram.png", "content": { "caption": "..." } }
```

The **first** image block in the array becomes the post's preview image
automatically. Override it afterwards with `set-preview <postId> <blockId>`.

## Worked example

```json
{
  "title": "Kotlin Flows in Practice",
  "subtitle": "cold streams, hot streams, and when each one bites",
  "publish": false,
  "blocks": [
    { "type": "image", "file": "./images/hero.png",
      "content": { "alt_text": "Abstract stream illustration" } },
    { "type": "paragraph",
      "content": { "text": "A <code>Flow</code> is cold: nothing runs until it is collected." } },
    { "type": "subheading", "content": { "text": "Cold by default" } },
    { "type": "code",
      "content": { "code": "flow {\n  emit(1)\n  emit(2)\n}", "language": "kotlin" } },
    { "type": "separator", "content": {} },
    { "type": "paragraph",
      "content": { "text": "&bull; Cold flows restart per collector" } }
  ]
}
```

## Practical notes

- **Write the spec to a file, don't inline it.** A heredoc into
  `/tmp/post.json` then `compose /tmp/post.json` keeps the JSON out of the
  command line, where quoting breaks on real prose.
- **`text` accepts a subset of HTML** (`<code>`, `<strong>`, `<em>`, links).
  There is no list block type — existing posts use `&bull;` at the start of
  separate paragraph blocks. Check a neighbouring post with
  `csmf.mjs post <slug> --json` before inventing markup.
- **Newlines inside `code` are real `\n` in the JSON string** — that's what
  JSON escaping is for; don't reflow the snippet.
- **Partial failures leave a draft behind.** The error names the post id and
  how many blocks landed; continue with `add-block` or `delete-post`.
- **A long article is fine in one spec.** The size limit that matters is
  your own context, not the API's — building the spec file incrementally
  with a script and composing once is cheaper than many `add-block` calls.
