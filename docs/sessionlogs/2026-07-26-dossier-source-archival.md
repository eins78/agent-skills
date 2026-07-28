# dossier: source archival for offline verification (PR #67)

**Date:** 2026-07-26
**Source:** Claude Code (Opus 5)
**Session:** No compactions · plan-mode design, then execution · ~34 min active · ~244k output tokens

## Summary

Added source archival to the `dossier` skill: cited sources are now captured to disk beside the dossier with an index mapping each file to its citation ID, URL, access date, and SHA-256. Shipped as PR #67 (open, CI green, not merged — Max reviews).

The design was researched by dogfooding the `dossier` skill on itself. **Two of the nine planned decisions were reversed by evidence during that research**; the shipped code shows the outcome but not that the plan said otherwise. That reversal is the main reason this log exists.

## Key findings that changed the design

### 1. `wget` was removed from the tool ladder entirely

The task brief said "research tools like wget mirror etc." — reasonable, and wrong twice over:

- **`wget --quota` provably cannot cap a single-file download.** GNU manual, verbatim: *"Note that quota will never affect downloading a single file. So if you specify `wget -Q10k …`, all of the ls-lR.gz will be downloaded... The quota is checked only at the end of each downloaded file."* Reproduced locally: `wget -q --quota=500 -O out https://example.com` → exit 0, full 559 bytes written.
- **`wget` is not on stock macOS.** `wget` → `/opt/homebrew/bin/wget` (Homebrew). `/usr/bin/curl` → root:wheel, Apple-shipped. **`curl` is tier 1**, not the fallback.

Since depth-0 capture is what verification needs, wget's one real advantage (recursion) is exactly the capability being excluded. It offers nothing curl doesn't do better, and curl can enforce a byte ceiling where wget cannot. Plan D2 had wget at tier 2; the ladder shipped as `monolith` → `curl`, with `pandoc` layered on.

`wget --mirror` is **rejected rather than capped** — recursion *is* the gigabyte failure mode, and mirroring a site is not what re-reading a cited page requires.

### 2. The thin-capture threshold moved from raw bytes to extracted text

Plan D7 specified "200 response under 2 KB of raw HTML". Measurement killed it:

| Page | Raw HTML | Extracted text |
|---|---|---|
| `x.com` (pure SPA) | 34,890 | **469** |
| `news.ycombinator.com` (server-rendered) | 34,966 | 4,050 |
| `react.dev` | 272,458 | 8,025 |
| MDN HTTP 404 | 209,184 | 12,177 |

x.com and Hacker News are **within 100 bytes of each other** and only one is a shell — SPA shells are large because they are mostly inline script. A raw-byte threshold discriminates nothing.

Replaced with a single-pass portable awk extractor (`RS="<"`, skipping script/style records) and a **1,000-character threshold**. `react.dev` is the instructive case: an SPA framework's own site that correctly *passes*, because Next.js pre-renders.

The first extractor attempt was abandoned — it used `sed` with `\n` in the replacement and the `I` flag, both **BSD-sed incompatible**, producing nonsense (example.com → 0 chars, react.dev → 1 char). No trace of it survives in the repo.

### 3. `curl --max-filesize` leaves a truncated partial on disk

```
curl: (56) Exceeded the maximum allowed file size (500) with 500 bytes
-rw-r--r--  1 user  wheel  500 /tmp/t1.out
```

Enforcement is genuinely mid-stream — the probe target sent no `Content-Length` at all, so there is no pre-check to rely on. The script must `rm` the partial on exit 56, or the archive silently contains half a page that looks complete.

(One self-corrected misread along the way: an initial cap of 1000 against example.com "passed" — because the page is 559 bytes, so the cap was never hit.)

### 4. pandoc needs a sanity check, not a fixed format

| Format | Hacker News | MDN |
|---|---|---|
| `-t markdown` (default) | 35 KB → **107 KB** | 209 KB → 29 KB |
| `-t gfm-raw_html` | 35 KB → **8 bytes** | 209 KB → **9.7 KB** |

Default `markdown` renders HN's table layout as ASCII grid tables and *inflates* the file. `gfm-raw_html` gives a superb 21:1 on semantic pages but deletes HN entirely, because HN's layout *is* raw HTML tables. Hence: try `gfm-raw_html`, sanity-check the result against the extracted-text length, fall back to `gfm`, and drop the `.md` unless it is smaller than the `.html`. Invisible in the diff; this is why.

### 5. `thin-capture` turned out to be a broader detector than designed

Archiving this PR's own sources, S14 (PyPI) flagged at 305 chars. Investigated rather than accepted: PyPI had returned **HTTP 200 with a Fastly "Client Challenge"** bot-protection interstitial instead of the package page. A status-code check would have filed a challenge page as evidence. Reframed in the docs as a general silent-failure detector, not just an SPA detector.

### 6. Two shipped design decisions contradicted each other (caught by dogfooding)

- **D6** — public repos gitignore `sources/*.html`
- **D9** — the gate requires every index row to resolve to a file on disk

On a **fresh clone** of a public repo the `.html` are absent by design, the index still names them, and the gate fails on every row. Fixed by teaching the gate `git check-ignore`: a referenced file that git is ignoring counts as present. A missing file that is *not* ignored still fails.

### 7. The repo-hygiene rule had a blind spot: distributed packages

The archive came to ~900 KB of `.md`, dominated by curl's genuinely ~290 KB manpage (correct extraction — the document really is that long). But **agent-skills is itself a distributed plugin**, so archived third-party docs would ship to every adopter who installs it. Added a third case to the rule: if the repo is a package other people install, gitignore `*.html` *and* `*.md`, commit `index.md` alone (6.9 KB here) — the index still preserves the full verification chain.

