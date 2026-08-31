#!/usr/bin/env node
// csmf.mjs — one-file CLI for the csmf.ro Edge Functions API.
//
// Exists so an agent can author posts without the CSMF MCP server: it does
// the same work as apps/mcp-server's tools, but as short shell commands
// with terse output, which is far cheaper in tokens than tool schemas plus
// raw JSON bodies. Auth is handled for you — sign in once, the session is
// cached on disk and refreshed automatically.
//
// Zero dependencies, Node 18+ (built-in fetch/FormData/File).
// Run `node csmf.mjs help` for the command list.

import { readFile, writeFile, mkdir, chmod } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, extname, basename } from "node:path";

const DEFAULT_API_URL = "https://ieidicunbwtmdingurgt.supabase.co/functions/v1";
const CONFIG_DIR = join(homedir(), ".config", "csmf");
const SESSION_FILE = join(CONFIG_DIR, "session.json");
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");
const REFRESH_SKEW_S = 120;

// ---------------------------------------------------------------- config

async function loadCredentials() {
  let fromFile = {};
  if (existsSync(CREDENTIALS_FILE)) {
    try {
      fromFile = JSON.parse(await readFile(CREDENTIALS_FILE, "utf8"));
    } catch {
      fail(`${CREDENTIALS_FILE} is not valid JSON`);
    }
  }
  const apiUrl = (process.env.CSMF_API_URL || fromFile.api_url || DEFAULT_API_URL).replace(/\/$/, "");
  const email = process.env.CSMF_ADMIN_EMAIL || fromFile.email;
  const password = process.env.CSMF_ADMIN_PASSWORD || fromFile.password;
  return { apiUrl, email, password };
}

