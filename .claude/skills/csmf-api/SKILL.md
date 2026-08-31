---
name: csmf-api
description: Read and write csmf.ro blog posts, content blocks, images and work experience through the Supabase Edge Functions REST API, using the bundled csmf.mjs CLI instead of the CSMF MCP server. Use whenever posts on csmf.ro need to be listed, read, drafted, edited, published, deleted or reordered and the CSMF_MCP tools aren't available (or you'd rather not pay for their schemas).
---

# csmf.ro via the REST API

Everything the CSMF MCP server does, over plain HTTP. Same backend, same
admin account, same RLS — `apps/mcp-server` was only ever a thin client of
this API, and so is this skill.

**Use `scripts/csmf.mjs`, not raw curl.** It handles sign-in, token caching
and refresh, multipart image uploads, and prints one compact line per record
instead of full JSON. Raw curl means re-deriving auth every time and paying
for response bodies you don't read.

```bash
CSMF=.claude/skills/csmf-api/scripts/csmf.mjs   # adjust for your cwd
node $CSMF help
```

## Setup (once per machine)

Reads are public and need nothing. **Writes need the admin credentials:**

```bash
export CSMF_ADMIN_EMAIL='...'
export CSMF_ADMIN_PASSWORD='...'
```

or, to avoid re-exporting every session, `~/.config/csmf/credentials.json`:

```json
{ "email": "...", "password": "..." }
```

`node $CSMF login` signs in and caches the session at
`~/.config/csmf/session.json` (mode 600). After that every command reuses
that token and refreshes it automatically — you never call `login` again
unless the password changes.

If a command reports the `auth` Edge Function returned 404, it hasn't been
deployed yet: `cd apps/supabase && supabase functions deploy auth`.

`CSMF_API_URL` overrides the API base (defaults to the production project).

## Reading

```bash
node $CSMF posts                          # all posts (drafts included, once signed in)
node $CSMF posts --status draft           # or --status published, --locale ro, --pinned
node $CSMF post <slug>                    # post + its blocks, in display order
node $CSMF post <uuid>                    # id works too
node $CSMF post <slug> --json             # full JSON when a summary field isn't enough
```

`posts` prints `id  status  locale  pinned  slug  "title"`; `post` adds one
line per block: `order  type  id  first 70 chars`. That's normally all you
need to decide what to edit — reach for `--json` only when you actually
need a field the summary drops.

## Writing a whole article — use `compose`

One command, one round trip's worth of tokens, and the post is never
visible half-written (it's created as a draft and only published after
every block lands).

```bash
node $CSMF compose article.json
```

The spec format and every block type's `content` shape are in
`references/compose-spec.md` — **read it before writing your first spec**.
Prefer this over `create-post` + a stream of `add-block` calls unless you're
deliberately building a post up incrementally.

On a mid-way failure the post stays as a draft with whatever blocks landed;
the error tells you its id so you can continue with `add-block` or start
over with `delete-post`.

## Writing incrementally

```bash
node $CSMF create-post --title "..." [--subtitle "..."] [--slug ...] [--locale ro] [--pinned]
node $CSMF add-block <postId> --type paragraph --text "..."
node $CSMF add-block <postId> --type code --code "$(cat snippet.kt)" --language kotlin
node $CSMF add-block <postId> --type image --file ./hero.png --alt "..." --caption "..."
node $CSMF add-block <postId> --type separator
node $CSMF update-block <blockId> --text "corrected text"
node $CSMF delete-block <blockId>
node $CSMF reorder-blocks <id,id,id>      # display_order becomes array position
node $CSMF update-post <postId> --title "..." --slug "..."
node $CSMF publish <postId>               # or: unpublish, delete-post
```

Slug defaults to `slugify(title)` when omitted. Locale defaults to `en`.

Blocks render in `display_order` ascending. **The API itself does not
append** — the column is `not null default 0`, so a raw `POST
/posts/{id}/blocks` without `display_order` drops the block at position 0,
on top of everything already there. `csmf.mjs add-block` looks up the
current maximum and appends for you; that's one of the reasons to use it
over curl. Pass `--order N` to place a block explicitly.

## Images

```bash
node $CSMF upload-image --file ./hero.png       # -> url  1200x630
node $CSMF upload-image --url https://.../x.png # re-hosts a remote image
node $CSMF set-preview <postId> <blockId|none>
```

`add-block --type image` and compose's image blocks upload for you — a
separate `upload-image` is only needed when you want the URL first. The
**first image block added to a post becomes its preview image
automatically**; `set-preview` only overrides that.

`references/images.md` in the sibling `write-csmf-blog-post` skill covers
how to *make* the images; this skill only covers getting them uploaded.

## Work experience

```bash
node $CSMF work [--locale ro]
node $CSMF create-work --company "..." --role "..." [--description "..."] [--start 2020-01-01] [--end 2023-06-30]
node $CSMF update-work <id> [--role "..."] [--end null]     # --end null = ongoing
node $CSMF delete-work <id>
node $CSMF reorder-work <id,id,id>
```

## Anything else

Comments moderation, `about-me`, `social-links`, and `newsletter` have Edge
Functions but no wrapper here — reach them through the escape hatch, which
still handles auth for you:

```bash
node $CSMF api GET /comments?status=pending
node $CSMF api PATCH /comments/<id> '{"status":"approved"}'
```

The full route list is `apps/api-docs/openapi.yaml` (Swagger UI:
`pnpm --filter @csmf/api-docs dev`). Consult it rather than guessing a
shape — and if you change a route, update that spec in the same change.

## Gotchas

- **Paragraph blocks accept a subset of HTML, and there are no list
  blocks.** Existing posts fake bullets with `&bull;` inside separate
  paragraph blocks. Check how a neighbouring post does it before inventing
  markup.
- **`--code` content is passed verbatim.** Use `--code "$(cat file)"` for
  anything multi-line rather than trying to escape it inline.
- **Publishing is a decision, not a step.** Unless Cosmin explicitly said
  to publish, leave the post as a draft for his review.
- **Writing the prose is a different job.** For voice, structure and image
  recipes, the `write-csmf-blog-post` skill is the authority — this skill
  is only the transport. Use both together: draft there, ship here.
