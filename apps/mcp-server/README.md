# @csmf/mcp-server

An [MCP](https://modelcontextprotocol.io) server that lets an AI agent author
csmf.ro blog posts — create, edit, add content blocks, upload images,
publish — without opening `/admin` in a browser.

It's a thin client of the same Edge Functions REST API `apps/web` uses
(`apps/supabase/functions/`, documented in `apps/api-docs/openapi.yaml`).
No new backend code, no service-role bypass: this process signs in as the
single admin account (the same one you use to log into `/admin`) via
Supabase Auth, and every write goes through the Edge Functions with that
session's JWT attached — so RLS applies exactly as it does for the admin
UI. See `docs/DESIGN.md` and `CLAUDE.md` at the repo root for the wider
architecture.

## Setup

```bash
cd apps/mcp-server
cp .env.example .env
```

Fill in `.env`:

- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — same values as
  `apps/web/.env.local`'s `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_ADMIN_EMAIL` / `SUPABASE_ADMIN_PASSWORD` — the admin account's
  login. Kept in memory only, for as long as this process runs.

Then, from the repo root:

```bash
pnpm install
pnpm --filter @csmf/mcp-server build
```

## Using it from an MCP client

Point your client at the built entrypoint with a stdio transport. For
Claude Code / Claude Desktop, add to its MCP config (`claude mcp add`, or
hand-edit the config file):

```json
{
  "mcpServers": {
    "csmf-blog": {
      "command": "node",
      "args": ["/absolute/path/to/csmf/app/apps/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project-ref.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-or-publishable-key",
        "SUPABASE_ADMIN_EMAIL": "you@example.com",
        "SUPABASE_ADMIN_PASSWORD": "your-admin-password"
      }
    }
  }
}
```

(Env vars can go in the client config as above, or be picked up from
`apps/mcp-server/.env` if you run it with `pnpm --filter @csmf/mcp-server dev`
instead — that runs `src/index.ts` directly via `tsx`, no build step, handy
while iterating on the server itself. `.env` isn't loaded automatically by
`node dist/index.js`, only by whatever launches the process, so pass the
vars there — most MCP clients, including the config above, do this via the
server's `env` block.)

## Tools

- **Posts**: `list_posts`, `get_post`, `create_post`, `update_post`,
  `publish_post`, `unpublish_post`, `delete_post`, `set_preview_image`.
- **Blocks**: `add_block`, `update_block`, `delete_block`,
  `reorder_blocks`.
- **Images**: `upload_image` (from a local file path or a remote URL).
- **Compose**: `create_post_with_content` — writes an entire post (post +
  every block, optionally publishing) in one call. The fastest path for
  "write me a post about X" — prefer it over `create_post` +
  repeated `add_block` unless you need to build the post up incrementally.
- **Work experience**: `list_work_experience`, `create_work_experience`,
  `update_work_experience`, `delete_work_experience`,
  `reorder_work_experience`.

Every tool's `description` documents its own input shape in detail
(including the per-block-type `content` shape, which mirrors
`apps/supabase/functions/_shared/blocks.ts`) — an MCP client reads those at
connect time, so they aren't repeated here.

## What this intentionally doesn't do

Scoped to posts and work experience, matching what was asked for. Not
covered: comment moderation, `about_me`/`social_links`, newsletter
subscribers, or translations (posts and work experience both support
`en`/`ro` via `translation_group_id`, and their tools accept `locale`, but
there's no dedicated "create a translation of this X" tool yet). All of
that already has its own Edge Function and could get MCP tools the same
way this package's `src/tools/*.ts` do, if it turns out to be useful.

## Deploying it remotely (Vercel)

This package is the local stdio version — a client that only makes sense
running as a subprocess of an MCP client on the same machine. For a hosted
version reachable over HTTP (deployable to Vercel, usable from any
machine), see [`apps/mcp-server-http`](../mcp-server-http/README.md). It
reuses this package's tools and API client unchanged — only the transport
and auth differ.

One consequence of that: `upload_image`'s `filePath` option only works
when the server and the caller are the same machine (true here, false for
the Vercel deployment). Against a remote server, either use `imageUrl`, or
have the caller read the local file itself and pass its bytes via
`fileData` (base64) instead — see that tool's description.

## Notes for future changes

- If a post/block/image/work-experience Edge Function route changes shape,
  update the matching method in `src/api-client.ts` (and the tool
  description in `src/tools/`, if the change affects what a caller needs
  to pass).
- `src/slugify.ts` is a hand-kept copy of `apps/web/lib/slugify.ts` — there's
  no shared package between them, so a change to one should be mirrored in
  the other.
- Auth (`src/auth.ts`) is intentionally the *only* place this package talks
  to anything other than the Edge Functions — everything else goes through
  `api-client.ts`, same as `apps/web` never queries Postgres directly.
