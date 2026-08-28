# CSMF_MCP cheat sheet

If `mcp__CSMF_MCP__*` tools aren't in the current tool list, they may be
deferred — load them with `ToolSearch` (`select:mcp__CSMF_MCP__create_post,...`)
before the first call.

## Block types

A post is a `title`/`subtitle`/`status`/`slug` shell plus an ordered list
of typed content blocks. Types and their `content` shape (exact — extra
fields are rejected):

| type | content | notes |
|---|---|---|
| `heading` | `{ text }` | renders as `<h2>`, inline HTML only |
| `subheading` | `{ text }` | renders as `<h3>`, inline HTML only |
| `paragraph` | `{ text }` | renders as `<p>`, inline HTML only |
| `code` | `{ code, language }` | `language` should be a Shiki language id (`typescript`, `kotlin`, `python`, `bash`, `json`, `yaml`, ...); unknown ids just render unhighlighted, no error |
| `separator` | `{}` | renders as `<hr>` |
| `image` | `{ url, alt_text?, caption?, source_text?, source_url? }` | `url` must come from `upload_image` first (or use `create_post_with_content`'s `filePath`/`imageUrl` shortcut, which uploads for you) |

`text` fields accept inline HTML (`<strong>`, `<a href>`, `<em>`, `<code>`)
— **no wrapping block tag**, the renderer already wraps it in `<p>`/`<h2>`/
`<h3>` itself.

### Gotcha: don't put `<ul>`/`<li>` in a paragraph block

The public site imports Tailwind v4 with its default preflight, which
strips default list styling (no bullets, no indent) unless a component
explicitly re-adds it — and the block renderer doesn't. A `<ul>` you inject
into a `paragraph` block's `text` will render as unstyled, unindented
stacked lines with no bullet marker, not a real list. This is why the
writing-style guide defaults to prose, and why the fallback for list-like
content is a run of separate `paragraph` blocks each starting with an em
dash, not HTML list markup. (Re-check `apps/web/components/post-blocks-renderer.tsx`
if this skill feels stale — the renderer is short and worth reading
directly if something here doesn't match what you see.)

## Building the post: chunk a long one

For a ≥1000-word post with images, don't try to cram everything into one
`create_post_with_content` call — build it up so you can check in with
Cosmin and catch problems early:

1. `create_post` — title, subtitle, slug (default is fine), `locale`,
   `status: "draft"` (the default — leave it a draft until step 6 of the
   main workflow).
2. `add_block` for the hero image **first** (`displayOrder: 0`) — the
   first image block added to a post automatically becomes its preview
   image (the thumbnail on list rows, and the hero atop the post page).
   No need to call `set_preview_image` unless you later want to override
   that choice.
3. `add_block` for the intro paragraph, then each section's
   heading/paragraph/code blocks in order, setting `displayOrder`
   explicitly as you go (0, 1, 2, ...) — for a multi-block post this
   matters, the editor UI always sets it explicitly too.
4. `add_block` the supporting image roughly where `displayOrder` puts it
   at the post's midpoint.
5. If you built blocks out of order, or want to move something,
   `reorder_blocks` with the full ordered id list fixes it in one call.

`create_post_with_content` (single call: create + every block +
optional publish) is fine for a **short, simple** post you're confident
in end to end — it's the fast path, but for a long post the incremental
approach above makes it easier to review a section, fix a paragraph, or
swap an image without redoing the whole post. If a `create_post_with_content`
call fails partway through, whatever blocks were already added are left in
place as a draft (not rolled back) — fix the error and continue with
`add_block`/`update_block`, or `delete_post` to start clean.

## Checking word count

Blocks don't carry a word count. After building the post, `get_post` by
`slug` (returns blocks), concatenate the `text`/`code` content of every
`heading`/`subheading`/`paragraph`/`code` block, strip HTML tags, and
count words — or just do a rough manual read-through if that's faster.
Aim for ≥1000; if it's short, that's a signal a section needs more
substance (an example, a "why this matters," a pitfall to avoid), not
padding.

## Publishing

`publish_post` makes the post **immediately visible to anonymous
visitors** — this is "publishing/posting public content," which needs
explicit confirmation from Cosmin in chat before you call it, every time,
even though he's the one who asked for the post. Default to leaving it as
a draft and telling him it's ready for review; publish only once he says
go (or if his original request already explicitly said "publish it").

`locale` defaults to `"en"`; pass `"ro"` if Cosmin asked for a Romanian
post. `pinned` defaults to `false` — only set it if he asks to pin the
post to the top of the list.
