# @eins78/agent-skills

## 4.2.0

### Minor Changes

- [#74](https://github.com/eins78/agent-skills/pull/74) [`46077b4`](https://github.com/eins78/agent-skills/commit/46077b4ece0c43c59b693ac8ded86e72c42b5f29) - **`apple-mail`** — document archive search over `.emlx`, the preferred path for old mail or many accounts. Closes [#69](https://github.com/eins78/agent-skills/issues/69).

  - New **Searching large archives** section: a `ripgrep` recipe over `~/Library/Mail`, the `.emlx` format (length prefix + RFC822 + plist trailer), and triage via a new `scripts/emlx.py`. AppleScript stays the path for live and recent-inbox queries, cross-referencing the existing bridge-hang warning rather than repeating it.
  - Warns that `mdfind -onlyin ~/Library/Mail` returns **0 for every query** because the store is not Spotlight-indexed — 0 reads as "no such mail" but means "no index", and that misreading is the bug. Ships `mdutil -s /` + `mdls -name kMDItemTextContent` as the diagnostic that tells the two apart.
  - Same trap found in the fix itself: without Full Disk Access, `rg --no-messages` also returns a silent 0. The recipe now opens with a readability precheck instead of a prose caveat.
  - Documents MIME-encoded (`=?UTF-8?B?...?=`) and folded headers, which raw `grep` cannot handle — measured at ~24% and ~20% of messages on the authoring machine, so a `grep`/`cut` pipeline is wrong for roughly a third of them.
  - Documents `*.partial.emlx`: included by `-g '*.emlx'` automatically, and worth searching. Corrects the reported claim that they lack the body — measurement shows text bodies intact and only attachment parts stubbed (empty payload plus `X-Apple-Content-Length`), surfaced as a `NOT-DOWNLOADED` flag.
  - New `tests/test-emlx.sh` — smoke test over a synthetic fixture, no real mail touched. Not run by `pnpm test`.
  - README: archive-search row in the approach table, Full Disk Access dependency, silent-failure limitations, and a table recording which issue [#69](https://github.com/eins78/agent-skills/issues/69) recipes verified and which were corrected.

  Read-only throughout: nothing added sends, deletes, or modifies mail.

  <!--
  bumps:
    skills:
      apple-mail: minor
  -->

- [#70](https://github.com/eins78/agent-skills/pull/70) [`5a066fb`](https://github.com/eins78/agent-skills/commit/5a066fbdbd8da3a23fe5acbfd8251c7ceb7e0dc3) - `apple-mail`: document attachment extraction and two `tell`-block gotchas

  Adds `List attachments` / `Save attachments` commands and a gotchas section
  covering `POSIX file` failing inside a `tell application "Mail"` block (-1728)
  and the set of ordinary variable names that collide with Mail's terminology.

  <!--
  bumps:
    skills:
      apple-mail: minor
  -->

## 4.1.0

### Minor Changes

- [#71](https://github.com/eins78/agent-skills/pull/71) [`b2f1969`](https://github.com/eins78/agent-skills/commit/b2f1969eed4754384bd1f05e662ca3063910991b) - Codify the Kindle/EPUB pipeline.

  - **`send-to-kindle`** — new skill (starts at `0.1.0`). Delivery routes and their 2026 status, EPUB-over-PDF rationale, per-device addressing, the approved-sender allowlist that drops mail silently, size ceilings, and the one-way nature of personal-document highlights. Documents the manual email step in three facts; ships no sender script and no configuration contract for one.
  - **`pandoc`** — adds `scripts/md2kindle-epub.sh` (markdown → e-reader EPUB with a real TOC, chapter splitting, and literal `[ ]` checkboxes), a "Markdown → Kindle EPUB" recipe, and a Common Mistakes row for the `task_lists` / Unicode-glyph trap: pandoc treats ☐/☑ as task-list markers unconditionally, so pre-converting them does not avoid `<input type="checkbox">` output.
  - **`dossier`** — one-line cross-reference to `send-to-kindle` in §DELIVER.

  `send-to-kindle` is intentionally absent from the bumps block below: its version is set directly in SKILL.md, and listing it would re-bump `0.1.0` to `0.1.1` on release.

  <!--
  bumps:
    skills:
      pandoc: minor
      dossier: patch
  -->

## 4.0.0

### Major Changes

- [#65](https://github.com/eins78/agent-skills/pull/65) [`38fb377`](https://github.com/eins78/agent-skills/commit/38fb3779c3d14e8e2d363ec8d5a98bc4d2f2a1f1) - `text-to-speech`: remove default nested `claude --print` from the L1 narrative rewrite — dispatch a subagent instead (Finding 2), plus three field-report fixes and ID3 lyrics embedding.

  Field report from a fresh-machine run of the podcast/TTS pipeline surfaced
  five issues; four were fixes, one a requested feature.

  - **BREAKING — L1 narrative rewrite no longer runs automatically.**
    `pipeline.py`/`chunk_and_rewrite.py` used to shell out to `claude --print`
    directly. Run from inside an active Claude Code session, that nested call
    inherits the session's output style / project `CLAUDE.md` and can leak
    meta-commentary into the rewrite instead of prose (observed: a literal
    `★ Insight` block rendered into audio). SKILL.md now instructs the driving
    agent to dispatch an isolated rewrite subagent (Task/Agent tool), write
    `narrative.txt`, then call `synth-audio.sh --skip-layer 1`. A bare
    invocation with no existing `narrative.txt` now fails loudly by default
    instead of silently falling back to the old behavior; standalone/headless
    callers with no driving agent opt in via `--allow-inline-llm-rewrite`
    (isolated with `claude --print --safe-mode`). Verified empirically this
    session: a subagent dispatched from within an explanatory-output-style
    session — the exact failure condition — returned clean prose with no
    leaked commentary.
  - Added `validate_narrative()` in `pipeline.py` as a source-agnostic
    backstop (applies regardless of whether narrative.txt came from a
    subagent, a human, or the inline fallback): hard-fails on missing chapter
    markers when the source has headings, a collapsed word count vs. the
    source, or known contamination patterns.
  - Updated the stale `claude-sonnet-4-6` default to `claude-sonnet-5` in
    `pipeline.py`, `chunk_and_rewrite.py`, and `kokoro.sh`.
  - Fixed `synth-audio.sh` always passing `--verify` to the backend regardless
    of whether the flag was given (`${VERIFY:+--verify}` treated the default
    `VERIFY=0` as non-empty; now gated on value).
  - `kokoro.sh` now runs a probe-first espeak-ng data-path preflight (macOS):
    it actually exercises `misaki`'s G2P once and only symlinks the bundled
    `espeakng_loader` dylib to a Homebrew `espeak-ng` build
    (`$(brew --prefix espeak-ng)`) when that probe fails — verified
    empirically (byte-identical dylib+data) that the bundled path is not
    reliably broken everywhere, so the preflight no longer assumes it always
    is and stays silent when nothing needs fixing.
  - `kokoro.sh` now requires `VIRTUAL_ENV` to be set and fails loudly with the
    fix instead of letting misaki's background `en-core-web-sm` auto-install
    fail deep with an unhelpful "No virtual environment found".
  - New: the rendered MP3's ID3 `USLT` frame now embeds the final
    `narrative.txt` (chapter markers stripped to plain title lines) by
    default — the spoken text travels inside the file for comparison against
    the source without a separate artefact. `--no-lyrics` opts out.
  - Fixed two bugs a real end-to-end render surfaced (not reachable from
    isolated component tests): `kokoro_round5.py` was creating a
    zero-duration chapter for the H1-title-only marker that precedes the
    first H2 marker with no body of its own, which `inject_chapters.py`'s
    own duration check correctly rejected; and
    `inject_chapters.py`'s marker-stripping regex was mashing back-to-back
    marker titles together with no separator when converting narrative.txt
    to USLT lyrics text.

  <!--
  bumps:
    skills:
      text-to-speech: major
  -->

### Minor Changes

- [#67](https://github.com/eins78/agent-skills/pull/67) [`75fc5a6`](https://github.com/eins78/agent-skills/commit/75fc5a6c4bf8e60059c878802e289e9b7387af10) - `dossier`: capture cited sources for offline verification. Until now the skill
  archived nothing — every citation was a bare URL, while the reviewer checklist
  named "URLs that 404 when spot-checked" as a red flag in two separate items
  without prescribing any remedy. GATHER now captures each source as its URL is
  collected, into a `sources/` folder beside the dossier with an `index.md`
  mapping every file back to its citation ID, original URL, access date, and
  content hash.

  Tool selection is evidence-based, not assumed — see the cited dossier at
  `research/2026-07-26-source-archival/`. The headline finding is that `wget`,
  the obvious first guess, is the wrong tool twice over: its `--quota` provably
  cannot cap a single-file download (GNU manual: _"quota will never affect
  downloading a single file"_, reproduced locally) and it is not installed on
  stock macOS, where `curl` is the Apple-shipped binary. The ladder is therefore
  `monolith` → `curl` (the floor, never absent) with `pandoc` layered on top for
  text extraction. `wget --mirror` is rejected outright rather than capped:
  recursion is the gigabyte failure mode, and verification needs the cited page,
  not the site. `ArchiveBox`, `httrack`, `single-file-cli` and `percollate` are
  evaluated and declined as dependencies for portability reasons.

  Nothing is required beyond `curl` and `awk`, both shipped by every relevant OS.
  `monolith` and `pandoc` are detected at runtime; their absence degrades quality,
  never function. Capture never fails a dossier — an unreachable host, a 403, or
  an over-cap response becomes an index row recording what happened. Bounds are
  explicit: depth 0 with no recursion knob, 5 MB and 20 s per source, 100 sources
  and 100 MB per dossier.

  Two limitations are surfaced rather than hidden. JS-rendered pages cannot be
  captured without a browser, so captures are probed with a portable awk
  text-length measure (validated against real pages: a JS shell scores ~469
  characters where every server-rendered page tested scored above 4,000) and
  flagged `thin-capture`, pointing at `single-file-cli` as the manual remedy.
  And **Save Page Now is opt-in only** — it submits a URL to a permanent public
  archive, so defaulting it on would publish the author's reading list one source
  at a time. The read-only availability lookup, which publishes nothing, is the
  default instead.

  Also adds the `sources-index-consistency` gate (every index row resolves to a
  file, every captured file has a row; silent when there is no archive) and
  review-checklist item 10.

  <!--
  bumps:
    skills:
      dossier: minor
  -->

- [#68](https://github.com/eins78/agent-skills/pull/68) [`a41bd9c`](https://github.com/eins78/agent-skills/commit/a41bd9cacd8124fe4a267a270ae79855cab73c9c) - Remove the `bye` skill. It also lived in
  [quatico-solutions/agent-skills](https://github.com/quatico-solutions/agent-skills)
  under the same version label but with diverged content, so a fix to one copy
  silently left the other wrong. That repo is now its single maintained home —
  it carries this copy's improvements (skill-directory links, the skip/create
  decision table, the hard stop when no sessionlog directory exists) plus a
  declared `Sessionlog directory` key.

  README points at the new home; the marketplace manifest was regenerated.

  <!--
  bumps:
    skills: {}
  -->

## 3.2.0

### Minor Changes

- [#62](https://github.com/eins78/agent-skills/pull/62) [`8008cbc`](https://github.com/eins78/agent-skills/commit/8008cbc53eff19bbebf7147ad2a30a86dfadf893) - Add `ai-council-review` skill — convene a council of ~4 frontier models via
  the OpenRouter API for independent parallel reviews of a PR, plan doc, or
  files, with in-session synthesis of agreements and dissents (verified against
  the actual repository before reporting). Ships zero-runtime-dependency
  Node (>= 20) `.mjs` scripts (`// @ts-check` + JSDoc — first Node-based skill
  scripts in this repo) with per-model retry/timeout handling, live-pricing
  cost estimates, and a two-tier budget gate: expected cost above the
  confirmation threshold requires an explicit `--yes`, and worst-case cost
  (all members exhausting `max_tokens`) above the budget cap refuses outright —
  nothing is sent in either case. Council
  rosters are data (`references/presets.json`); the default council is
  gpt-5.5, gemini-3.1-pro-preview, deepseek-v4-pro, and glm-5.2 (vendor-diverse,
  Anthropic deliberately excluded — the synthesizer is Claude). Requires
  `OPENROUTER_API_KEY`; SKILL.md carries an explicit consent note because
  reviewed content leaves the machine for third-party model providers. Tests:
  offline unit suite (JSON extraction, clustering, budget math) plus a mock
  OpenRouter server covering retry, timeout, quorum, budget-blocks-before-HTTP,
  and key-redaction paths via `node:test`, and an optional live smoke test
  against `deepseek/deepseek-v4-flash` (< $0.01) that skips cleanly without a
  key. Root conveniences: `pnpm run test:council`, `pnpm run typecheck:council`.

  Ships effectively at v0.1.0 (frontmatter committed at 0.0.0; the minor bump
  below lands the release at 0.1.0).

  <!--
  bumps:
    skills:
      ai-council-review: minor
  -->

- [#62](https://github.com/eins78/agent-skills/pull/62) [`ab95045`](https://github.com/eins78/agent-skills/commit/ab950457075eab57c477a9470356adc8a9ec9dd8) - `ai-council-review`: prior-art hardening round (research-backed, PR [#62](https://github.com/eins78/agent-skills/issues/62) —
  see `research/council-prior-art.md` for evidence and citations). Member
  identities are now anonymized during synthesis: reviews, clusters, and the
  manifest carry shuffled `member-A`… labels, with the label→model mapping in
  `roster-key.json` read only at report time (counters LLM brand/self-
  preference bias; failed members stay named). The synthesis protocol gains
  correlated-error guardrails (unanimity grants no verification exemption;
  minority-new-evidence triage for contested items) and position-bias
  adjudication hygiene (repo-evidence view first, order-swap check on close
  calls). Clusters carry a stable `fingerprint` for re-review comparison with
  a documented stuck rule (same blocking fingerprints two runs running →
  recommend human judgment). New offline `outcomes record|show` subcommand
  archives per-member verified/refuted/uncertain tallies per run to XDG state
  for evidence-based roster tuning. `--personas` graduates from experimental
  to a documented coverage mode; an optional two-stage budget→default triage
  pattern is documented (suggestion only, not enforced); and the README
  records "no debate round" as an explicit non-goal plus the corrected
  diversity rationale (bias control, not recall booster).

  <!--
  bumps:
    skills:
      ai-council-review: minor
  -->

## 3.1.0

### Minor Changes

- [#55](https://github.com/eins78/agent-skills/pull/55) [`8796c22`](https://github.com/eins78/agent-skills/commit/8796c229b25c687ee13571c9bc3d36a33abaafd4) - chrome-browser: harden tool selection and cold-start behaviour, and ship recovery/diagnostic helpers as official scripts.

  - Name the lookalike browser MCPs (`mcp__chrome-devtools__*`, `mcp__claude-in-chrome__*`) explicitly as forbidden so cold agents don't silently switch to them when Playwright errors transiently.
  - Add an "On activation" preflight (CDP alive, Playwright MCP loaded) since the audit showed all real failures cluster in the first ~30–60 s after skill load.
  - Forbid raw `curl`/CDP-WebSocket browser driving; clarify `browser_tabs` lists tabs (no action arg) as well as closing them.
  - Document one-time session loss after Chrome for Testing version bumps.
  - Hardcode the launchd label as `is.ars.chrome-cdp` (renamed plist `com.example.chrome-cdp.plist` → `is.ars.chrome-cdp.plist`) so troubleshooting commands work without machine-specific lookups. **Upgraders from v1.3 must unload and remove the old plist first** — see INSTALL.md §2.
  - Ship three new helper scripts on PATH (symlinked by `install-cft.sh`):
    - `chrome-cdp-health` — liveness + endpoint check (exit 0/1/2).
    - `chrome-cdp-restart` — kickstart launchd-managed Chrome when Playwright keeps erroring but CDP is alive.
    - `chrome-cdp-tabs` — read-only tab listing; sanctioned alternative to ad-hoc `curl :9222/json` for out-of-band inspection. Action helpers (goto/click/eval) intentionally NOT shipped — those would compete with Playwright MCP and re-create the tool-selection problem.
  - Add `install-cft.sh --symlinks-only` to refresh helper symlinks without re-downloading CfT (and `-h`/`--help`). Lets users on existing CfT installs adopt the new helpers without the heavy npx download.

  <!--
  bumps:
    skills:
      chrome-browser: minor
  -->

- [#54](https://github.com/eins78/agent-skills/pull/54) [`93d9673`](https://github.com/eins78/agent-skills/commit/93d967323973f840c4cb9bdbf0cb559b4496896a) - pandoc: v1.2.0 — add "compact A4 print" recipe with bundled `themes/marked-print.css` (9pt body, GitHub-like headings, full Unicode + emoji via Apple system font fallback) and `scripts/md2pdf-print.sh` wrapper that pipes markdown through pandoc into headless Chrome `--print-to-pdf`. Replaces Marked 2's broken PDF export pipeline on macOS 26.x (which clips ~5–10pt off the left edge in all styles) and avoids the LaTeX-vs-Japanese-vs-emoji font dance. Pandoc has no Chrome `--pdf-engine` (as of 3.9), so the shell wrapper is the canonical pattern. The wrapper captures Chrome's stderr and verifies a non-empty PDF before exiting, so silent failures surface instead of producing 0-byte output. The print stylesheet wraps long lines in fenced code blocks (`white-space: pre-wrap; overflow-wrap: anywhere`) so they don't get clipped at the page edge. Includes an in-repo fixture (`tests/fixtures/print-test.md`) and a regression test (`tests/test-md2pdf-print.sh`, run via `pnpm test:print`) that asserts page size, page count is within an expected range, Japanese and emoji survive the round-trip, and no `?` tofu substitutions appear in the extracted text — runnable on any contributor machine.

  <!--
  bumps:
    skills:
      pandoc: minor
  -->

## 3.0.0

### Major Changes

- [#59](https://github.com/eins78/agent-skills/pull/59) [`1f82c67`](https://github.com/eins78/agent-skills/commit/1f82c6721d906cecf23b05f03d37552eb0a79318) - Remove two skills that moved to their proper homes: `tracer-bullets` → [plot-pm/plot](https://github.com/plot-pm/plot) (it's Plot's designed companion — /plot-approve, the plan template, and the quickstart reference it) and `typescript-strict-patterns` → [quatico-solutions/agent-skills](https://github.com/quatico-solutions/agent-skills) (generic team-wide TypeScript guidance, belongs in the company pool). Major: breaking for anyone installing these skills from this marketplace — reinstall from the new homes.

  <!--
  bumps:
    skills:
      lab-notes: patch
  -->

## 2.7.1

### Patch Changes

- [#57](https://github.com/eins78/agent-skills/pull/57) [`6267f10`](https://github.com/eins78/agent-skills/commit/6267f10c4d9a04648de95fc58614c04e1e6f4529) - dossier: collapse unpublished dossiers to a single current version ([#56](https://github.com/eins78/agent-skills/issues/56))

  When a user gives mid-session corrections, the agent previously accumulated document history in the dossier body — "Revision note" blocks, `rev. <date>` date suffixes, and inline "first draft framed X / corrected after feedback" phrasing. That edit history is noise to any reader who wasn't in the authoring session.

  - SKILL.md §SYNTHESIZE gains an "Anti-revision rule" bullet: rewrite corrections as present-tense facts; state _why a point matters_ rather than _that it was added later_; document history lives in commit messages and the sessionlog.
  - Common Mistakes table gains a "narrating edit history" row.
  - review-checklist.md gains item [#9](https://github.com/eins78/agent-skills/issues/9) ("Single current version") with red-flag patterns.
  - The dossier template's header comment block now names the anti-revision rule alongside the section-order rule.

  Out of scope: deliberate dated addenda on already-published dossiers.

  <!--
  bumps:
    skills:
      dossier: patch
  -->

## 2.7.0

### Minor Changes

- [#51](https://github.com/eins78/agent-skills/pull/51) [`b48aaf1`](https://github.com/eins78/agent-skills/commit/b48aaf1fd42f32d1cde402b7083f4d1ac0a51b53) - chrome-browser: v1.3.0 — surface tool-selection rules (`browser_tabs` not `page.close()`, sequential calls, local-CDP verification), page-handling gotchas (`innerText` for SPAs, batch crawling inside `browser_run_code`, no `require('fs')`, Cloudflare patience, rate-limit guidance), an expanded "running but hung" troubleshooting checklist, and a stable `~/.local/bin/launch-chrome-cdp` symlink installed by `install-cft.sh` so cold sessions don't have to guess paths. Two pre-existing shellcheck warnings (SC2115, SC2054) also fixed.

  <!--
  bumps:
    skills:
      chrome-browser: minor
  -->

## 2.6.0

### Minor Changes

- [#49](https://github.com/eins78/agent-skills/pull/49) [`89c204b`](https://github.com/eins78/agent-skills/commit/89c204bfa7c99850a6282adb63dc28962a4c9c3c) - Add `text-to-speech` and `private-podcast-feed` skills from tts-shootout R4–R5

  `text-to-speech`: wrapper script (`synth-audio.sh`) that takes a text document and
  outputs MP3. Currently backed by Kokoro-82M; backend is config-swappable. Includes
  Kokoro-specific prosody config (stress hints, phoneme dict, em-dash chunking, list
  prosody). Bundled Python pipeline extracted from experiments/tts-shootout.

  `private-podcast-feed`: private RSS+MP3 feed for self-subscription with
  `itunes:block`, token-prefixed URLs, ID3 CHAP/CTOC chapters, and Overcast ping.
  Covers the `podcast@2.0.1` named-export gotcha and `customElements` pattern for
  `itunes:block` (typed `FeedITunes` interface omits this field).

  Extracted from `eins78/home-workspace` experiments/tts-shootout (Rounds 4–5, 2026-04).

  <!--
  bumps:
    skills:
      text-to-speech: minor
      private-podcast-feed: minor
  -->

## 2.5.0

### Minor Changes

- [#43](https://github.com/eins78/agent-skills/pull/43) [`5a76700`](https://github.com/eins78/agent-skills/commit/5a7670028b0fb0e097cb36156d7b7a4e556e9711) - Introduce `ballot` skill (v1.0.0) and evolve `dossier` with a preflight gate, clickable citations, and reviewer checklists.

  **`ballot` (new, v1.0.0).** Standalone per-reviewer decision-ballot skill for decisions that happen async — reviewed over chat, on a PR, on a train, after the session ends. Works for single-decider async and multi-reviewer panels alike; reviewer count is incidental to the trigger. Ships with template, conventions doc (one file per decider, empty checkboxes, no anti-options, Must/Should/Could tiers, reconciliation in sessionlog), and an 8-item reviewer checklist. One mechanical gate survives: `ballot-filename.sh` enforces the `DOSSIER-<slug>-BALLOT-<Reviewer>.md` naming pattern. Use cases: ADRs, architecture calls, hiring panels, vendor selection, household decisions, PR review handoffs.

  **`dossier` (evolved).** Step-0 preflight gate — verify the research request is Specific, Unambiguous, and Well-understood; ask before starting if not. Balanced against over-interrogation: "the bar is 'the answer isn't obvious from context,' not 'I want to be extra sure.'" Key Facts box in the template (one screen: who decides, decision model, deadline, hard constraints, audience, 3–5 load-bearing claims). Clickable reference-link citations (`claim [S1][ref-S1]` with `[ref-S1]: url` defined in §Sources — renders as a click-through in GitHub, Obsidian, Bitbucket, and Confluence; backwards-compatible with bare `[Xn]`). Asymmetric template order: Glossary stays at the top (read-support), Sources stays at the end (trust-support). Commercial-bias source-flagging integrated into the reviewer checklist (pattern from the `@young.mete` Threads contribution). New 8-item reviewer checklist replaces the earlier grep-based audit hooks — those were overfit to the a11y-extension session and did not generalize across dossier styles.

  **Hooks.** One mechanical gate (`ballot-filename.sh`), wired PostToolUse on Write|Edit through `dossier-hook-dispatcher.sh` (alerting level, not blocking — the file is on disk when the hook fires; PreToolUse upgrade is future work). Seven pattern-matching hooks that shipped during development were removed as overfit: `dossier-citation-audit.sh`, `dossier-forbidden-words.sh`, `dossier-section-order.sh`, `dossier-dated-claim-scan.sh`, `ballot-anti-option.sh`, `ballot-cover-archaeology.sh`, and `dossier-framing-declared.sh`. The `framing-mode` classification convention (`oss`/`commercial`/`hiring`/`vendor`/`personal`) was removed alongside the last hook — same anti-pattern as the grep gates. Replaced by judgment-capable reviewer checklists at `skills/dossier/references/review-checklist.md` and `skills/ballot/references/review-checklist.md`.

  Minor bump for dossier (1.0.1 → 1.1.0); ballot ships directly at 1.0.0. Plugin minor bump. No breaking changes — existing `dossier` files remain valid; `[Xn]` citations still work but are not clickable until upgraded to `[Sn][ref-Sn]`.

  <!--
  bumps:
    skills:
      dossier: minor
  -->

- [#45](https://github.com/eins78/agent-skills/pull/45) [`bf78f1b`](https://github.com/eins78/agent-skills/commit/bf78f1b088aad959a9d74b4b4017a27b5681fcb3) - Add `evals/` harness for `dossier` + `ballot` skill reviewer-checklists — 16 scorers (10 mechanical + 6 LLM-as-judge), cost-gated via `EVAL_MODE=full`. Runs locally via `pnpm evals`; no CI wiring.

  <!--
  bumps:
    skills: {}
  -->

- [#48](https://github.com/eins78/agent-skills/pull/48) [`7134d48`](https://github.com/eins78/agent-skills/commit/7134d48be633e0c390f3c4af5dca1d1ef4582a61) - Add `pdf-zine` skill — wrapper for the [`pdf2zine`](https://github.com/eins78/pdf2zine) CLI, which converts a PDF into a fold-and-print booklet (A4 sheets, double-sided short-edge flip, fold to A5) using `bookletimposer` and `qpdf` in Docker. Discovery-first description so agents reach for `pdf2zine` instead of hand-rolling Ghostscript or `pdfjam` imposition scripts. Covers the three CLI flags (`--keep-cover`, `--keep-format`, `--` pass-through) and common pitfalls. A `references/bookletimposer-native.md` doc covers the non-Docker path (apt / from-source `bookletimposer`) for users without Docker.

  Skill name is `pdf-zine` (hyphenated); the wrapped CLI binary remains `pdf2zine`.

  Ships at v1.0.0. Plugin minor bump.

  <!--
  bumps:
    skills:
      pdf-zine: minor
  -->

## 2.4.1

### Patch Changes

- [`ec71cb1`](https://github.com/eins78/agent-skills/commit/ec71cb1ee54f5d1a8966fd665ebb93625aa06916) - dossier: add commercial bias flagging guidance from [`@young.mete` Threads post](https://www.threads.com/@young.mete/post/DXPjx_JDuMR)

  Adds source quality heuristic: explicitly flag commercial incentives in dossier
  output rather than silently down-weighting biased sources. Updates
  `sources-by-domain.md` (new Commercial Bias Flagging subsection, expanded Lowest
  tier) and `SKILL.md` (new EVALUATE step bullet).

  <!--
  bumps:
    skills:
      dossier: patch
  -->

## 2.4.0

### Minor Changes

- [#40](https://github.com/eins78/agent-skills/pull/40) [`549cfe3`](https://github.com/eins78/agent-skills/commit/549cfe36615e0353fd704c24b5622322fea0fc50) - `chrome-browser`: expand and consolidate Chrome automation flags — disable password checks, AI mode badge, tab organization, autofill, media routing, background networking, and other UI distractions. Flags organized by category with inline comments.

  <!--
  bumps:
    skills:
      chrome-browser: minor
  -->

## 2.3.1

### Patch Changes

- [#38](https://github.com/eins78/agent-skills/pull/38) [`e27a458`](https://github.com/eins78/agent-skills/commit/e27a4584d58a241f03902b56df232e63ac27ffc3) - Release pipeline: include version in commit message and PR title (e.g. `release: 2.3.0` instead of `chore: release`)

## 2.3.0

### Minor Changes

- [#33](https://github.com/eins78/agent-skills/pull/33) [`5b01b37`](https://github.com/eins78/agent-skills/commit/5b01b375ea74c21dc04413087e8d1fc8d1de465c) - Promote `typescript-strict-patterns` to stable 1.0.0 — graduates from 1.0.0-beta.1 pre-release

  <!--
  bumps:
    skills:
  -->

### Patch Changes

- [#36](https://github.com/eins78/agent-skills/pull/36) [`8dad438`](https://github.com/eins78/agent-skills/commit/8dad438e5717b4521b97a14ed869c396879de5bb) - Fix unbound variable error in `bump-skill-versions.sh` when no skill version bumps are present in changesets

## 2.2.0

### Minor Changes

- [#26](https://github.com/eins78/agent-skills/pull/26) [`a9a9ebc`](https://github.com/eins78/agent-skills/commit/a9a9ebcd22ad1758306862e96bd3baf84f3ffa6f) - Add `lab-notes` skill — structured experiment management with Rigorous + Freeform modes, append-only running logs, and formal verdicts

  <!--
  bumps:
    skills:
      lab-notes: minor
  -->

- [#27](https://github.com/eins78/agent-skills/pull/27) [`ab6b1ec`](https://github.com/eins78/agent-skills/commit/ab6b1ec45915cc778cbaa4e29d8c200ede294c89) - Add `pandoc` skill for document format conversion — teaches agents to use pandoc (60+ input, 80+ output formats) instead of writing ad-hoc conversion scripts. Includes curated manual reference, installation guide, and advanced topics (Lua filters, citations, slides, templates).

  <!--
  bumps:
    skills:
      pandoc: minor
  -->

### Patch Changes

- [#28](https://github.com/eins78/agent-skills/pull/28) [`eea8e9b`](https://github.com/eins78/agent-skills/commit/eea8e9becbf749fa538d69ab631ba0b7d61b59ca) - dossier: remove Telegram-specific delivery instruction (delivery is orchestrator's responsibility)

  <!--
  bumps:
    skills:
      dossier: patch
  -->
