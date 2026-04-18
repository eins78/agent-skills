# Audio-skill v0 — design inputs from operator

Sibling to [`2026-04-18-audio-skill-feasibility-EN.md`](./2026-04-18-audio-skill-feasibility-EN.md) and its ballot. Captures ongoing design-shape input from the operator that lands BETWEEN the feasibility dossier and the v0 PR (task #29, blocked on ballot return).

This file is a log, not a decision surface — add new entries as they arrive; the v0 delegate brief reads this file before planning.

---

## 2026-04-18 — hard-example dossiers, chapters, embedded transcript

**Context.** Operator reviewed the PR #45 `JUDGE-COMPARISON.md` report (horizontal 5-column × 12-row pass/fail matrix per scorer, plus aggregate stats and failure-modes section with technical-term-dense narrative — "max_tokens saturates CoT", "poolOptions.threads.maxThreads", "reasoning field"). Reported it as "an extreme example for the audio-skill." Clarified 2026-04-18 20:26Z that the hard example is the JUDGE-COMPARISON doc, not the v2.3.0 QA report referenced initially.

**Two-tier fixture corpus** (operator clarified 2026-04-18 20:27Z):

- **Normal example** — any of the recent research dossiers, e.g. [`research/2026-04-13-bluesky-personal-llm-bots/`](../../../OPS/home-workspace/research/2026-04-13-bluesky-personal-llm-bots) or [`research/2026-04-12-ghost-pepper-security-audit/dossier.md`](../../../OPS/home-workspace/research/2026-04-12-ghost-pepper-security-audit). Prose-dominant with occasional bullet lists and short tables. Representative of the daily output the skill will transform.
- **Hard example** — `JUDGE-COMPARISON.md` from PR #45 on eins78/agent-skills. Multi-column technical comparison matrices, mixed acronyms (MoE, CoT, SDK), verdict sections with embedded code snippets (` ``` ` blocks) and metric expressions (`0.00`, `1.00`, `~21s vs ~24s`). Stress-tests the transformation rules and the chapter-skip UX.

**Operator quote (verbatim):**

> this doc is also an extreme example for the audio-skill. those comparison table and technical terms are challenging.
> also inspiration: the audio files should have chapter support (so i could just skip a table-read). and "transcript" embedded (might be even the original text before transforming for audio).
> i am using overcast. the developer talked about transcript support in the episode about his auto transcripts and later episodes https://podcastsearch.david-smith.org/episodes/7929

### What this enriches in the v0 design

Three concrete additions to the v0 scope beyond what the feasibility dossier already covers:

1. **Chapters** — structural/skippable markers in the audio file. MP3 supports ID3v2 CHAP frames; M4A/AAC supports iTunes-style chapters in `moov/udta/chpl`. Both are widely respected by podcast clients including [Overcast](https://overcast.fm) (confirmed upstream by the developer). Implementation: emit a chapter at each H2/H3 boundary in the source markdown with timestamp derived from audio position. A "table follows" chapter lets the listener skip past a dense comparison table without hunting for it.

2. **Embedded transcript** — the "original text before transforming for audio" rather than a reconstructed transcript from ASR. Podcasting 2.0 supports a `<podcast:transcript>` RSS namespace element with `type="text/html"` or `text/vtt`. Alternative: embed the transcript as a separate enclosure OR reference a sibling URL in the RSS feed. For v0, serving the source markdown (or the audio-transformed markdown) as a sibling `.txt` or `.html` at a predictable path like `/p/<token>/transcripts/<slug>.{txt|html}` and referencing it via `<podcast:transcript>` is cleanest. Overcast supports Podcasting 2.0 transcripts.

3. **Table-shaped content is the worst case** — this re-weights the transformation conventions (§Transformation Conventions in the EN dossier). "Tables → prose summary first, then optional row-by-row" gets tested on `JUDGE-COMPARISON.md` as the stress fixture: a 5-column scorer × fixture × model matrix (12 rows), a 6-column aggregate-statistics matrix (2 rows), plus verdict prose with inline code fences and acronym-dense technical jargon. Both matrices are legitimately skip-worthy by chapter.

### Reference material

- [ATP (Accidental Tech Podcast) episode transcript][ref-R1] — linked via David Smith's `podcastsearch.david-smith.org` transcript-search service. Marco Arment (Overcast dev, ATP co-host) discusses transcript support in this ATP episode and later ones. Operator's source. Corrected 2026-04-18 20:34Z (had been attributed to an Overcast episode).
- Podcasting 2.0 transcript spec: `<podcast:transcript>` namespace element
- ID3v2 CHAP (chapter) frames: MP3 chapter support
- Apple iTunes chapters: `moov/udta/chpl` atom in M4A/AAC

### v0 scope delta

The feasibility dossier's v0 recommendation was: Piper (or Kokoro per EN-only update) + feedgen RSS + Telegram `sendAudio` opt-in. These inputs don't change the stack choice — they add three features to the v0 output:

- Chapter generation at H2/H3 boundaries → requires markdown AST walk with timestamp tracking (feasible in `remark`/`unified`)
- Transcript file emission alongside the audio → minor addition to the feed generation (write `.txt` / `.html` to `/p/<token>/transcripts/<slug>`)
- `<podcast:transcript>` element added to `feedgen` / `podcast` npm output → one RSS field

Implementation cost delta vs. original v0 scope: probably +2-4 hours total. Meaningful value-add: the listener can skip tables and use the transcript as durable reference.

### Open sub-decision (for the v0 ballot OR the delegate)

Format of the embedded transcript:
- (A) **Source markdown** — the dossier exactly as written; accurate but includes the table/code that the audio version skipped
- (B) **Audio-transformed text** — what the TTS actually spoke; useful as literal transcript but loses the table data
- (C) **Both** — the RSS entry references the audio-transformed text as the transcript; the source markdown is a separate sibling file linked in the episode description

(C) is probably the right call (audio-text is the canonical transcript, source markdown is a "full written version" link) but can be decided later — either option works as v0.

### Not captured in the v0 scope (parking lot)

- Table-to-chart conversion for audio ("bar chart voiced in 4 beats") — too experimental
- Per-chapter speaker change (intro voice vs body voice) — deferred to v2
- Podcasting 2.0 chapters via `<podcast:chapters>` element instead of in-file ID3 — works, but in-file chapters are more durable (no URL round-trip needed)

---

[ref-R1]: https://podcastsearch.david-smith.org/episodes/7929
