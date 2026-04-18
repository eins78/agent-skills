---
framing-mode: {oss | commercial | hiring | vendor | personal}
---

<!--
  Section-order rule (reviewed in references/review-checklist.md):
  Glossary stays at top (read-support); Sources stays at end (trust-support).
  See skills/dossier/SKILL.md §SYNTHESIZE for the asymmetry rationale.
-->

# {Title}

**Date:** {YYYY-MM-DD}
**Author:** Claude Code (research commissioned by {Author})
**Status:** Research complete — awaiting decision

---

## Key Facts

<!-- REQUIRED. One screen. If it overflows, trim. -->
<!-- Readers with 5 minutes read only this section. Make every line count. -->

| | |
|---|---|
| **Who decides** | {named reviewer(s)} |
| **Decision model** | {e.g. single decider, majority / two-reviewer, must-agree-on-must / consensus-of-N} |
| **Deadline** | {YYYY-MM-DD or "no hard deadline"} |
| **Audience** | {who reads the dossier — not always the same as who decides} |
| **Hard constraints** | {1-3 items that any chosen option must satisfy} |
| **Load-bearing claim 1** | {the single fact that most shapes the recommendation} |
| **Load-bearing claim 2** | {second-most} |
| **Load-bearing claim 3** | {third-most — omit row if not needed} |

---

## Key Concepts

<!-- REQUIRED: 3-8 domain terms. Skip what any generalist knows. -->
<!-- Link priority: Wikipedia > official docs > tutorial > blog post -->
<!-- STAYS AT TOP — see section-order rule comment above. -->

| Term | What it is | Learn more |
|------|-----------|------------|
| **{Term}** | {1-sentence explanation} | [{Source}]({url}) · [{Source}]({url}) |

---

## Management Summary

<!-- REQUIRED: Ranked recommendations + 1-paragraph recommendation -->

### Top Recommendations

| Rank | Option | Why | Trade-off |
|------|--------|-----|-----------|
| **1. [{Name}]({url})** | {1-sentence why} | {Key trade-off} |
| **2. [{Name}]({url})** | {1-sentence why} | {Key trade-off} |
| **3. [{Name}]({url})** | {1-sentence why} | {Key trade-off} |

**Recommendation:** {1 paragraph with specific, actionable advice tailored to THIS context}

---

## Current State

<!-- REQUIRED for comparisons: What exists today. OPTIONAL otherwise. -->

{Tables for current services/infrastructure/situation. Risk assessment if applicable.}

---

## Requirements

<!-- REQUIRED for comparisons. OPTIONAL for investigations. -->

| # | Requirement | Weight | Notes |
|---|------------|--------|-------|
| R1 | {requirement} | **Critical** | {context} |
| R2 | {requirement} | **High** | {context} |
| R3 | {requirement} | **Medium** | {context} |

---

## Evaluations

<!-- REQUIRED: One subsection per evaluated option. -->

### 1. [{Option Name}]({url}) ★ RECOMMENDED

| Attribute | Detail |
|-----------|--------|
| **What** | {1-sentence description} |
| **Website** | [{url}]({url}) |
| **GitHub** | [{stars}]({github-url}) ★ · {forks} forks · {license} |
| **Latest** | {version} ({date}) |
| **Pricing** | {free/paid/freemium} |

<!-- Domain-appropriate attributes. Not all apply to every dossier: -->
<!-- Tech: RAM, Docker image, Language, Dependencies -->
<!-- Travel: Location, Price range, Rating, Distance -->
<!-- Products: Weight, Dimensions, Price, Availability -->
<!-- Health: Evidence level, Side effects, Dosage -->

{Key details, integration specifics, code blocks if applicable.}

{Cite factual claims with clickable reference-link syntax: `claim [S1][ref-S1]`. Inline `([text](url))` also works for one-off sources. Every `[Sn][ref-Sn]` citation must have a matching `[ref-Sn]: url` definition in §Sources.}

#### Requirement Fit

<!-- For comparisons: score against R1-Rn -->

{Score or prose assessment against each requirement}

<!-- Repeat for each evaluated option... -->

---

## Comparison Matrix

<!-- OPTIONAL: Useful for 4+ options. Side-by-side feature grid. -->

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| {feature} | {value} | {value} | {value} |

---

## Action Plan

<!-- OPTIONAL: For implementation research. Phased with timelines. -->

### Phase 1: {Goal} (Week 1)
1. {step}
2. {step}

### Phase 2: {Goal} (Week 2)
1. {step}

---

## Sources

<!-- REQUIRED: Categorized. Adapt headings to domain — not all apply.
     Citation pattern: body uses [Sn][ref-Sn]; §Sources lists each entry
     with a verbal description and a reference-link definition
     [ref-Sn]: https://... at the bottom. Pick any consistent
     category-prefix (S, G, R, O, etc.) and keep numbering
     contiguous per prefix. The rendered link shows "Sn"; clicking
     navigates to the URL. -->

### Official Documentation
- **S1** — [{Name}][ref-S1]: {what it covers}

### Community Discussions
- **S2** — [{Platform}: {Title} ({Date})][ref-S2]: {key takeaway}

### Comparison Articles
- **S3** — [{Author/Site}: {Title}][ref-S3]

### Blog Posts
- **S4** — [{Author}: {Title}][ref-S4]: {why it's relevant}

### Academic/Research
<!-- OPTIONAL: Health, policy, scientific topics -->
- **S5** — [{Authors} ({Year}): {Title}][ref-S5]: {finding}

### News Coverage
<!-- OPTIONAL: Current events, emerging trends -->
- **S6** — [{Outlet}: {Title} ({Date})][ref-S6]

### Podcasts
<!-- OPTIONAL: Niche topics with podcast coverage -->
- **S7** — [{Show} {Episode}: {Title}][ref-S7]: {relevant segment}

### Repositories
<!-- OPTIONAL: Open source projects -->
- **S8** — [{Name}][ref-S8]: {stars} ★

### Reviews/Ratings
<!-- OPTIONAL: Consumer products, travel, services -->
- **S9** — [{Source}: {Title}][ref-S9]: {rating/verdict}

### Government/Regulatory
<!-- OPTIONAL: Policy, compliance, legal -->
- **S10** — [{Body}: {Document}][ref-S10]

<!-- Reference-link definitions. Keep at the bottom of §Sources so any
     [Sn][ref-Sn] in the body resolves. Add one per source actually
     cited; delete the unused placeholders. -->

[ref-S1]: {url}
[ref-S2]: {url}
[ref-S3]: {url}
[ref-S4]: {url}
[ref-S5]: {url}
[ref-S6]: {url}
[ref-S7]: {url}
[ref-S8]: {url}
[ref-S9]: {url}
[ref-S10]: {url}
