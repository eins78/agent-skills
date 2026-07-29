# Source Archival Tooling for the `dossier` Skill

**Date:** 2026-07-26
**Author:** Claude Opus 5 (session dossier, dogfooding the `dossier` skill)
**Status:** Complete — feeds the `dossier` source-archival feature (PR against `eins78/agent-skills`)

## Key Facts

| | |
|---|---|
| **Decision** | Which tool(s) the `dossier` skill uses to capture cited web sources for offline verification |
| **Who decides** | Max (repo owner), reviewing the PR |
| **Decision model** | Async PR review; this dossier is the evidence base |
| **Hard constraint** | Skill ships via plugin marketplace to third parties — **zero required dependencies beyond what macOS/Linux ship**. Must degrade, never hard-fail |
| **Optimise for** | *Verifying a cited claim later*, not reproducing a website |
| **Load-bearing claim 1** | **`wget` cannot size-cap a single-file download.** GNU manual: *"quota will never affect downloading a single file"* [S11][ref-S11] — confirmed by local probe |
| **Load-bearing claim 2** | **`wget` is not on stock macOS.** Local probe: `wget` → `/opt/homebrew/bin/wget` (Homebrew); `curl` → `/usr/bin/curl` (Apple-shipped, root:wheel) |
| **Load-bearing claim 3** | **`monolith` has no JS engine** — *"Monolith doesn't feature a JavaScript engine"* [S1][ref-S1]. Every no-browser tool shares this limit |
| **Load-bearing claim 4** | **Wayback's availability API is read-only** and publishes nothing [S2][ref-S2]; Save Page Now *publishes* [S3][ref-S3] |
| **Load-bearing claim 5** | **Wayback covers the sources least likely to rot and misses those most likely to.** Local probe: `example.com` snapshotted today; a nonexistent path returns `{"archived_snapshots":{}}` |
| **Recommendation** | **`curl` (floor, always present) + `monolith` (opt-in upgrade) + `pandoc` (opt-in text extraction).** Reject `wget`, `httrack`, `ArchiveBox`, `single-file-cli`, `percollate` as skill dependencies |

## Key Concepts

- **Link rot** — a cited URL ceasing to resolve, or resolving to different content, after the citation was written. The failure this feature exists to survive.
- **Depth-0 capture** — fetching exactly the cited page and nothing it links to. Contrast with *mirroring*, which recurses.
- **Page requisites** — the CSS/images/fonts a page needs to render. Optional for verification, mandatory for visual fidelity.
- **Readability extraction** — heuristic scoring of a DOM to isolate the article body and discard nav/ads/chrome. Mozilla's `Readability` is the reference implementation [S15][ref-S15]. **Not** the same as HTML→text conversion.
- **JS shell** — an HTML response for a client-rendered page: substantial bytes, almost no human-readable text. Defeats every non-browser archiver.
- **SPN (Save Page Now)** — Internet Archive's submit-a-URL endpoint. An **outward-facing publish**, not a fetch.
- **Availability API** — Internet Archive's *query* endpoint. Asks whether a snapshot exists; creates nothing.

## Management Summary

### Top Recommendations

| Rank | Tool | Role | Required? |
|---|---|---|---|
| ★ 1 | **`curl`** | Capture floor — raw HTML, depth 0, hard size cap | **Never absent** (Apple/distro-shipped) |
| ★ 2 | **`pandoc`** | Text extraction → small quotable `.md` | Optional upgrade |
| ★ 3 | **`monolith`** | Single-file HTML with assets inlined | Optional upgrade |
| ✗ | `wget` | — | **Rejected** — cannot cap size; absent on stock macOS |
| ✗ | `single-file-cli` | — | Rejected as dependency; documented as manual escape hatch for JS pages |
| ✗ | `percollate` / `ArchiveBox` / `httrack` | — | Rejected — wrong shape or too heavy |