async function readSession() {
  if (!existsSync(SESSION_FILE)) return null;
  try {
    return JSON.parse(await readFile(SESSION_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function writeSession(session) {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(SESSION_FILE, JSON.stringify(session, null, 2));
  await chmod(SESSION_FILE, 0o600);
}

// ------------------------------------------------------------------ auth

// A cached access token is reused until it's within REFRESH_SKEW_S of
// expiry, then refreshed (or re-signed-in if the refresh token is dead
// too), so a run of commands costs exactly one sign-in.
// `optional: true` returns a null token instead of exiting when nothing is
// configured — used for GETs, which RLS already serves anonymously (public
// posts only). Writes always demand a real session.
async function getAccessToken({ force = false, optional = false } = {}) {
  const { apiUrl, email, password } = await loadCredentials();
  const cached = force ? null : await readSession();
  const now = Math.floor(Date.now() / 1000);

  if (cached?.access_token && cached.expires_at - REFRESH_SKEW_S > now) {
    return { token: cached.access_token, apiUrl };
  }

  if (cached?.refresh_token) {
    const refreshed = await authRequest(apiUrl, "/auth/refresh", { refresh_token: cached.refresh_token });
    if (refreshed) {
      await writeSession(refreshed);
      return { token: refreshed.access_token, apiUrl };
    }
  }

  if (!email || !password) {
    if (optional) return { token: null, apiUrl };
    fail(
      "No credentials. Set CSMF_ADMIN_EMAIL and CSMF_ADMIN_PASSWORD, or write " +
        `${CREDENTIALS_FILE} as {"email":"...","password":"..."}.`,
    );
  }

  const session = await authRequest(apiUrl, "/auth", { email, password }, { throwOnError: true });
  await writeSession(session);
  return { token: session.access_token, apiUrl };
}

async function authRequest(apiUrl, path, body, { throwOnError = false } = {}) {
  const res = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 404 here means the `auth` Edge Function isn't deployed on this
    // project — a setup problem, not a credentials problem, and worth
    // saying so plainly rather than reporting "sign-in failed".
    if (res.status === 404) {
      fail(
        `${apiUrl}${path} returned 404 — the \`auth\` Edge Function isn't deployed on this project. ` +
          "From apps/supabase, run: supabase functions deploy auth",
      );
    }
    if (throwOnError) fail(`Sign-in failed (${res.status}): ${parsed.error ?? "unknown error"}`);
    return null;
  }
  return parsed;
}

// ------------------------------------------------------------------- api

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Throws rather than exiting, so a multi-step command (compose) can catch
// a mid-way failure and report what it already wrote. main()'s catch turns
// an uncaught one into the same message fail() would have printed.
//
// A 401/403 on a *write* is retried once with a forced sign-in: a cached
// token can be unexpired by the clock yet still rejected (password
// changed, session revoked, session file stale), and re-authenticating is
// the fix in every one of those cases.
async function api(method, path, { body, formData, retriedAuth = false } = {}) {
  const { token, apiUrl } = await getAccessToken({ optional: method === "GET" });
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${apiUrl}${path}`, { method, headers, body: payload });
  if (res.status === 204) return null;
  const parsed = await res.json().catch(() => ({}));

  if ((res.status === 401 || res.status === 403) && token && !retriedAuth) {
    await getAccessToken({ force: true });
    // FormData is a one-shot stream once sent, so a multipart upload can't
    // be replayed — the caller re-runs it against the now-fresh session.
    if (formData) throw new ApiError("Session was rejected and has been renewed — re-run the command.", res.status);
    return api(method, path, { body, retriedAuth: true });
  }

  if (!res.ok) throw new ApiError(`${method} ${path} -> ${res.status}: ${parsed.error ?? JSON.stringify(parsed)}`, res.status);
  return parsed;
}

// --------------------------------------------------------------- helpers

function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

// Mirrors apps/web/lib/slugify.ts and apps/mcp-server/src/slugify.ts.
function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Flags parse as --key value, or --key for a boolean. Everything else is a
// positional. `--` ends flag parsing.
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Default output is one compact line per record — the whole point of this
// script over raw curl. `--json` opts back into full JSON when a field the
// summary drops is actually needed.
let jsonMode = false;
function out(value, summarize) {
  if (jsonMode || !summarize) {
    process.stdout.write(`${JSON.stringify(value, null, jsonMode ? 2 : 0)}\n`);
  } else {
    process.stdout.write(`${summarize(value)}\n`);
  }
}

const postLine = (p) =>
  `${p.id}  ${p.status.padEnd(9)} ${p.locale}  ${p.pinned ? "pinned " : "       "}${p.slug}  "${p.title}"`;

const blockLine = (b) => {
  const c = b.content ?? {};
  const preview = c.text ?? c.code ?? c.url ?? "";
  const trimmed = String(preview).replace(/\s+/g, " ").slice(0, 70);
  return `${String(b.display_order).padStart(3)}  ${b.type.padEnd(10)} ${b.id}  ${trimmed}`;
};

const workLine = (w) =>
  `${w.id}  ${String(w.display_order).padStart(3)}  ${w.locale}  ${w.company} — ${w.role}  ` +
  `(${w.start_date ?? "?"} → ${w.end_date ?? "present"})`;

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

async function uploadImage({ file, url }) {
  let bytes;
  let name;
  let type;
  if (file) {
    bytes = await readFile(file);
    name = basename(file);
    type = MIME[extname(file).toLowerCase()];
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new ApiError(`Failed to download ${url}: HTTP ${res.status}`, res.status);
    bytes = Buffer.from(await res.arrayBuffer());
    name = new URL(url).pathname.split("/").pop() || "image";
    type = res.headers.get("content-type") ?? MIME[extname(name).toLowerCase()];
  }
  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes)], name, type ? { type } : {}));
  return api("POST", "/images", { formData: form });
}

// Builds a block's `content` from flags, per type (mirrors
// apps/supabase/functions/_shared/blocks.ts). Image blocks can take a
// local path or remote URL instead of a url, and get uploaded first.
async function blockContentFromFlags(type, flags) {
  switch (type) {
    case "heading":
    case "subheading":
    case "paragraph": {
      const text = flags.text ?? flags.content;
      if (typeof text !== "string") fail(`--text is required for a ${type} block`);
      return { text };
    }
    case "code": {
      if (typeof flags.code !== "string") fail("--code is required for a code block");
      return { code: flags.code, language: flags.language ?? "text" };
    }
    case "separator":
      return {};
    case "image": {
      let url = flags.url;
      if (!url && (flags.file || flags["image-url"])) {
        const uploaded = await uploadImage({ file: flags.file, url: flags["image-url"] });
        url = uploaded.url;
      }
      if (!url) fail("an image block needs --url, --file <path>, or --image-url <remote url>");
      const content = { url };
      if (flags.alt) content.alt_text = flags.alt;
      if (flags.caption) content.caption = flags.caption;
      if (flags["source-text"]) content.source_text = flags["source-text"];
      if (flags["source-url"]) content.source_url = flags["source-url"];
      return content;
    }
    default:
      return fail(`unknown block type: ${type}`);
  }
}

// The API doesn't append: `display_order` is `not null default 0`, so a
// block created without one lands at position 0, on top of everything
// else. The MCP server just documents that trap; this computes the next
// slot instead, so `add-block` without --order does what it looks like.
async function nextDisplayOrder(postId) {
  const { posts } = await api("GET", `/posts?id=${encodeURIComponent(postId)}`);
  if (!posts?.length) fail(`no post with id ${postId}`);
  const { slug, locale } = posts[0];
  const body = await api("GET", `/posts/${encodeURIComponent(slug)}?locale=${locale}`);
  const existing = body.post?.post_blocks ?? [];
  if (!existing.length) return 0;
  return Math.max(...existing.map((b) => b.display_order ?? 0)) + 1;
}

// ---------------------------------------------------------------- compose

// The single biggest token saver: one JSON file in, a whole post out. Image
// blocks may carry `file` (local path) or `imageUrl` (remote) instead of
// content.url and get uploaded on the way through. The post is created as
// a draft and only flipped to published after every block lands, so a
// partial write is never visible to visitors — same contract as the MCP
// server's create_post_with_content.
async function compose(specPath) {
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  if (!spec.title) fail("compose spec needs a `title`");
  const blocks = spec.blocks ?? [];

  const post = await api("POST", "/posts", {
    body: {
      title: spec.title,
      subtitle: spec.subtitle ?? null,
      slug: spec.slug || slugify(spec.title),
      locale: spec.locale ?? "en",
      pinned: spec.pinned ?? false,
      status: "draft",
    },
  }).then((r) => r.post);

  const created = [];
  try {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      let content = { ...(b.content ?? {}) };
      if (b.type === "image" && typeof content.url !== "string") {
        if (!b.file && !b.imageUrl) {
          throw new Error(`block ${i} is an image with no content.url, file, or imageUrl`);
        }
        const uploaded = await uploadImage({ file: b.file, url: b.imageUrl });
        content = { ...content, url: uploaded.url };
      }
      const res = await api("POST", `/posts/${post.id}/blocks`, {
        body: { type: b.type, content, display_order: i },
      });
      created.push(res.block);
    }
  } catch (err) {
    fail(
      `${err.message ?? err}\nPost ${post.id} (${post.slug}) exists as a draft with ` +
        `${created.length}/${blocks.length} blocks. Fix and continue with add-block, or delete-post to start over.`,
    );
  }

  const final = spec.publish ? (await api("PATCH", `/posts/${post.id}`, { body: { status: "published" } })).post : post;
  return { post: final, blocks: created };
}

// ---------------------------------------------------------------- commands

const HELP = `csmf.mjs — csmf.ro Edge Functions API client

Auth (reads CSMF_ADMIN_EMAIL / CSMF_ADMIN_PASSWORD, or ~/.config/csmf/credentials.json)
  login                            Sign in and cache the session
  token                            Print the current access token
  logout                           Discard the cached session

Posts
  posts [--status draft|published] [--locale en|ro] [--pinned] [--json]
  post <slug|id> [--locale en|ro] [--json]     Post + its ordered blocks
  create-post --title T [--subtitle S] [--slug S] [--locale en|ro] [--pinned] [--publish]
  update-post <id> [--title T] [--subtitle S] [--slug S] [--pinned true|false]
  publish <id> | unpublish <id> | delete-post <id>
  set-preview <postId> <blockId|none>

Blocks
  add-block <postId> --type heading|subheading|paragraph|code|separator|image [--order N]
      heading/subheading/paragraph : --text "..."
      code                         : --code "..." [--language kotlin]
      image                        : --file PATH | --image-url URL | --url ALREADY_HOSTED
                                     [--alt "..."] [--caption "..."] [--source-text "..."] [--source-url "..."]
  update-block <id> [same content flags] [--order N]
  delete-block <id>
  reorder-blocks <id,id,id>        display_order becomes array position

Images
  upload-image --file PATH | --url URL

Compose (preferred for a whole article — one call, one round of tokens)
  compose <spec.json>              See references/compose-spec.md

Work experience
  work [--locale en|ro] [--json]
  create-work --company C --role R [--description D] [--start YYYY-MM-DD] [--end YYYY-MM-DD] [--locale en|ro]
  update-work <id> [--company C] [--role R] [--description D] [--start D] [--end D]
  delete-work <id>
  reorder-work <id,id,id>

Escape hatch (anything not wrapped above — comments, about-me, social-links, newsletter)
  api <GET|POST|PATCH|DELETE> <path> [json-body]   e.g. api GET /comments?status=pending

Global: --json prints full JSON instead of the one-line summaries.`;

async function main() {
  const argv = process.argv.slice(2);
  const { flags, positional } = parseArgs(argv);
  jsonMode = flags.json === true;
  const cmd = positional[0];

  switch (cmd) {
    case undefined:
    case "help":
    case "--help":
      process.stdout.write(`${HELP}\n`);
      return;

    // ---- auth ----
    case "login": {
      const { token } = await getAccessToken({ force: true });
      out({ ok: true }, () => `signed in (token ${token.slice(0, 12)}…)`);
      return;
    }
    case "token": {
      const { token } = await getAccessToken();
      process.stdout.write(`${token}\n`);
      return;
    }
    case "logout": {
      if (existsSync(SESSION_FILE)) await writeFile(SESSION_FILE, "{}");
      out({ ok: true }, () => "session cleared");
      return;
    }

    // ---- posts ----
    case "posts": {
      const params = new URLSearchParams();
      if (flags.status) params.set("status", flags.status);
      if (flags.locale) params.set("locale", flags.locale);
      if (flags.pinned !== undefined) params.set("pinned", String(flags.pinned));
      const qs = params.size ? `?${params}` : "";
      const { posts } = await api("GET", `/posts${qs}`);
      out(posts, (list) => (list.length ? list.map(postLine).join("\n") : "(no posts)"));
      return;
    }
    case "post": {
      const key = positional[1];
      if (!key) fail("usage: post <slug|id>");
      // There's no GET /posts/{id} that includes blocks — only
      // GET /posts/{slug}. An id is resolved to its slug+locale first so
      // either identifier works from a caller's point of view.
      let slug = key;
      let locale = flags.locale ?? "en";
      if (isUuid(key)) {
        const { posts } = await api("GET", `/posts?id=${encodeURIComponent(key)}`);
        if (!posts?.length) fail(`no post with id ${key}`);
        slug = posts[0].slug;
        locale = flags.locale ?? posts[0].locale;
      }
      const body = await api("GET", `/posts/${encodeURIComponent(slug)}?locale=${locale}`);
      const { post_blocks = [], ...post } = body.post ?? {};
      const blocks = [...post_blocks].sort((a, b) => a.display_order - b.display_order);
      out({ post, blocks }, (v) => [postLine(v.post), ...v.blocks.map(blockLine)].join("\n"));
      return;
    }
    case "create-post": {
      if (!flags.title) fail("--title is required");
      const { post } = await api("POST", "/posts", {
        body: {
          title: flags.title,
          subtitle: flags.subtitle ?? null,
          slug: flags.slug || slugify(flags.title),
          locale: flags.locale ?? "en",
          pinned: flags.pinned === true || flags.pinned === "true",
          status: flags.publish ? "published" : "draft",
        },
      });
      out(post, postLine);
      return;
    }
    case "update-post": {
      const id = positional[1];
      if (!id) fail("usage: update-post <id> [--title ...]");
      const body = {};
      if (flags.title !== undefined) body.title = flags.title;
      if (flags.subtitle !== undefined) body.subtitle = flags.subtitle === "null" ? null : flags.subtitle;
      if (flags.slug !== undefined) body.slug = flags.slug;
      if (flags.status !== undefined) body.status = flags.status;
      if (flags.pinned !== undefined) body.pinned = flags.pinned === true || flags.pinned === "true";
      if (!Object.keys(body).length) fail("nothing to update");
      const { post } = await api("PATCH", `/posts/${id}`, { body });
      out(post, postLine);
      return;
    }
    case "publish":
    case "unpublish": {
      const id = positional[1];
      if (!id) fail(`usage: ${cmd} <id>`);
      const { post } = await api("PATCH", `/posts/${id}`, {
        body: { status: cmd === "publish" ? "published" : "draft" },
      });
      out(post, postLine);
      return;
    }
    case "delete-post": {
      const id = positional[1];
      if (!id) fail("usage: delete-post <id>");
      await api("DELETE", `/posts/${id}`);
      out({ ok: true, id }, () => `deleted post ${id}`);
      return;
    }
    case "set-preview": {
      const [, postId, blockId] = positional;
      if (!postId || !blockId) fail("usage: set-preview <postId> <blockId|none>");
      const { post } = await api("PATCH", `/posts/${postId}/preview-image`, {
        body: { preview_image_block_id: blockId === "none" ? null : blockId },
      });
      out(post, postLine);
      return;
    }

    // ---- blocks ----
    case "add-block": {
      const postId = positional[1];
      if (!postId) fail("usage: add-block <postId> --type ...");
      const type = flags.type;
      if (!type) fail("--type is required");
      const content = await blockContentFromFlags(type, flags);
      const body = { type, content };
      body.display_order = flags.order !== undefined ? Number(flags.order) : await nextDisplayOrder(postId);
      const { block } = await api("POST", `/posts/${postId}/blocks`, { body });
      out(block, blockLine);
      return;
    }
    case "update-block": {
      const id = positional[1];
      if (!id) fail("usage: update-block <id> ...");
      const body = {};
      if (flags.type) body.content = await blockContentFromFlags(flags.type, flags);
      else if (flags.text !== undefined) body.content = { text: flags.text };
      else if (flags.code !== undefined) body.content = { code: flags.code, language: flags.language ?? "text" };
      if (flags.order !== undefined) body.display_order = Number(flags.order);
      if (!Object.keys(body).length) fail("nothing to update (pass --type + content flags, --text, or --order)");
      const { block } = await api("PATCH", `/blocks/${id}`, { body });
      out(block, blockLine);
      return;
    }
    case "delete-block": {
      const id = positional[1];
      if (!id) fail("usage: delete-block <id>");
      await api("DELETE", `/blocks/${id}`);
      out({ ok: true, id }, () => `deleted block ${id}`);
      return;
    }
    case "reorder-blocks": {
      const ids = (positional[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!ids.length) fail("usage: reorder-blocks <id,id,id>");
      const blocks = [];
      for (let i = 0; i < ids.length; i++) {
        const { block } = await api("PATCH", `/blocks/${ids[i]}`, { body: { display_order: i } });
        blocks.push(block);
      }
      out(blocks, (list) => list.map(blockLine).join("\n"));
      return;
    }

    // ---- images ----
    case "upload-image": {
      if (!flags.file && !flags.url) fail("usage: upload-image --file PATH | --url URL");
      const image = await uploadImage({ file: flags.file, url: flags.url });
      out(image, (i) => `${i.url}  ${i.width}x${i.height}`);
      return;
    }

    // ---- compose ----
    case "compose": {
      const specPath = positional[1];
      if (!specPath) fail("usage: compose <spec.json>");
      const result = await compose(specPath);
      out(result, (v) => [postLine(v.post), ...v.blocks.map(blockLine)].join("\n"));
      return;
    }

    // ---- work experience ----
    case "work": {
      const qs = flags.locale ? `?locale=${encodeURIComponent(flags.locale)}` : "";
      const { work_experience } = await api("GET", `/work-experience${qs}`);
      out(work_experience, (list) => (list.length ? list.map(workLine).join("\n") : "(none)"));
      return;
    }
    case "create-work": {
      if (!flags.company || !flags.role) fail("--company and --role are required");
      const body = { company: flags.company, role: flags.role };
      if (flags.description) body.description = flags.description;
      if (flags.start) body.start_date = flags.start;
      if (flags.end) body.end_date = flags.end === "null" ? null : flags.end;
      if (flags.locale) body.locale = flags.locale;
      if (flags.order !== undefined) body.display_order = Number(flags.order);
      const { work_experience } = await api("POST", "/work-experience", { body });
      out(work_experience, workLine);
      return;
    }
    case "update-work": {
      const id = positional[1];
      if (!id) fail("usage: update-work <id> ...");
      const body = {};
      if (flags.company !== undefined) body.company = flags.company;
      if (flags.role !== undefined) body.role = flags.role;
      if (flags.description !== undefined) body.description = flags.description;
      if (flags.start !== undefined) body.start_date = flags.start === "null" ? null : flags.start;
      if (flags.end !== undefined) body.end_date = flags.end === "null" ? null : flags.end;
      if (flags.order !== undefined) body.display_order = Number(flags.order);
      if (!Object.keys(body).length) fail("nothing to update");
      const { work_experience } = await api("PATCH", `/work-experience/${id}`, { body });
      out(work_experience, workLine);
      return;
    }
    case "delete-work": {
      const id = positional[1];
      if (!id) fail("usage: delete-work <id>");
      await api("DELETE", `/work-experience/${id}`);
      out({ ok: true, id }, () => `deleted work experience ${id}`);
      return;
    }
    case "reorder-work": {
      const ids = (positional[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!ids.length) fail("usage: reorder-work <id,id,id>");
      const entries = [];
      for (let i = 0; i < ids.length; i++) {
        const { work_experience } = await api("PATCH", `/work-experience/${ids[i]}`, { body: { display_order: i } });
        entries.push(work_experience);
      }
      out(entries, (list) => list.map(workLine).join("\n"));
      return;
    }

    // ---- escape hatch ----
    case "api": {
      const [, method, path, rawBody] = positional;
      if (!method || !path) fail("usage: api <METHOD> <path> [json-body]");
      const result = await api(method.toUpperCase(), path, rawBody ? { body: JSON.parse(rawBody) } : {});
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }

    default:
      fail(`unknown command: ${cmd}\n\n${HELP}`);
  }
}

main().catch((err) => fail(err?.message ?? String(err)));
