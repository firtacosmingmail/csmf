# @csmf/mcp-server-http

The same [MCP](https://modelcontextprotocol.io) tools as
[`@csmf/mcp-server`](../mcp-server/README.md) — create/edit/publish csmf.ro
blog posts without opening `/admin` — but reachable over the network
instead of run as a local stdio subprocess, so it can be deployed (to
Vercel) and used from a machine other than the one the code is checked out
on.

It's a thin Next.js wrapper: `app/api/mcp/route.ts` is the only real logic
here. It imports `createApiClient`/`createServer` from `@csmf/mcp-server`'s
*compiled* `dist/` output (via that package's `"exports"` field —
`transpilePackages` isn't needed, see `next.config.ts`) and wires them up with the
`@modelcontextprotocol/sdk`'s own `WebStandardStreamableHTTPServerTransport`
— no separate MCP implementation, no duplicated tool code. Everything in
`@csmf/mcp-server`'s README (what the tools do, the Edge Functions/RLS
model, the intentional scope limits) applies here unchanged; this package
only adds transport and auth.

## Why not `mcp-handler`?

Vercel's own docs point at the `mcp-handler` npm package for Next.js MCP
routes. It was evaluated and deliberately not used here: it depends on a
separate `@modelcontextprotocol/server` package (a different, newer
implementation than the `@modelcontextprotocol/sdk` this repo already uses
for the stdio server), which would mean two MCP SDKs in the tree with their
own types and no guarantee they'd stay compatible. Building directly on
`@modelcontextprotocol/sdk`'s `WebStandardStreamableHTTPServerTransport`
(a Web-standard-`Request`/`Response` transport the SDK ships itself) keeps
a single SDK version and lets this app reuse `@csmf/mcp-server`'s tool
registration exactly as-is.

## A serverless-specific gotcha worth knowing

`WebStandardStreamableHTTPServerTransport` in stateless mode
(`sessionIdGenerator: undefined`, which is what a single Vercel function
instance handling independent requests needs) can only handle **one**
`handleRequest()` call — calling it a second time on the same transport
throws `Stateless transport cannot be reused across requests`. So
`route.ts` builds a fresh `McpServer` + fresh transport pair on *every*
request (cheap — it's just tool registration) while reusing the one
`ApiClient` (and the admin session it holds) across requests within a warm
instance, via a lazily-initialized module-level singleton — lazy so that
`next build`'s page-data-collection step, which imports route modules
without a runtime environment, doesn't fail for lack of `SUPABASE_*` env
vars.

## Auth

There's no per-user login — this is a personal tool with exactly one
intended caller, same trust model as the stdio server's `.env` credentials.
The endpoint instead requires a single shared-secret bearer token:

```
Authorization: Bearer <MCP_AUTH_TOKEN>
```

checked with `crypto.timingSafeEqual` (`lib/require-auth.ts`) and failing
closed — a missing/wrong header is `401`, a missing `MCP_AUTH_TOKEN`
env var is `500` rather than silently open. Generate a token with:

```bash
openssl rand -hex 32
```

## Local development

```bash
cd apps/mcp-server-http
cp .env.example .env.local
```

Fill in `.env.local` the same way as `apps/mcp-server/.env` (see that
package's README), plus `MCP_AUTH_TOKEN`. Then, from the repo root:

```bash
pnpm install
pnpm --filter @csmf/mcp-server build   # builds @csmf/mcp-server's dist/ — this app imports the compiled output, not raw source
pnpm --filter @csmf/mcp-server-http dev
```

(The first line is only needed once, and again whenever `@csmf/mcp-server`'s
source changes — this app resolves `@csmf/mcp-server` via its `"exports"`
field, which points at `dist/`, not `src/`. Running `pnpm build` from the
repo root instead runs everything through Turborepo's task graph, which
rebuilds `dist/` automatically before building this app — see
[Deploying to Vercel](#deploying-to-vercel).)

This starts the Next.js dev server (default `http://localhost:3000`); the
MCP endpoint is `http://localhost:3000/api/mcp`.

## Deploying to Vercel

1. Import the repo into a new Vercel project (or add it as an existing
   project's second app) with **Root Directory** set to
   `apps/mcp-server-http`.
2. Set the same environment variables as `.env.example` in the Vercel
   project's Environment Variables settings: `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_ADMIN_EMAIL`, `SUPABASE_ADMIN_PASSWORD`,
   `MCP_AUTH_TOKEN`.
3. Deploy. Vercel auto-detects the Turborepo setup at the repo root and
   runs `turbo run build` scoped to this app, which (via `turbo.json`'s
   `"build": { "dependsOn": ["^build"] }`) builds `@csmf/mcp-server`'s
   `dist/` first automatically — no extra configuration needed. The
   endpoint is `https://<your-deployment>.vercel.app/api/mcp`.

## Connecting a client

**Claude Code:**

```bash
claude mcp add --transport http csmf-blog https://<your-deployment>.vercel.app/api/mcp \
  --header "Authorization: Bearer <your MCP_AUTH_TOKEN>"
```

**Claude Desktop:** remote (HTTP) MCP servers are added under Settings →
Connectors → "Add custom connector", using the same URL and bearer token.
(Check Anthropic's current docs for the exact field layout — this changes
more often than the stdio config shape documented in
`apps/mcp-server/README.md`.)

## Notes for future changes

- Tool logic, the API client, and auth all live in `@csmf/mcp-server` —
  change them there; this app only owns `app/api/mcp/route.ts` (transport
  wiring) and `lib/require-auth.ts` (bearer-token check).
- If `@csmf/mcp-server` adds a new export other than
  `createApiClient`/`createServer`, no change is needed here unless
  `route.ts` itself needs it — this app deliberately only touches its
  `"exports"`-published surface, not internals like `api-client.ts`.
