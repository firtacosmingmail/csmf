# Images: make them yourself first, Canva second

Every post needs a **hero image** (sets the theme, becomes the post's
preview thumbnail automatically — see `platform-notes.md`) and **at least
one supporting image** near the middle of the post. Add more only where a
specific section is genuinely clearer with a picture — a diagram of an
architecture, a before/after, a flow. Don't add a third image just to hit
a quota.

The instruction is to *try* making the image yourself before opening
Canva — not to force a bad self-made image through. If your own attempt
looks rough (bad text rendering, cramped layout, doesn't read at a glance),
say so and fall back to Canva rather than shipping it.

## The site's actual brand tokens (verify against `apps/web/app/globals.css`
before trusting these — the palette has changed once already; the
`design-decisions.md` project memory note describing a "warm off-white"
theme is stale)

```
background (paper):     #0a0a0a   (near-black)
raised surface:          #161514
foreground (ink):        #f2efe9   (warm off-white)
muted foreground:        #9b958a
border:                   #2a2826
accent (terracotta):     #e0916b
accent hover:             #ec9f7a
layered/depth tone 1:     #1c1a18   (cloud-500)
layered/depth tone 2:     #232120   (cloud-300)

headline font:  Newsreader (serif)
body font:      Source Sans 3 (sans)
code/meta font: JetBrains Mono
accent/handwritten font: Caveat
```

It's a **dark** editorial theme: near-black background, warm off-white
text, one terracotta accent used sparingly, not as a wash. Design images
to sit naturally on that — a light, white-background illustration will
look like a mistake on the live post page (the post renderer just does
`<img class="w-full rounded">`, no frame or background compensation).

## Making the image yourself

The most reliable recipe available in this environment: author the image
as a self-contained HTML file with inline SVG (flat shapes, no photos —
this is what reads well at this style: geometric, diagrammatic, a little
abstract, in the spirit of the simple flat illustrations Android's own
docs use for figures), then screenshot it to PNG with the pre-installed
Playwright/Chromium in the cloud workspace.

**Target sizes:** hero ~1600×900 (16:9 reads well full-width), inline
images ~1200×800 or whatever aspect fits the content — there's no fixed
aspect ratio enforced by the site.

**Template pattern** (adapt per post — colors/fonts above, content is the
point):

```html
<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@600&family=Source+Sans+3:wght@400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1600px; height:900px; background:#0a0a0a; overflow:hidden; }
</style></head>
<body>
  <svg viewBox="0 0 1600 900" width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
    <rect width="1600" height="900" fill="#0a0a0a"/>
    <!-- flat shapes / diagram / abstract composition go here, using
         #e0916b as the one accent, #f2efe9 / #9b958a for any text or
         line work, #161514 / #1c1a18 / #232120 for layered depth -->
  </svg>
</body></html>
```

```python
# screenshot.py — run with: python3 screenshot.py in.html out.png 1600 900
import sys
from playwright.sync_api import sync_playwright

html_path, out_path, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
    page.goto(f"file://{html_path}")
    page.wait_for_timeout(200)  # let web fonts settle
    page.screenshot(path=out_path)
    browser.close()
```

`device_scale_factor=2` gives a crisper PNG (renders at 2x, still saved at
the CSS pixel dimensions you set — fine for a blog hero). If the Google
Fonts `@import` can't reach the network, drop it and fall back to a
generic serif/sans-serif — don't block the whole image on font loading.

**No Playwright available / simpler graphic needed:** Pillow
(`pip install pillow --break-system-packages` if missing) with
`ImageDraw` covers flat shapes, gradients, and text directly to a PNG with
no browser involved — a reasonable fallback for something simple (a
gradient field with one or two geometric accents and a short label).

## Getting the file to CSMF_MCP

`upload_image`'s `filePath` reads a file "on this machine" — and the
CSMF_MCP tools most likely run as the local stdio MCP server
(`apps/mcp-server`) on Cosmin's own Mac, not in this cloud workspace. That
means a PNG built here in the cloud container is very likely **not**
directly visible to `filePath` — confirm this rather than assuming it:

1. Try `upload_image` with the cloud-container path first. If it succeeds,
   great, use `filePath` directly for the rest of the post's images.
2. If it errors (file not found, or a permissions/path error), the server
   is local: get the PNG onto Cosmin's Mac first — `SendUserFile` it,
   then `mcp__remote-devices__device_commit_files` into a scratch folder
   inside the connected `csmf` folder (e.g. a gitignored
   `.tmp-blog-images/` at the repo root — add it to `.gitignore` if it's
   not already there) — then call `upload_image` with the **device**
   path `device_commit_files` returns.
3. Either way, `upload_image` returns a public URL and pixel dimensions —
   pass that URL as the image block's `content.url` via `add_block` (or
   let `create_post_with_content` do the upload+attach in one step, see
   `platform-notes.md`).

Always set `alt_text` (a real description, not the filename) and, for the
hero, consider a short `caption` if it adds context — it's optional, not
required.

## Canva fallback

If a self-made attempt isn't good enough:

1. `mcp__Canva__generate-design` with a `design_type` matching the target
   shape (`youtube_thumbnail` or `desktop_wallpaper` are the closest
   built-in shapes to a 16:9 hero; a square-ish inline image can use
   `instagram_post` or similar) and a `query` describing the same brief
   you'd have given yourself — mention the dark/terracotta palette above
   so it doesn't come back light-themed.
2. `create-design-from-candidate` on the candidate you like.
3. `get-export-formats` for that design, then `export-design` with
   `type: "png"` (set `width`/`height` to your target pixels) — this
   returns a download URL.
4. `upload_image` with `imageUrl` set to that Canva export URL — no local
   file handling needed, this path re-hosts directly from the URL.

Mention to Cosmin which path you used (self-made vs. Canva) when you show
the finished post — he asked for self-made-first specifically, so it's
worth being explicit if you had to fall back.
