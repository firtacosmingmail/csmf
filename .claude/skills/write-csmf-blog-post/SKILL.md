---
name: write-csmf-blog-post
description: Write and publish a blog post to csmf.ro — Cosmin's personal dev blog (Next.js + Supabase monorepo) — in the Android-developer-docs writing style, with a self-made hero image plus at least one supporting image, authored through the CSMF_MCP tools. Use whenever Cosmin asks to write, draft, outline, or publish a blog post, article, or tutorial for csmf.ro, or says things like "new post about X" or "publish this to the blog."
---

# Write a csmf.ro blog post

Cosmin's personal blog exists to show what he builds and how he builds it,
and to teach — tutorials on programming, write-ups of real work. Every post
should read like it belongs next to `developer.android.com/kotlin/flow`:
precise, example-driven, no fluff, no hype.

This skill covers the full loop: scope the post → write it in that voice →
make its images → publish it through the CSMF_MCP tools. Read the
reference files as you reach the step they cover — don't front-load all
three before writing a word.

- `references/writing-style.md` — the Android-docs voice, distilled into
  rules you can apply while drafting (structure, sentence rhythm, how to
  introduce code, when — rarely — to use a Note callout).
- `references/images.md` — how to make the hero + inline images yourself
  first (recipe + brand tokens), and the Canva MCP fallback.
- `references/platform-notes.md` — the CSMF_MCP tool cheat sheet: block
  types, a real gotcha with HTML lists, the chunking workflow for long
  posts, and the publish rule.
- `references/code-articles.md` — for a post that needs implemented,
  runnable code: the `csmf_articles` companion repo, one branch per
  article, what "test the app" actually means in this environment, and
  the end-of-article branch link.

## Workflow

### 1. Scope it (ask, don't guess, if it's unclear)

You need: the topic/angle, roughly what a reader should walk away knowing,
whether there's code to show (and in what language), and locale (site
supports `en`/`ro`, defaults to `en`). **Also decide whether this post
needs implemented, runnable code** (a feature walkthrough) as opposed to
being conceptual/opinion — if it does, you'll also need the app/scenario
it'll be exemplified in, which feeds step 2. If Cosmin's request already
answers these, don't re-ask — just confirm your read of it in one line and
go. If this session is unattended (a scheduled run, no one likely
watching), state your interpretation and proceed rather than blocking.

Also check `mcp__CSMF_MCP__list_posts` for near-duplicate topics before
starting a new one — Cosmin may want to extend an existing draft instead.

**Starting from a Linear ticket:** (needs `mcp__Linear__get_issue` /
`save_issue` — load them first if they're deferred). Cosmin may point you
at a ticket instead of describing the post directly — typically a
sub-issue of **FLE-78**
("Articles to write for csmf.ro" in the FlexySpot workspace), filed by the
separate `describe-csmf-article` skill. Each such sub-issue is a structured
brief: possible title, description, topic, sections (outline), purpose,
questions the article should answer, code to exemplify, and image
positions/descriptions. `get_issue` it and use that brief as your scope
instead of re-deriving one from scratch — it's the point of that skill
that this decision-making already happened once. If a field is missing,
thin, or contradicts something else in the ticket, ask Cosmin rather than
inventing the gap yourself.

Once the article is written and the post exists on csmf.ro **as a draft**
(after step 7), move that Linear ticket to the **"In Review"** status
(`save_issue` with `state: "In Review"`) so Cosmin knows it's ready for
his look — don't publish *and* don't leave the ticket sitting in its old
status. If the FLE team's workflow doesn't have an "In Review" state when
you get here, say so plainly rather than silently picking a different
status — Cosmin knows about this and is adding it himself.

### 2. If this post needs code, build it first — in csmf_articles

Read `references/code-articles.md` now, before writing any prose. Short
version: create `article/[article_slug]` in the separate `csmf_articles`
repo, implement a real runnable Android app there (not a stub), verify it
to the extent the environment allows (compiles + unit tests + lint — see
the reference for why that's the honest ceiling here), push the branch,
and only then move on to writing the article — its code snippets get
copied verbatim from this branch, not reconstructed while drafting.

Skip this step entirely for a post that isn't a code walkthrough.

### 3. Get the facts right before writing

This is a technical blog by a working developer — wrong or stale code reads
worse than no post. For anything not already nailed down by a real,
tested branch from step 2 — a library detail, a claim about current best
practice, a tool whose behavior could have moved since your training
cutoff — verify with WebSearch/WebFetch before drafting. If you're not
sure something is right, say so to Cosmin rather than shipping it silently.

### 4. Draft in the Android-docs voice

Read `references/writing-style.md` now. Non-negotiables:

- **≥1000 words.** If the topic doesn't naturally reach that, broaden the
  angle (more context, a "why this matters," a related pitfall) rather
  than padding sentences.
- Structure: title → one short intro paragraph (what/why) → H2 sections in
  a learn-then-do progression → code shown with a one-line setup before it
  and a short explanation after → optional closing section (further
  reading, what's next).
- Second person, active voice, prose over bullet lists (see the reference
  for why lists are risky on this site specifically — it's a rendering
  constraint, not just a style preference).
- If this is a code article (step 2), every snippet is copied verbatim
  from the pushed `article/[article_slug]` branch — never reconstructed
  from memory or simplified in the article text only.

Draft the post as plain text/Markdown-ish notes in a scratch file first —
easier to review and revise than composing directly inside MCP tool calls.
Show Cosmin the draft (or a clear outline, for a long piece) before
building it on the site, unless he's explicitly said to just go ahead.

### 5. Make the images

Read `references/images.md` now. Minimum: one hero image (the post's
theme, sets the tone, becomes the preview thumbnail) and one supporting
image roughly at the post's midpoint (a diagram, a concept illustration, a
before/after — something that earns its place, per the same rule as any
technical diagram: it should show a reader something prose would take
longer to assemble). Add more only where a specific section genuinely
benefits from one.

**Try to make each image yourself first** — a custom SVG/illustration
rendered to PNG, styled with the site's actual brand tokens — before
reaching for the Canva MCP tools. Canva is the fallback when a
self-made attempt doesn't come out well, not the default.

### 6. Build the post through CSMF_MCP

Read `references/platform-notes.md` now for the block-type cheat sheet and
the chunking approach for a long post. Short version: create the post as a
draft, add the hero image as the very first block (it auto-becomes the
preview image), then add the rest of the content block by block (or in a
couple of grouped calls) — checking in with Cosmin between chunks is fine
and often better than one giant call for a long post. For a code article,
the *last* block is the branch link (see `references/code-articles.md`).

### 7. Review, then ask before publishing

Before calling `publish_post`:

- Read the post back (`get_post` by slug) and skim it end to end.
- Confirm it has the hero image + ≥1 supporting image, and the body reads
  at ≥1000 words.
- Check block order makes sense (`reorder_blocks` if something's out of
  place).
- For a code article: the branch was actually pushed (not just committed
  locally), and its link is the last block.

**Publishing puts the post on the live, public site — always confirm with
Cosmin in chat before calling `publish_post`, even if he asked for a
"post," unless his request already explicitly said to publish it.** Leaving
it as a draft and saying so is the safe default; he can ask you to publish
in the same breath if he wants.
