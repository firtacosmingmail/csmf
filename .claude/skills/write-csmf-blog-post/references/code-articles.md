# Code articles: the csmf_articles companion repo

Use this when an article needs implemented, runnable code — a real
feature walkthrough, not a conceptual/opinion piece. Not every post needs
this; decide in step 1 of the main workflow.

**Repo:** `https://github.com/firtacosmingmail/csmf_articles` — local
clone lives at `~/Documents/projects/csmf_articles` (sibling to `csmf`,
both under `~/Documents/projects/` on Cosmin's Mac — this whole workflow
needs the device bridge to his machine, it doesn't work in a cloud-only
session). One branch per article: **`article/[article_slug]`**, using the
*same slug as the blog post itself* so the two are trivially correlated
(post slug `kotlin-flow-basics` → branch `article/kotlin-flow-basics`).

## Environment reality check (verified 2026-08-29 — re-check anything below
that looks stale before trusting it blindly)

- Android Studio's SDK lives at `~/Library/Android/sdk` on Cosmin's Mac —
  request folder access to it if a session doesn't already have it.
  Currently: `platforms/android-37.0`, `build-tools/36.0.0`, no
  `cmdline-tools` (so `sdkmanager` isn't reachable from here to add
  platforms — ask Cosmin to add one in Android Studio if an article needs
  a platform version that isn't there).
- Only JDK 11 is installed in the bridged shell (`java -version`). Modern
  Android Gradle Plugin versions often want 17 — check the AGP version's
  actual requirement rather than assuming 11 is enough; if it isn't,
  install a local JDK under `$HOME` (e.g. an Adoptium/Temurin tarball —
  no root needed) rather than trying to change the system one.
- **`adb` and the `emulator` binary in that SDK are macOS (Mach-O)
  executables — they cannot run in the bridged Linux shell.** No
  `adb devices`, no launching the app, no instrumented tests are possible
  from there. This is a hard environment limit, not a missing setup step
  — plan around it rather than repeatedly trying to work past it.
- Network reachability to Google's Maven repo (`dl.google.com`) works, so
  Gradle can resolve dependencies including an OS-matched `aapt2`/`d8` for
  a real compile.
- **Git lock gotcha:** git operations under `~/Documents/projects/**` on
  this bridge leave a stray, empty `.git/index.lock` (and sometimes
  `.git/objects/**/tmp_obj_*`) behind after every write, because file
  deletion isn't enabled on a connected folder by default — the *next*
  git command then fails with "Another git process seems to be running."
  Fix once per session: request delete permission for
  `/Users/cosminfirta/Documents/projects` before doing git work there;
  after that, git cleans up its own lock files normally for the rest of
  the session. If a lock error happens before that's been requested,
  `rm -f .git/index.lock` (once delete permission is granted) unblocks
  the next command.
- **No push credentials are configured in the bridged shell by default.**
  `git push` fails with `could not read Username for 'https://github.com'`
  until Cosmin has set credentials up there himself. Don't improvise a
  workaround for a missing-credential push failure — stop and tell him;
  pushing is his call to enable, same as it was for the earlier
  mcp-server-http branch in the main csmf repo.

## The workflow

1. **Draft the article's shape** — topic, section outline, the questions
   it answers, and specifically *which app/scenario the article will be
   exemplified in* (this decides what gets built in step 2). Confirm this
   shape with Cosmin before writing any code — cheap to change now,
   expensive once an app is built around it.
2. **Create the branch and implement the code.**
   `cd` into the csmf_articles clone, `git checkout -b article/[article_slug]`
   off the current default branch. Build a real, runnable Android app
   (Kotlin) demonstrating exactly what the article teaches — minimal, but
   not a stub: the actual working code a reader could clone and run, not
   pseudocode dressed up as a project. Commit as you go rather than one
   giant commit at the end.
3. **Test the app — to the extent this environment allows.** The
   automated bar reachable from the bridged shell: `./gradlew assembleDebug`
   compiles clean, `./gradlew test` (unit tests) passes, `./gradlew lint`
   is clean or its findings are reviewed. That's real signal the code is
   correct, not a guess. What's *not* reachable from there (see the
   environment check above): actually launching the app or running
   instrumented UI tests — that needs a real device/emulator, which only
   exists on Cosmin's actual Mac. State plainly which bar was hit
   (compiled + unit-tested vs. also manually launched) rather than
   implying more verification happened than did, and ask Cosmin for a
   final manual open-and-click-through on his own machine before treating
   an article's code as done, unless he says he'll skip that one.
4. **Push the branch.** Plain `git push -u origin article/[article_slug]`.
   If it fails on missing credentials, stop and say so rather than
   guessing at a workaround.
5. **Write the article** (voice/structure/images are the rest of this
   skill) — every code snippet in the post must be copied verbatim from
   the pushed branch, never reconstructed from memory or simplified while
   writing prose. If a snippet needs trimming for readability, trim it in
   the branch's actual code (extract a focused function, say) rather than
   only in the article text, so the two can't drift apart.
6. **Link the branch at the end of the article** — the last block of the
   post, a paragraph like:
   `<strong>Full code:</strong> <a href="https://github.com/firtacosmingmail/csmf_articles/tree/article/[article_slug]">article/[article_slug] on csmf_articles</a>`
