# The Android-docs voice

Modeled on `developer.android.com/kotlin/flow`, `/kotlin/coroutines`, and
`/kotlin/common-patterns`. The goal isn't to imitate Android — it's the
*register*: a working engineer explaining something precisely to another
working engineer, with no filler.

## Structure

```
Title (H1 — this is the post's `title`, not a block)
One short intro paragraph: what this covers and why it's worth reading
## H2 — first concept, foundational
  prose, then a code example if one fits, then what it means
## H2 — next concept, builds on the first
  ...
## H2 — practical application / how it fits into a real project
  ...
(optional) ## H2 — further reading / what's next
```

Move from **concept → practice → integration**: define the idea, show it
in a minimal example, then show where it actually gets used. Don't dump
five concepts before the first code block — one idea earns its section,
then a working example before the next idea starts.

Use H3 (`subheading` blocks) only when an H2 section genuinely splits into
independent sub-topics (Android's `common-patterns` page does this for
"Nullability" → "Interoperability" → "Platform types"). Most sections in a
1000-1500 word post won't need it.

## Voice

- **Second person, active voice.** "You can cancel a coroutine with..." not
  "Coroutines can be cancelled by...". Occasional first-person-plural
  ("Let's look at...") is fine to open a walkthrough — Android's coroutines
  page leans on it — but don't overuse it.
- **Sentence length: mostly 10–18 words, varied on purpose.** A short,
  declarative sentence followed by a longer explanatory one reads better
  than a run of identical-length sentences. Example rhythm: *"A flow emits
  values sequentially. Unlike a plain list, though, it can produce them
  asynchronously, one at a time, as they become available."*
- **Definition, then distinction, then implication.** Introduce a new term
  with a plain one-sentence definition, follow with what makes it different
  from something the reader already knows, then state what that difference
  means in practice. Don't lead with the implication before the reader has
  the definition.
- Bold or backtick the term the first time it's named (`flow`, `viewModelScope`).
  Backtick anything that's literally code — function names, types,
  operators (`?.`, `!!`) — even inline in a sentence.
- No hype, no exclamation points, no "amazing"/"powerful"/"game-changing."
  Justify a design choice by its actual tradeoff ("this trims boilerplate
  but loses compile-time null-safety"), not by enthusiasm.

## Introducing code

Every code block gets a one-sentence setup before it and a short
explanation after it — never a bare block with no framing.

**Before:** state the problem the snippet solves or what it demonstrates.
*"The following example fetches the latest news on an interval:"*

**After:** explain what happens and why, not a line-by-line restatement of
syntax the reader can already see. If the snippet has 2-3 distinct moving
parts, it's fine to touch each one in a sentence, but don't restate the
code in prose.

Keep snippets minimal and runnable-looking — trim unrelated setup, but
don't write pseudocode. If Cosmin's post is in Kotlin, Swift, TypeScript,
etc., match his actual code — this pattern isn't Kotlin-specific.

## Note callouts — use sparingly

Android docs use a bolded `Note:` prefix for a gotcha or a caveat worth
flagging separately from the main flow — maybe 1-2 per page, never more.
On csmf.ro, a callout is just a paragraph block whose text starts with
`<strong>Note:</strong>` (inline HTML is fine inside a paragraph block —
see `platform-notes.md`). Reserve it for something a reader could easily
get wrong, not for routine asides.

## Lists vs. prose — default to prose

Android's own pages are lighter on bullet lists than people assume —
lists appear for genuinely parallel, independent items (a feature list, a
set of restrictions), and prose handles everything sequential or
interdependent. On csmf.ro specifically, **avoid `<ul>`/`<li>` HTML inside
a block** — see `platform-notes.md` for why it renders with no bullets or
indentation on this site. When you do want list-like items, prefer a
sentence that folds them in ("...supports three cases: a network failure,
a timeout, and a malformed response") or, if they truly need visual
separation, a short run of separate paragraph blocks each prefixed with an
em dash.

## Paragraph shape

2-4 sentences, ~40-100 words, one idea per paragraph. Close a section with
a sentence that sets up the next one — Android's docs almost never jump
sections cold; the last line of one section usually names the problem the
next section's heading solves ("...but you still have to remember to move
this call off the main thread. The next section covers a way to make that
automatic.").

## Quick self-check before moving to the next step

- Read the intro paragraph alone — does it say what the post covers and
  why someone would read it, in under 3 sentences?
- Does every code block have a sentence before and after it?
- Any bullet list — could it be a sentence instead?
- Any paragraph over ~120 words that should split in two?
- Total word count ≥1000 (count blocks' text, not the outline)?
