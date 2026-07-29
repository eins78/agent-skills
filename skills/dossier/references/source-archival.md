# Source Archival

Capturing cited sources to disk so a claim can still be verified after the source moves, changes, or disappears. Loaded on demand from GATHER.

The goal is **verification**, not reproduction. Someone re-reading this later needs to confirm that the cited page said what the dossier claims it said. They do not need the site to render, work offline, or look right. Every decision below follows from that.

---

## Usage

```bash
"${CLAUDE_SKILL_DIR}/scripts/archive-source.sh" <url> <citation-id> <sources-dir>
```

Run it once per source, during GATHER, as URLs are collected — not as a separate pass at the end:

**This requires assigning citation IDs at collection time.** The natural instinct is to number sources while writing §Sources, which puts archival after SYNTHESIZE and turns it into a stage of its own. Keep a running URL→ID list instead as findings come back, and let SYNTHESIZE group already-numbered sources into categories. Archiving late still works — the index and the gate do not care when it happened — but it costs a separate pass over every URL, and sources that went down during the research are already gone by then.

```bash
SRC="research/2026-07-26-topic/sources"
"${CLAUDE_SKILL_DIR}/scripts/archive-source.sh" https://example.com/docs   S1 "$SRC"
"${CLAUDE_SKILL_DIR}/scripts/archive-source.sh" https://forum.example/t/42 S2 "$SRC"
```

Options:

| Flag | Effect |
|---|---|
| `--no-wayback` | Skip the Wayback availability lookup entirely (no request leaves the machine except the capture itself) |
| `--wayback-save` | **Submits the URL to a public archive.** See §Wayback before using |

The script **never fails a dossier.** A missing archiver, an unreachable host, a 403, a TLS error, or an over-cap response all produce an index row recording what happened, and exit 0. Archival is best-effort by design; a dossier that refuses to finish because a page was down is worse than one with a gap in its archive.

---

## What gets captured

**Depth 0 — the cited page, nothing else.** No recursion, no crawling, no outlinks, no site mirroring. This is the single most important constraint: recursion is what turns an archive into a multi-gigabyte accident, and it buys nothing, because verification needs the page that was cited rather than the site it lives on.

Tool ladder — best available wins, degrades silently:

| Tier | Tool | Output | Present by default? |
|---|---|---|---|
| 1 | `monolith` | one self-contained `.html`, assets inlined as data URIs | No — `brew install monolith` |
| 2 | **`curl`** | raw `.html` | **Always** — Apple-/distro-shipped |
| + | `pandoc` | additional `.md` text extraction, on top of either tier | No — `brew install pandoc` |

**`wget` is deliberately absent.** It cannot enforce a size ceiling on a single fetch — the GNU manual states that `--quota` *"will never affect downloading a single file"* — and it is not installed on stock macOS. `curl --max-filesize` can, and is. `wget --mirror` and `--page-requisites` are rejected rather than capped: recursion is the failure mode, not something to tune.

