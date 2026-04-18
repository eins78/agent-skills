---
framing-mode: {oss | commercial | hiring | vendor | personal}
---

<!--
  Section-order rule (enforced by .claude-plugin/hooks/dossier-section-order.sh):

    Glossary / Key Concepts / Terminology  →  STAYS AT TOP
    Sources                                 →  STAYS AT END

  The asymmetry is deliberate. Glossary is READ-SUPPORT — a reader needs the
  definitions BEFORE encountering the terms in content. Sources are
  TRUST-SUPPORT — consulted AFTER content, when a specific claim is questioned.

  Do not move Glossary to the appendix by analogy with Sources. The hook
  will fail the build and this comment will stay.
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
| **Decision model** | {e.g. single decider / two-reviewer vote / consensus of N} |
| **Deadline** | {YYYY-MM-DD or "no hard deadline"} |
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

{Cite factual claims inline: `claim ([source](url))`}

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

<!-- REQUIRED: Categorized. Adapt headings to domain — not all apply. -->

### Official Documentation
- [{Name}]({url}): {what it covers}

### Community Discussions
- [{Platform}: {Title} ({Date})]({url}) — {key takeaway}

### Comparison Articles
- [{Author/Site}: {Title}]({url})

### Blog Posts
- [{Author}: {Title}]({url}) — {why it's relevant}

### Academic/Research
<!-- OPTIONAL: Health, policy, scientific topics -->
- [{Authors} ({Year}): {Title}]({url}) — {finding}

### News Coverage
<!-- OPTIONAL: Current events, emerging trends -->
- [{Outlet}: {Title} ({Date})]({url})

### Podcasts
<!-- OPTIONAL: Niche topics with podcast coverage -->
- [{Show} {Episode}: {Title}]({url}) — {relevant segment}

### Repositories
<!-- OPTIONAL: Open source projects -->
- [{Name}]({url}) — {stars} ★

### Reviews/Ratings
<!-- OPTIONAL: Consumer products, travel, services -->
- [{Source}: {Title}]({url}) — {rating/verdict}

### Government/Regulatory
<!-- OPTIONAL: Policy, compliance, legal -->
- [{Body}: {Document}]({url})