**Recommendation.** Build the capture step on `curl` alone and treat everything else as an upgrade the script detects at runtime. This is not a compromise forced by the portability constraint — `curl` is genuinely the *better* tool for this job. It is the only candidate that can enforce a hard byte ceiling on a single fetch, which is the specific safety property the feature needs. `wget`, the tool the request named first, provably cannot do this: the GNU manual states outright that *"quota will never affect downloading a single file"* [S11][ref-S11], and a local probe confirms it downloads the full file regardless of `-Q`. Since depth-0 capture is what verification requires, `wget`'s one genuine advantage over `curl` — recursion — is exactly the capability being deliberately excluded.

Layer `pandoc` on top when present. On a real page it converts 209 KB of HTML into ~12 KB of clean prose (local probe, MDN's HTTP 404 reference) — small enough to commit without hesitation, greppable, diffable, and quotable. It is the single highest-value artifact for the actual use case of "confirm this claim said what I said it said."

The honest limitation is client-rendered pages, and it is unavoidable without shipping a browser. `monolith` inlines assets but explicitly has no JS engine [S1][ref-S1]; only `single-file-cli` [S5][ref-S5] and `percollate` [S6][ref-S6] render, and both require a Chrome/Chromium install. The right response is detection, not a heavy dependency: flag thin captures in the index so a human knows which sources need manual attention, and document the escape hatch.

## Current State

The `dossier` skill captures nothing. A case-insensitive grep for `archive|wget|mirror|offline|snapshot|wayback` across its `SKILL.md` and both reference files returns zero matches. Every citation a dossier produces is a bare URL whose survival is entirely the publisher's business.

The skill's own reviewer checklist already treats this as a failure mode, in two separate items, without prescribing any remedy:

- *"A §Sources section with live URLs that 404 when spot-checked"* — checklist item 2, red flags
- *"A 'most recent release' claim whose citation URL 404s"* — checklist item 3, red flags

The consuming workspace has meanwhile documented the practice as a standing principle (`CLAUDE.md` #7, "Archive Referenced Docs": local backups under `projects/<name>/docs-archive/`, *"simple HTML/text dumps (images rarely needed)"*). The intent predates the tooling; only the implementation is missing.

Two dossiers produced on 2026-07-26 in that workspace contain `.md` files exclusively. Their citations skew heavily toward the rot-prone end of the spectrum: GitHub issues, forum threads, mailing-list archives, vendor product pages, and one dormant project's issue tracker.

## Requirements

| ID | Requirement | Weight |
|---|---|---|
| **R1** | **Zero required dependencies.** Must function on a stock macOS or Linux machine with nothing installed. Missing archiver must never fail a dossier | **Critical** |
| **R2** | **Hard size ceiling per source.** No capture path may pull unbounded bytes | **Critical** |
| **R3** | **Optimised for verification**, not visual reproduction. Text fidelity outranks pixel fidelity | **Critical** |
| **R4** | **No silent outward-facing action.** Nothing may publish the user's reading list by default | **Critical** |
| **R5** | **Index mapping** file → citation ID → original URL → access date. Without it the archive is unusable | **High** |
| **R6** | **Commit-friendly.** Artifacts land in git; size and redistribution posture must be defensible | **High** |
| **R7** | **Honest about JS-rendered pages** — detect and flag rather than silently store a shell | **High** |
| **R8** | **Bounded workflow cost.** A step inside GATHER, not a sixth stage | **Medium** |

## Evaluations

### 1. [curl](https://curl.se/) ★ RECOMMENDED — the capture floor

| Attribute | Value |
|---|---|
| Availability | `/usr/bin/curl`, Apple-shipped (local probe: `root:wheel`, 552 KB, dated Sep 2025). Universal on Linux |
| Version here | 8.7.1 |
| JS execution | None |
| Size cap | **`--max-filesize`** [S12][ref-S12] |
| Output | Raw HTML, one file |

#### Requirement Fit

**R2 — the decisive property.** `curl` is the only candidate that enforces a byte ceiling on a single fetch. Local probes establish the exact semantics, which matter for implementation:

- With a cap above content size → exit 0, full file (probe: `--max-filesize 99999` on a 559-byte page).
- With a cap below → **exit 56**, aborted mid-stream: `curl: (56) Exceeded the maximum allowed file size (500) with 500 bytes`.
- **The truncated partial file is left on disk** (probe: 500 bytes written). Any implementation must delete the partial on exit 56, or the archive silently contains half a page.
- Enforcement is genuinely mid-stream, not a `Content-Length` pre-check — the probe target sent no `Content-Length` at all (HTTP/2, chunked), and the cap still fired.

**R1** — cannot be absent. **R3** — raw HTML preserves everything a later reader needs; pairing with pandoc yields the quotable form. **R7** — supports the detection heuristic below.

**Against.** No JS (R7 partial). No asset inlining, so a captured page renders unstyled — acceptable under R3, where the text is the evidence.

---

### 2. [pandoc](https://pandoc.org/) ★ RECOMMENDED — text extraction layer

| Attribute | Value |
|---|---|
| Availability | Optional (`brew install pandoc`); present on this machine |
| Role | HTML → Markdown / plain text [S13][ref-S13] |
| Compression observed | **209 KB → ~12 KB** extracted text (local probe, MDN HTTP 404 page) |

#### Requirement Fit

**R3, R6** — this is the verification-optimal artifact and the one that makes the commit question easy. A ~12 KB Markdown file of an article's prose is unambiguously ordinary research notes: small, transformed, diffable, greppable.

**Honesty note (R3).** pandoc is **not** a readability extractor. It drops `<script>`/`<style>` and linearises the remaining document; it does not score the DOM to isolate an article body the way Mozilla's `Readability` does [S15][ref-S15]. Nav and footer text survive into the output. The local probe shows this directly — the MDN conversion retains an "In this article" nav list alongside the article prose. The result is nonetheless entirely adequate for verification, and the skill must describe it as HTML→text conversion rather than claiming readability extraction it does not perform.

**Against.** Optional, so never load-bearing. Fidelity of complex tables/code blocks varies.

---

### 3. [monolith](https://github.com/Y2Z/monolith) ★ RECOMMENDED — opt-in fidelity upgrade

| Attribute | Value |
|---|---|
| Install | Homebrew, cargo, MacPorts, Nix, Docker, Arch, Alpine, FreeBSD, and more [S1][ref-S1] |
| Output | **One** self-contained HTML5 file, assets as data URIs [S1][ref-S1] |
| JS execution | **None** — *"Monolith doesn't feature a JavaScript engine"* [S1][ref-S1] |
| Timeout flag | `-t` [S1][ref-S1] |
| Size cap | **None documented** [S1][ref-S1] |

#### Requirement Fit

**R3, R6** — a single self-contained file is the cleanest possible archival unit: no sidecar asset directory, nothing to break on move. Best available fidelity without a browser.

**Against.** No documented size limit (R2) — it fetches subresources with only `-t` bounding it, so it must be wrapped in an external timeout and its output size-checked after the fact rather than during. Not installed by default anywhere, so strictly an upgrade tier. Same JS blindness as `curl` (R7), so it buys fidelity, not coverage. Its own README recommends Chromium as a preprocessor for dynamic pages [S1][ref-S1] — an explicit acknowledgement that this class of tool cannot solve the SPA problem.

---

### 4. [wget](https://www.gnu.org/software/wget/) ✗ REJECTED

| Attribute | Value |
|---|---|
| Availability | **Not on stock macOS** — local probe: `/opt/homebrew/bin/wget`, no `/usr/bin/wget` |
| Single-file size cap | **Impossible** [S11][ref-S11] |
| Recursion | `--mirror` = `-r -N -l inf --no-remove-listing` [S11][ref-S11] |

#### Requirement Fit

Rejected on **R2**, decisively and on a primary source. The GNU manual states:

> Note that quota will never affect downloading a single file. So if you specify `wget -Q10k https://example.com/ls-lR.gz`, all of the ls-lR.gz will be downloaded. […] The quota is checked only at the end of each downloaded file. [S11][ref-S11]

A local probe reproduces this exactly: `wget -q --quota=500 -O out https://example.com` exits 0 having written all 559 bytes. `--quota` is a *retrieval* budget across a multi-file job, not a per-file ceiling. For depth-0 capture — the only mode this feature uses — it is a no-op.

**`--mirror` is rejected rather than capped.** Recursion is the mechanism that produces the gigabyte failure mode; bounding it with depth and quota flags manages a risk that simply does not need to be taken. Verification requires re-reading *the cited page*, not reproducing the site. `--page-requisites` is likewise declined: it fetches the assets needed to *render* the page, which serves visual fidelity (R3 explicitly deprioritises this) at the cost of an asset sprawl `monolith` handles better in one file.

Also fails **R1** as a floor — absent on stock macOS, which inverts the ladder the original request assumed. `wget` offers nothing `curl` does not do better within depth-0 scope.

---

### 5. [single-file-cli](https://github.com/gildas-lormeau/single-file-cli) ✗ REJECTED as dependency — documented as escape hatch

| Attribute | Value |
|---|---|
| Requires | **Chrome/Chromium installed** [S5][ref-S5] |
| Runtime | Deno; drives the browser over Chrome DevTools Protocol [S5][ref-S5] |
| JS execution | **Yes** — captures the rendered DOM [S5][ref-S5] |
| Output | One self-contained HTML file [S5][ref-S5] |

#### Requirement Fit

The only reviewed tool that genuinely solves **R7**: it captures what a human actually sees, because a real browser rendered it. Output shape matches `monolith`'s.

**Against R1**, fatally as a dependency. It requires a Chromium-family browser *and* a Deno or npm runtime [S5][ref-S5]. Mandating a browser install on every adopter of a research skill is exactly the toolchain imposition the constraint forbids.

**Disposition:** not detected, not invoked, but **named in the skill's documentation** as the correct manual remedy when a source is flagged `thin-capture`. This converts an unavoidable limitation into an actionable one at zero dependency cost.

---

### 6. [percollate](https://github.com/danburzo/percollate) ✗ REJECTED

| Attribute | Value |
|---|---|
| Requires | Puppeteer (**bundles/needs headless Chrome**) + Node [S6][ref-S6] |
| Extraction | **Mozilla Readability** — genuine boilerplate removal [S6][ref-S6] |
| Output | PDF, EPUB, HTML, or Markdown [S6][ref-S6] |

#### Requirement Fit

Technically the best fit for **R3** on paper — real readability extraction plus JS rendering, producing exactly the clean article text verification wants. It is the tool `pandoc` is a cheap approximation of.

**Against R1.** Puppeteer means a headless Chrome download, typically >100 MB. Its documented limitations are inherited directly from Readability and Puppeteer [S6][ref-S6]. Its output orientation is *reading* (PDF/EPUB for later consumption), not *evidence retention* — a subtly different goal that shows up in defaults.

Worth naming in the skill as an alternative for adopters who already run a Node/Puppeteer stack.

---

### 7. [ArchiveBox](https://archivebox.io/) ✗ REJECTED — right idea, wrong scale

| Attribute | Value |
|---|---|
| Requires | Python 3, `uv`, plus a large optional dependency set [S7][ref-S7] |
| Docker image bundles | python3.13, uv, curl, wget, git, node, npm, single-file, readability-extractor, postlight-parser, yt-dlp, **playwright, chromium** [S8][ref-S8] |
| Model | Persistent self-hosted archive with its own database and web UI |

#### Requirement Fit

Conceptually the closest match to the goal — it captures a URL many ways at once (HTML, screenshot, PDF, readability text, WARC) and indexes the result, which is precisely the shape a research archive wants.

**Against R1 and R8**, both fatally. It is a self-hosted *service*, not a capture command: it maintains its own index and expects to be installed, initialised, and run alongside the work. Its own Docker image bundles Chromium and Playwright [S8][ref-S8], which is the dependency weight being avoided. Standing up ArchiveBox as a precondition for writing a research report inverts the cost of the task.

The genuinely portable idea worth stealing is its multi-format-per-URL approach — reflected in the recommendation to store both raw HTML *and* extracted text when pandoc is present.

---

### 8. [HTTrack](https://www.httrack.com/) ✗ REJECTED

| Attribute | Value |
|---|---|
| Maintenance | **Active** — 3.49.6 (2025-03-11), 3.49.7 (2026-06-06), 3.49.8 (2026-06-20) [S10][ref-S10] |
| Purpose | Full website copier / offline browser [S9][ref-S9] |
| Availability | Not preinstalled anywhere relevant |

#### Requirement Fit

Rejected on purpose-fit, not on quality or staleness — worth stating plainly, since "unmaintained" would be a convenient and *false* reason to dismiss it. The release history shows two releases in June 2026 alone [S10][ref-S10].

The mismatch is categorical: HTTrack is a **site mirrorer**. It exists to walk a site and reproduce it locally. That is the same recursion-driven failure mode as `wget --mirror`, with the same answer — verification needs one page, not a site. Using a mirroring tool at depth 0 means paying its complexity for none of its value. Fails **R1** as well.

---

### 9. Internet Archive Wayback Machine — **read side ✓ default, write side ✗ opt-in**

This is two distinct capabilities behind one brand name, and conflating them would be a genuine mistake.

**Availability API — read.** `https://archive.org/wayback/available?url=…` [S2][ref-S2]. Purely a query: it reports whether a snapshot exists and returns its URL. It submits nothing and creates nothing. Live probes:

```
?url=example.com
  → {"archived_snapshots":{"closest":{"available":true,
     "url":"http://web.archive.org/web/20260726143728/http://example.com/", …}}}
?url=example.com/definitely-not-archived-86577
  → {"archived_snapshots":{}}
```

**Finding worth stating explicitly: Wayback's coverage is inversely correlated with rot risk.** The probes show `example.com` snapshotted the same day and MDN's HTTP 404 reference snapshotted 2025-03-13 — both popular, stable, institutionally-maintained pages that were *never likely to disappear*. The sources that actually rot — a specific forum thread, one issue in a dormant tracker, a vendor page for a discontinued product — are precisely the long tail Wayback is least likely to hold. Recording the availability result is worth doing because it is free and read-only, but it is **not** a substitute for local capture. It insures the sources that need it least.

**Save Page Now — write.** Submitting a URL causes the Internet Archive to fetch and **publish** it; results are explicitly *"cited, shared, linked to"* and permanent [S3][ref-S3]. Programmatic use of the SPN2 API now requires Internet Archive S3-style credentials [S4][ref-S4][S14][ref-S14].

**This must be opt-in, explicitly, and never a default.** The risk is not technical but a privacy leak with the shape of a feature: an adopter researching a medical diagnosis, a legal problem, an acquisition target, or a job change would be publishing their reading list to a permanent public index, one URL at a time, as a side effect of writing a report. The archive's own note that *"we do not keep your IP address, so your submission is anonymous"* [S3][ref-S3] addresses the submitter's identity and not the disclosure that matters here — the *set of URLs* becomes public regardless. Anonymity of submission is not confidentiality of subject.

## Comparison Matrix

| | curl | pandoc | monolith | wget | single-file-cli | percollate | ArchiveBox | HTTrack |
|---|---|---|---|---|---|---|---|---|
| **R1** Zero-dep | ★ always | opt | opt | ✗ not on macOS | ✗ browser | ✗ Chrome | ✗ heavy | ✗ |
| **R2** Size cap | ★ `--max-filesize` | n/a | ✗ none | ✗ **impossible** | ✗ | ✗ | ✗ | ✗ |
| **R3** Verification fit | ✓ raw | ★ text | ✓ styled | ✓ raw | ★ rendered | ★ readability | ★ multi | ✗ site |
| **R7** JS pages | ✗ | ✗ | ✗ | ✗ | ★ | ★ | ★ | ✗ |
| **R8** Bounded cost | ★ | ★ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Verdict** | **floor** | **layer** | **upgrade** | reject | escape hatch | note | reject | reject |

### Thin-capture detection — validated heuristic

R7 requires *detecting* what cannot be *fixed*. Two candidate measures were tested against real pages, using only tools guaranteed present.

**Raw HTML byte count fails.** `x.com`, a pure client-rendered SPA, returns **34,890 bytes** — indistinguishable by size from Hacker News at 34,966 bytes, which is fully server-rendered. SPA shells are large because they are mostly inline script.

**Extracted-text length works.** A portable single-pass `awk` extractor (`RS="<"`, skipping `script`/`style` records) yields:

| URL | Raw HTML | Extracted text | Rendered server-side? |
|---|---|---|---|
| `x.com` | 34,890 | **469** | ✗ JS shell |
| `example.com` | 559 | 142 | ✓ (genuinely tiny page) |
| `news.ycombinator.com` | 34,966 | 4,050 | ✓ |
| `react.dev` | 272,458 | 8,025 | ✓ (Next.js pre-renders) |
| `developer.mozilla.org/…/404` | 209,184 | 12,177 | ✓ |
| `github.com/Y2Z/monolith` | 369,414 | 9,468 | ✓ |

A threshold of **1,000 characters of extracted text** separates the JS shell from every genuinely-rendered page. `react.dev` is the instructive case: an SPA framework's own site that nonetheless *passes*, because Next.js pre-renders — a raw-byte test would have misjudged it, and a naive "is it a SPA?" assumption would too. `example.com` falls below the threshold and is flagged; this is a correct outcome for an advisory flag, since a 142-character capture warrants an eyeball either way.

The extractor needs `awk` only — no `pandoc`, no `jq`, no Node. It therefore behaves identically on an equipped machine and a bare one, which a pandoc-based measure would not.

## Action Plan

1. **Capture with `curl`** at depth 0 — `-sSL`, `--max-time 20`, `--max-filesize 5000000`, `--max-redirs 5`. **Delete the partial file on exit 56**; record the source as capped rather than storing a truncated page.
2. **Prefer `monolith` when detected**, wrapped in an external timeout and size-checked after the fact, since it documents no size limit.
3. **Emit an additional `.md` via `pandoc` when detected.** Describe it as HTML→text conversion, never as readability extraction.
4. **Run the awk text-length probe on every capture**; flag rows under 1,000 characters as `thin-capture` and point the reader at `single-file-cli` or a manual browser save.
5. **Query the Wayback availability API by default** (read-only, publishes nothing) and record any existing snapshot URL. Note in the docs that coverage skews toward sources that were never at risk.
6. **Gate Save Page Now behind an explicit opt-in flag**, with the reading-list disclosure risk stated in the skill body, not only in the PR description.
7. **Write `sources/index.md`** mapping citation ID → URL → access date → file → tool → hash → bytes → status. The index is the load-bearing artifact: even with blobs dropped, URL + date + hash preserves the verification chain.
8. **Never fail a dossier on capture failure.** Unreachable, 403, TLS error, or over-cap all produce an index row with a status and reason, and the run proceeds.

## Sources

### Official Documentation
- **S1** — [Y2Z/monolith — CLI tool for saving complete web pages as a single HTML file][ref-S1]: no JS engine; single-file data-URI output; install channels; `-t` timeout; recommends Chromium as preprocessor for dynamic pages
- **S2** — [Internet Archive: Wayback Machine Availability JSON API][ref-S2]: read-only snapshot query endpoint, parameters and response shape
- **S3** — [Internet Archive Help: Save Pages in the Wayback Machine][ref-S3]: SPN behaviour; saved pages are permanent and publicly citable; saves page + images + CSS, no outlinks
- **S5** — [gildas-lormeau/single-file-cli][ref-S5]: requires a Chromium-family browser; drives it over CDP; captures the rendered DOM
- **S6** — [danburzo/percollate][ref-S6]: Readability + Puppeteer; PDF/EPUB/HTML/Markdown output; documented limitations inherited from both
- **S7** — [ArchiveBox — Install documentation][ref-S7]: Python 3 + `uv` plus optional external dependency set
- **S9** — [HTTrack Website Copier][ref-S9]: full-site offline browser, project home
- **S11** — [GNU Wget Manual][ref-S11]: *"quota will never affect downloading a single file"*; `--mirror` equivalence; `--page-requisites` semantics
- **S12** — [curl manpage — `--max-filesize`][ref-S12]: per-transfer maximum size
- **S13** — [Pandoc — universal document converter][ref-S13]: HTML input, Markdown/plain output

### Repositories
- **S8** — [ArchiveBox/ArchiveBox — Dockerfile (`dev`)][ref-S8]: image bundles python3.13, node, npm, single-file, readability-extractor, postlight-parser, yt-dlp, playwright, chromium
- **S15** — [mozilla/readability][ref-S15]: the reference readability-extraction implementation; the standard `pandoc` is explicitly *not* meeting

### Release Notes / Project History
- **S10** — [HTTrack release history (`history.txt`)][ref-S10]: 3.49.6 (2025-03-11), 3.49.7 (2026-06-06), 3.49.8 (2026-06-20) — project is actively maintained

### Third-party Tooling (evidence for SPN auth posture)
- **S4** — [Internet Archive S3-Like API Keys][ref-S4]: where SPN2 credentials are issued; requires a logged-in archive.org account
- **S14** — [wayback-machine-archiver (PyPI)][ref-S14]: independent confirmation that programmatic SPN use requires S3-style credentials

### Archive

Every source above is captured locally under `sources/`, indexed in [`sources/index.md`](sources/index.md) with access date and SHA-256 — produced by the tool this dossier recommends.

Only `index.md` is committed. `agent-skills` is a distributed plugin, so archived third-party pages would otherwise ship to every adopter who installs it; the index alone preserves the verification chain at 7 KB. One row is flagged: **S14 (PyPI) is a `thin-capture`** — the fetch returned HTTP 200 with a Fastly "Client Challenge" interstitial rather than the package page. The claim it supports (that programmatic Save Page Now requires S3-style credentials) rests on [S4][ref-S4], the Internet Archive's own key-issuing page, which captured cleanly.

### Local Probes (2026-07-26, this machine — macOS 24.6.0, curl 8.7.1, GNU Wget 1.25.0)
Not third-party sources; reproducible commands, recorded for verification.
- Tool presence: `/usr/bin/curl` (Apple-shipped) vs `/opt/homebrew/bin/wget` (Homebrew); `monolith`, `single-file`, `httrack`, `percollate` all absent
- `curl --max-filesize`: exit 56 mid-stream, truncated partial left on disk; no `Content-Length` present on the probe target
- `wget --quota=500` on a 559-byte file: exit 0, full file written — confirms [S11][ref-S11]
- `pandoc -f html -t plain` on MDN HTTP 404: 209,184 → ~12 KB, nav text retained
- Extracted-text table under §Comparison Matrix
- Wayback availability responses quoted under §Evaluations 9

[ref-S1]: https://github.com/Y2Z/monolith
[ref-S2]: https://archive.org/help/wayback_api.php
[ref-S3]: https://help.archive.org/help/save-pages-in-the-wayback-machine/
[ref-S4]: https://archive.org/account/s3.php
[ref-S5]: https://github.com/gildas-lormeau/single-file-cli
[ref-S6]: https://github.com/danburzo/percollate
[ref-S7]: https://docs.archivebox.io/latest/Install.html
[ref-S8]: https://github.com/ArchiveBox/ArchiveBox/blob/dev/Dockerfile
[ref-S9]: https://www.httrack.com/
[ref-S10]: https://www.httrack.com/history.txt
[ref-S11]: https://www.gnu.org/software/wget/manual/wget.html
[ref-S12]: https://curl.se/docs/manpage.html
[ref-S13]: https://pandoc.org/
[ref-S14]: https://pypi.org/project/wayback-machine-archiver/
[ref-S15]: https://github.com/mozilla/readability