The `.md` extraction is the artifact that actually gets read later — small, quotable, greppable, diffable. It is produced only when it earns its place (smaller than the HTML, and the capture isn't a JS shell).

**It is HTML→text conversion, not readability extraction.** pandoc drops `<script>`/`<style>` and linearises what remains; it does not score the DOM to isolate an article body the way [Mozilla Readability](https://github.com/mozilla/readability) does. Navigation and footer text survive into the output. This is adequate for verifying a quote — do not describe it as readability extraction.

---

## Caps

| Bound | Value |
|---|---|
| Per-source timeout | 20 s |
| Per-source max size | 5 MB |
| Redirects followed | 5 |
| Recursion depth | **0 — no knob exists** |
| Per-dossier sources | 100 |
| Per-dossier total | 100 MB |

Over-cap sources are recorded as `capped`, not stored. `curl` enforces the ceiling mid-stream and leaves a truncated partial on disk, so the script deletes it — a half-page in the archive is worse than a recorded gap, because it looks complete.

---

## Layout and index

```
research/YYYY-MM-DD-slug/
├── DOSSIER-Title-Words-YYYY-MM-DD.md
└── sources/
    ├── index.md                  # the map — always committed
    ├── .gitignore                # scaffolded; see §Repo hygiene
    ├── S1-example.com-docs.html
    ├── S1-example.com-docs.md    # when pandoc is present and it's smaller
    └── S2-forum.example-t-42.html
```

`index.md` is a markdown pipe table:

| ID | URL | Accessed | File | Tool | SHA-256 | Bytes | Status | Wayback |
|---|---|---|---|---|---|---|---|---|

**The index is the load-bearing artifact**, more than the captures themselves. Without the citation-ID ↔ URL ↔ access-date mapping, a directory of HTML files is unusable. And because it records the URL, the date, and a content hash, it preserves the verification chain even when a blob has been dropped: you can still state exactly what was cited and when, and compare a later re-fetch against the hash.

Status values:

| Status | Meaning |
|---|---|
| `ok` | Captured, and the page has real text content |
| `thin-capture` | Captured, but almost no readable text — a JS-rendered page or a bot-challenge interstitial. See §JS-rendered pages |
| `capped` | Exceeded the size ceiling; not stored |
| `unavailable` | Fetch failed; the reason is recorded inline |

---

## JS-rendered pages — the honest limitation

Neither `curl` nor `monolith` executes JavaScript (monolith's own README says so outright). For a client-rendered page, what lands on disk is the shell: framework bootstrap and inline script, with none of the content a human would see.

This cannot be fixed without shipping a browser, and a research skill has no business requiring a Chromium install. So the skill **detects** what it cannot fix: after each capture, a portable `awk` pass strips `<script>`/`<style>` and measures the remaining readable text. Under 1,000 characters, the row is flagged `thin-capture`.

The threshold is empirically grounded rather than guessed. Measured captures:

| Page | Raw HTML | Extracted text | Verdict |
|---|---|---|---|
| `x.com` | 34,890 | **469** | JS shell — flagged |
| `news.ycombinator.com` | 34,966 | 4,050 | fine |
| `react.dev` | 272,458 | 8,025 | fine — Next.js pre-renders |
| MDN HTTP 404 reference | 209,184 | 12,177 | fine |

Raw byte count would not work: `x.com` and Hacker News are within 100 bytes of each other in size, and only one of them is a shell. `react.dev` is the instructive case — an SPA framework's own site that passes, because it pre-renders.

**The flag also catches bot-challenge interstitials**, which is the more common silent failure in practice. Capturing a PyPI project page during this skill's own research returned **HTTP 200** and a page titled "Client Challenge" — Fastly's bot protection, not the cited content. A status-code check would have recorded that as a clean success and filed a challenge page as evidence. Anything that returns 200 with no readable text gets flagged, whatever the reason.

**When a source is flagged `thin-capture`,** capture it manually with a browser ("Save Page As → Web Page, Complete"), or with a rendering archiver such as [single-file-cli](https://github.com/gildas-lormeau/single-file-cli) or [percollate](https://github.com/danburzo/percollate). Both drive a real browser and capture the rendered DOM. Neither is a dependency of this skill; they are the documented escape hatch.

---

## Wayback Machine — two different things

**Availability lookup (read) — on by default.** `archive.org/wayback/available?url=…` asks whether a public snapshot already exists and records its URL. It submits nothing and creates nothing. It does disclose the URL to the Internet Archive as an ordinary HTTP request; `--no-wayback` skips it.

Worth knowing what this is and isn't worth: **Wayback's coverage is inversely correlated with rot risk.** The pages it reliably holds are the popular, stable, institutionally-maintained ones that were never going to vanish. The sources that actually rot — one thread in a forum, one issue in a dormant tracker, a vendor page for a discontinued product — are exactly the long tail it is least likely to have. Recording the snapshot is free and occasionally saves the day. It is not a substitute for local capture.

**Save Page Now (write) — opt-in, explicit, never a default.**

> Passing `--wayback-save` **publishes the URL to a permanent, public archive.**

Internet Archive saved pages are explicitly designed to be *"cited, shared, linked to"* and to outlive the original. Submitting one is an outward-facing act, not a fetch.

The risk is a privacy leak shaped like a feature. Someone researching a medical diagnosis, a legal problem, an acquisition target, or a job change would be publishing their reading list to a permanent public index — one URL at a time, as a side effect of writing a report. The Internet Archive's note that submissions are anonymous addresses the *submitter's* identity, not the disclosure that matters here: the **set of URLs** becomes public either way. Anonymity of submission is not confidentiality of subject.

Never pass `--wayback-save` without the user asking for it, and never as a blanket default across a dossier's sources.

---

## Repo hygiene

Archived sources land in git. What gets committed depends on what it is:

| Artifact | Default |
|---|---|
| `index.md` | **Always committed.** It is the author's own factual record — URL, date, hash. Nothing third-party about it |
| `.md` text extractions | **Committed.** Transformed, quotable; ordinary research notes |
| `.html` page bodies | **Committed in private repos.** In **public** repos, uncomment `*.html` in the scaffolded `sources/.gitignore` |

The size caps above are what make committing tenable at all — a bounded, depth-0 archive of text pages is a few hundred KB, not a vendored website.

Two things worth knowing before committing an archive:

**The `.md` is usually much smaller than the page, but a long document stays long.** Typical ratios run 5:1 to 20:1 (a 209 KB MDN page extracts to under 10 KB). A genuinely large reference document does not shrink: `curl`'s manpage extracts to ~290 KB of markdown because that is how much text it contains. Check the total before committing rather than assuming extraction made it small.

**If the repository is a distributed package** — a plugin, a published library, anything other people install — keep the whole archive out of the payload: gitignore `*.html` *and* `*.md`, and commit `index.md` alone. Every adopter would otherwise download the maintainer's research sources as part of the install. The index is only a few KB and still preserves the full verification chain: URL, access date, and content hash for every source. The captures stay on the author's disk, where they are useful, instead of in everyone's `node_modules`.

**One legal note, no lecture:** caching a page locally to verify a claim you cited is ordinary research practice; republishing that copy — which is what committing it to a public repository does — is a separate question, and one the adopter should answer for their own repo and jurisdiction. The `.gitignore` scaffold makes the public-repo case a one-line change rather than a rewrite.

---

## Gate

`sources-index-consistency.sh` runs PostToolUse via the dossier hook dispatcher and checks that the archive describes itself: every index row resolves to a file on disk, and every captured file has a row (`index.md` and `.gitignore` excepted).

A referenced file that **git is ignoring** counts as present. This is what makes the public-repo rule above workable: with `sources/*.html` gitignored, a fresh clone has `index.md` and the `.md` extractions but none of the page bodies, and the index still names them. That is correct, not broken — the index is *supposed* to record what was captured even where the blob isn't redistributed. A missing file that is *not* ignored still fails.

It is a **consistency** gate, not a **coverage** gate. It never asks "was every citation archived?" — that question has no safe answer on a machine where no archiver could run, and a gate that blocks a dossier over an uncapturable source would violate the whole degrade-gracefully premise. It silently passes when there is no `sources/` directory, and when `sources/` exists but `index.md` hasn't been written yet (archival mid-flight).

What it catches is the failure that actually makes an archive worthless: files with no provenance, or an index pointing at nothing.
