<!--
  RESEARCH DOSSIER template. For the decision genre — ranked options and a
  recommendation — use templates/dossier.md instead. The genre is settled in
  Preflight 4 and recorded in SCOPE. See skills/dossier/SKILL.md.

  Genre rule: this document maps the state of a topic so the reader draws
  their own conclusions. Headings name SUBJECTS, not stances. Findings state
  facts about the world, not verdicts on someone's proposal. Any assessment
  lives in ONE clearly-labelled final section, and never supplies a heading
  anywhere above it.

  Section-order rule (reviewed in references/review-checklist.md):
  Glossary stays at top (read-support); Sources stays at end (trust-support).

  Anti-revision rule (reviewed in references/review-checklist.md item 9):
  One current version. No "Revision note" block, no `rev. <date>` suffix on
  the Date line, no edit-history narration in the body. When corrections
  come in mid-session, rewrite the affected lines as plain present-tense
  facts; do not append a changelog.
-->

# {Title}

**Date:** {YYYY-MM-DD}
**Author:** Claude Code (research commissioned by {Author})
**Status:** Research complete

{One or two sentences naming what this document covers — the subject, not the
conclusion. "Who has shipped X, what it does, how it authenticates, and how
alive the code is."}

{Research window, and how to treat time-sensitive numbers: "Repository metrics
were queried {date} — they are point-in-time numbers, not durable facts."}

This document is written to be read straight through. Every fact that matters is
stated in the text; links are citations, not places where content lives.

---

## Key Facts

<!-- REQUIRED. One screen. If it overflows, trim. -->
<!-- Readers with 5 minutes read only this section. Make every line count. -->
<!-- Research genre: scope/method/evidence, NOT who-decides/deadline. If you
     find yourself wanting a "Decision model" row, re-check the genre. -->

| | |
|---|---|
| **Scope** | {what the research covers} |
| **Inclusion rule** | {what counts as in-scope, and what that excludes — "every vendor with a documented server; excludes aggregator listings"} |
| **Method** | {how the facts were gathered — sources fetched, APIs queried, agents dispatched} |
| **Evidence quality** | {the verification levels used, and roughly how much falls in each} |
| **Research window** | {dates; note if the session crossed a date boundary} |
| **Audience** | {who reads this} |
| **Finding 1** | {a fact about the world — the one that most shapes the picture} |
| **Finding 2** | {second} |
| **Finding 3** | {third — omit row if not needed} |

---

## Key Concepts

<!-- REQUIRED: 3-8 terms. Placed BEFORE content — a reader needs definitions
     before encountering the terms, not after. -->

| Term | What it is | Learn more |
|---|---|---|
| **{Term}** | {1-sentence explanation} | [{Source}]({url}) · [{Source}]({url}) |

---

## {The one-line answer / The short version}

<!-- A LEDE, not a verdict. State the most important thing the research
     established, as a fact. Do NOT tell the reader what to do here, and do
     NOT adjudicate a proposal — that belongs in the final section, if at all. -->

{The single most consequential fact, in bold, in one or two sentences. Then the
nuance that qualifies it.}

---

## How to read the evidence

<!-- OPTIONAL but strongly preferred when verification depth varies across the
     document. A reader drawing their own conclusions needs to know which
     facts bear weight. -->

- **Verified** — {the primary source was fetched and read}
- **Reported** — {taken from a search-result summary; directionally reliable, do not quote as exact wording}

{Any trap-shaped facts worth stating plainly: self-assigned "official" labels,
dead projects still listed in directories, roadmap items described as shipped.}

---

## {Subject area 1}

<!-- Heading names a SUBJECT. Group by a property that carries explanatory
     weight — the grouping is itself a finding. Not alphabetical. -->

{Prose. State the shared shape of the group before the individual entries.}

### {Entity}

**{Attribute}:** {value}. **{Verification level}.**

{What it is, what it exposes, how it authenticates, how alive it is — whatever
attributes the domain makes load-bearing. Hyperlink every entity on first
mention. Cite factual claims [S1][ref-S1].}

---

## {Subject area 2}

{…}

---

## What the picture implies

<!-- Conclusions ABOUT THE WORLD drawn from the survey — still not
     recommendations to the reader. "The gap that is already closed" /
     "the gap that is real" / "who the competitor would be". -->

---

## What could not be determined

<!-- REQUIRED. Gaps are findings. Silence here fakes completeness and removes
     the reader's ability to judge how far the research actually reached. -->

- {Question that stayed open, and why — source unavailable, paywalled, would need vendor contact}

---

## Assessment — {the specific question asked}

<!-- OPTIONAL. Include ONLY when the reader asked for an assessment as well as
     the research. It goes HERE, at the end, after they have the facts.
     It must not supply headings above this point, and must not lead the
     document. A reader must be able to stop before this section and still
     have the complete research.
     Label it so it is unmistakably opinion resting on the survey above. -->

{The assessment, argued from the findings above and citing them by section.}

{Where it is uncertain, say so — an assessment that hides its own weak points
is less useful than one that names them.}

---

## Sources

<!-- REQUIRED: Categorized. Adapt headings to domain — the full category menu
     is in templates/dossier.md; use whichever apply.
     Citation pattern: body uses [Sn][ref-Sn]; §Sources lists each entry with
     a verbal description and a reference-link definition [ref-Sn]: https://...
     at the bottom. Keep numbering contiguous per prefix. -->

### Official Documentation
- **S1** — [{Name}][ref-S1]: {what it covers}

### Repositories
- **S2** — [{Name}][ref-S2]: {stars} ★

### Community Discussions
- **S3** — [{Platform}: {Title} ({Date})][ref-S3]: {key takeaway}

### Archive
<!-- Include whenever sources were captured with archive-source.sh. Name any
     row whose status is thin-capture or unavailable — an unacknowledged
     failed capture reads as a successful one. -->

Sources are captured locally under [`sources/`](sources/), indexed in [`sources/index.md`](sources/index.md) with the access date and a SHA-256 per source.

[ref-S1]: {url}
[ref-S2]: {url}
[ref-S3]: {url}