## Decisions

- **Gate is *consistency*, not *coverage*.** "Every citation must be archived" would hard-fail on a machine where nothing could be captured — exactly the adopter the portability constraint protects. The gate instead checks that the archive describes itself, and is silent when there is no `sources/`, or when `sources/` exists but `index.md` doesn't yet (archival mid-flight).
- **Both new scripts are `jq`-free.** `jq` is Homebrew-only on Linux minimal images; the dispatcher's existing dependency is pre-existing and wasn't extended. The index is a markdown pipe table that awk parses directly.
- **Wayback read and write split.** The availability API (read-only, publishes nothing) is on by default; Save Page Now is `--wayback-save` opt-in, because it submits to a permanent public archive. Related finding worth keeping: **Wayback's coverage is inversely correlated with rot risk** — it holds the stable popular pages that were never going to vanish, and misses the forum thread and dormant tracker.
- **No version hand-edit.** `.dev/scripts/bump-skill-versions.sh` has no idempotence guard — commit `93d9673` hand-bumped pandoc 1.1.0→1.2.0 and release `4c01e6d` bumped it *again* to 1.3.0. Verified zero `version:` drift in the diff.
- **shellcheck run locally** — CI runs only `pnpm test` → `pnpm run validate` → changeset check. Not catching this would have shipped unchecked scripts.
- **Deliberate GATHER deviation.** The `dossier` skill prescribes parallel Explore subagents; the standing session instruction was no Agent calls unless requested. Resolved in favour of the user instruction (skill-priority rule), doing GATHER via WebSearch/WebFetch plus local empirical tests — which was stronger here anyway, since the load-bearing claims were about tool behaviour on this machine.

## Changes Made

**Created:**
- `skills/dossier/scripts/archive-source.sh` (335 lines) — depth-0 capture, tier detection, caps, index append
- `skills/dossier/references/source-archival.md` (171 lines) — tiers, caps, index schema, Wayback split, repo hygiene, JS limitation
- `.claude-plugin/hooks/sources-index-consistency.sh` (102 lines) — the consistency gate
- `.changeset/20260726-dossier-source-archival.md`
- `research/2026-07-26-source-archival/DOSSIER-Source-Archival-Tooling-2026-07-26.md` (351 lines) + `sources/`

**Modified:**
- `skills/dossier/SKILL.md` — GATHER paragraph, Output Convention tree, Gates table, Common Mistakes rows. Also **reconciled prose the new gate would have falsified**: "One mechanical gate runs PostToolUse" and "Everything else is reviewed by checklist, not by grep", with a clause on why this gate differs from the six removed in the 2026-04-18 polish pass (it checks file-level facts, not document prose).
- `skills/dossier/references/review-checklist.md` — new item 10
- `skills/dossier/templates/dossier.md` — optional `### Archive` subsection
- `skills/dossier/README.md` — provenance, tree, dependencies, testing, known gaps
- `.claude-plugin/hooks/dossier-hook-dispatcher.sh` — loop over both gates

## Plan Reference

- Plan: `~/.claude/plans/add-source-archival-to-stateful-meadow.md` (D1–D9)
- **Executed as planned:** D1 (depth 0), D3 (caps), D4 (index), D5 (Wayback split), D6 (repo hygiene), D8 (GATHER paragraph, no sixth stage), D9 (consistency gate)
- **Reversed by research:** D2 (wget dropped from the ladder), D7 (thin-capture threshold: 2 KB raw bytes → 1,000 chars extracted text)
- **Amended during dogfooding:** D6 gained the distributed-package case; D9 gained `git check-ignore` awareness

## Verification performed

- `shellcheck` clean ×3; `pnpm test` PASS; `pnpm run validate` "All skills valid (0 warning(s))"; zero version drift
- Capture: server-rendered, JS shell, bot challenge, unreachable host (exit 0), **stock `PATH=/usr/bin:/bin` bare machine**
- Gate: all 8 paths (no `sources/`, no `index.md`, consistent, `index.md`/`.gitignore` not orphans, missing file, orphan file, ballot, bad args)
- Dispatcher via stdin JSON; existing ballot gate regression-checked
- One post-PR bug found and fixed: `shift 3` fails atomically with <3 args, dumping positionals into the option loop → printed `unknown option: https://…` instead of usage

## Next Steps

- [ ] **Max reviews PR #67** — https://github.com/eins78/agent-skills/pull/67 (open, CI green, `mergeable`, deliberately not merged)
- [ ] **Retro-archive the two home-workspace dossiers from 2026-07-26** — recommended and deliberately not done here (different repo, out of scope). Their citation mix (GitHub issues, forum threads, mailing-list posts, a dormant tracker) is exactly the long tail Wayback does *not* hold, and recovery rate is highest while the pages are fresh. Expect some `thin-capture` rows needing manual browser capture; that's a workspace not a plugin, so `.md` extractions should be committed there.
- [ ] Optional: `skills/dossier/tests/` for `archive-source.sh`, following the `pandoc` skill's pattern — currently verified by documented manual scenarios only

## Repository State

- Branch: `worktree-dossier-archive` (pushed, tracks origin)
- `75fc5a6` — dossier: capture cited sources for offline verification (11 files, +1127/-15)
- `ca2463f` — dossier: surface the archive in the dossier, fix citation-ID timing
- PR #67 open against `main`, CI `validate` pass, **not merged**
