# Dossier Review Checklist

Walk through this checklist after completing a dossier and before committing DELIVER. Each item is a concern that requires judgement — not a pattern a grep can reliably catch. A reviewer (human or judgement-capable model) reads the finished dossier with the checklist in hand and calls out any red flags before the commit lands.

Each item is structured:

- **What to check** — one concrete sentence
- **Why it matters** — the failure mode it prevents
- **What "good" looks like** — evidence of intent the reviewer can point to
- **Red flags** — specific patterns that suggest the check fails

---

## 1. Framing coherence

**What to check.** The declared `framing-mode` in the dossier frontmatter matches the tone throughout the body — especially in §Executive Summary and §Recommendations, where framing leaks land first.

**Why it matters.** A framing mismatch wastes reviewer attention on the wrong axis (OSS reviewers dragged into Paddle-vs-Stripe comparisons; commercial reviewers dragged into community-sustainability narratives). Catching it at review prevents a whole round of rewriting.

**What good looks like.** An OSS dossier's §Executive Summary talks about adoption, contribution, reputation, license choice; mentions pricing only as comparative context ("the closest commercial alternatives cost ~$X/mo"). A commercial dossier's §Recommendations leads with revenue model and customer segment; mentions donations only when they are a real revenue line. A hiring dossier keeps compensation out of the body.

**Red flags.**
- OSS dossier with a comparison table whose columns are price tiers.
- Commercial dossier whose §Success Metrics are community contribution counts.
- Hiring dossier with compensation numbers inline (compensation belongs in the offer letter; see `framing-modes.md`).
- A dossier whose `framing-mode:` frontmatter was last edited *after* the §Executive Summary was written (check `git blame`).

---

## 2. Citation integrity

**What to check.** The dossier uses **clickable reference-link citations**: every `[S1][ref-S1]` (or `[G6][ref-G6]`, `[R1][ref-R1]` — the prefix letter is the author's category convention) in the body has a matching `[ref-S1]: https://...` definition in §Sources, and the definition resolves to a primary source. Inline `[text](url)` hyperlinks are also fine for one-off sources. Factual claims that would make a reviewer ask "how do you know?" have citations attached.

**Why it matters.** Orphan refs are cut-paste errors or last-minute edits that lost their source. A reviewer who finds one orphan starts distrusting every other citation. The reference-link pattern makes citations clickable in rendered markdown (GitHub, Obsidian, Bitbucket, most renderers) while preserving the `[S1]` bracket token in raw markdown for readers viewing the file directly.

**What good looks like.** Every body citation like `[S4][ref-S4]` has:
1. A verbal §Sources entry for `S4` (e.g. "**S4** — [Author: Title][ref-S4]: why relevant").
2. A reference-link definition `[ref-S4]: https://...` at the bottom of §Sources.
3. A live URL that returns the cited source when clicked.

Evidence of intent: the author picked one category-prefix scheme (say, `S` for all sources, or `R`/`G`/`S` for requirement-anchors / general context / supporting) and applied it consistently. Zero-citation dossiers are acceptable for opinion pieces and thought experiments — judge whether the load-bearing claims demand citations.

**Renderer-portability alternative.** If the dossier's target renderer supports markdown footnotes (GitHub, Obsidian, pandoc), `[^S1]` → `[^S1]: https://...` is lighter syntax with numbered jump-backs. The reference-link pattern is the default because it parses identically in Confluence, mobile markdown readers, and terminal previewers, which often don't render footnotes. When in doubt: reference-links.

**Red flags.**
- A `[S4][ref-S4]` citation with no `[ref-S4]: ...` definition anywhere.
- A single orphan bare `[G6]` that isn't paired with `[ref-G6]` — either upgrade to clickable or drop the ref.
- §Sources entries or reference definitions whose URLs don't appear in the body.
- Dated claims with no citation ("Kubernetes 1.29 released in January 2026" with no link).
- A §Sources section with live URLs that 404 when spot-checked.
- Mixed category prefixes without a pattern (`S1`, `G2`, `X3`, `foo4` in the same dossier).

---

## 3. Dated-claim freshness

**What to check.** Every deadline, CFP close date, release window, "as of YYYY-MM-DD", and "closes N Month YYYY" claim is current as of the production date. Dates tied to external events (conferences, product releases) have been re-verified against a primary source accessed today.

**Why it matters.** Dates stale silently. A dossier written over multiple sessions carries forward dates that are now wrong. "Closes 30 April 2026" is trivially fact-checkable but invisible once you're in line 400 of a 700-line dossier. This was the single most common drift source in the a11y-extension session.

**What good looks like.** Every dated claim has either a citation dated within the last 30 days, or an explicit "as accessed YYYY-MM-DD" marker. Dates that are themselves the subject of the research (e.g. "the next release window is X") are called out and the source is dated. The dossier's production date is visible somewhere.

**Red flags.**
- "Closes 30 April 2026" when today is 2 May.
- A "most recent release" claim whose citation URL 404s.
- A deadline from an earlier session that hasn't been reconfirmed in the session that delivered the dossier.
- Relative dates ("last quarter", "next month") without an anchor date.

---

## 4. Section ordering

**What to check.** Glossary / Key Concepts / Terminology (when present) appears *before* any Executive Summary or Management Summary. Sources appears *last*.

**Why it matters.** Glossary is read-support — a reader encountering unfamiliar terms (CDP, AX tree, MoR, CLA, DCO) needs definitions before the terms appear in summary sections. Sources are trust-support — consulted when a claim is questioned, which happens after reading. The asymmetry is deliberate; moving glossary to the back by analogy with sources breaks read-support.

**What good looks like.** A reader can open the dossier and read Key Facts → Glossary → Executive Summary in that order without bouncing to a later section for a term definition. §Sources is the last H2 and is browseable without reading linearly.

**Red flags.**
- Glossary as §11 of 12 while §5 Executive Summary assumes knowledge of glossary terms.
- Sources in the middle of the document "so reviewers see it" — they don't need to; the trust-support reading pattern is broken.
- A table of contents that puts Glossary and Sources adjacent (suggests the author thinks they have the same role).

---

## 5. Source bias flagging

**What to check.** Commercially-motivated sources (vendor blogs, sponsored benchmarks, affiliate comparisons, press releases) are flagged in §Sources or adjacent annotations. If most of the evidence comes from sources with financial motivation, the §Executive Summary calls this out explicitly.

**Why it matters.** A silent vendor bias is a trust leak — the reviewer discovers it mid-evaluation and reassesses the whole dossier. Calling out the bias up-front preserves the analysis's credibility even when the sources are skewed. (Pattern from the `@young.mete` Threads addition to the dossier skill, 2026-04.)

**What good looks like.** §Sources groups entries by type ("Official", "Vendor-authored", "Independent", "Community", "Affiliate"), or individual entries are annotated ("vendor blog", "sponsored content"). If vendor sources dominate, the §Executive Summary or §Evaluation notes it: "Most published benchmarks are vendor-authored; spot-check with independent tests before committing."

**Red flags.**
- §Sources is a flat list of 10 URLs, 7 of which are the vendor's own domain, with no annotation.
- A comparison table whose "Pros" column matches the vendor's marketing page almost verbatim.
- Silent reliance on one comparison article that turns out to be sponsored.
- Affiliate links in body text without disclosure.

---

## 6. Hyperlink density

**What to check.** Every entity (product, company, person, concept with a canonical reference) is hyperlinked on first mention. Body text doesn't exceed ~3 hyperlinks per sentence.

**Why it matters.** Bare entity names force the reader to search for context. Over-linked body text reads like a Wikipedia disambiguation page — the reviewer loses the thread. Zero hyperlinks in a web-researched dossier signals it wasn't actually researched (or the research pre-dates the publish phase by too long).

**What good looks like.** First mention of each major entity links to the canonical URL (kubernetes.io, the vendor's homepage, the author's academic page). Second and later mentions are bare. Body sentences have 1-2 links maximum; if they need more, the content is a list. §Sources is the dense-link section; body is readable prose.

**Red flags.**
- A dossier about Chrome extensions that mentions "Google Chrome" five times without linking once.
- A sentence with five hyperlinks in fifteen words.
- Body-text hyperlinks pointing to the dossier's own §Sources rather than to the primary source.
- Hyperlinks only on entity *first* mentions that happen to be in §Sources (so the body is bare).

---

## 7. Selectivity

**What to check.** The dossier answers the decision(s) it was commissioned for, not every adjacent question the research turned up. Scope expansions during research are called out and justified.

**Why it matters.** Agent-generated dossiers under-prune by default — "here's everything I found" beats "here's what you need to decide" in training. Scope creep costs the reviewer 2-3× the reading time and dilutes the recommendation signal.

**What good looks like.** §Recommendations maps to §Requirements one-to-one. §Further Reading (if present) is clearly shorter than §Recommendations. Any section introduced with "I also noticed..." or "worth mentioning..." was justified in §Scope or is flagged as scope-creep that the reviewer can cut.

**Red flags.**
- §Recommendations is 200 lines; §Further Reading is 400 lines.
- A §Related Technologies section whose items aren't referenced in §Recommendations.
- An §Appendix that is deeper than the main body.
- Three parallel recommendations when the commissioning question had one decider axis.

---

## 8. Key Facts box accuracy

**What to check.** The Key Facts box exists near the top of the dossier (after frontmatter, before §Glossary or §Executive Summary), fits on one screen, and contains: who decides, decision model, deadline, hard constraints, audience, and 3–5 load-bearing claims. Each load-bearing claim has a citation.

**Why it matters.** The five-minute reader reads only Key Facts. If the box is missing, they read the first two sections and leave with whatever framing those happened to have. Load-bearing claims without citations undermine the summary — the reviewer can't tell which claims to challenge.

**What good looks like.** The Key Facts box is under 15 lines. A reviewer decides whether to keep reading within 60 seconds. Each load-bearing claim links to §Sources or an inline URL. The audience line is a prose sentence that describes a real reader ("Engineering leadership reviewing for Q3 architecture planning"), not a generic one-word field.

**Red flags.**
- No Key Facts box; §Executive Summary does double duty.
- Key Facts box 40 lines long with 12 bullet points (no longer scannable).
- Load-bearing claims like "adoption is growing rapidly" with no citation.
- Audience line says "all readers" or "developers" without further specification.

---

## Why this replaced the old grep hooks

Earlier iterations of the dossier skill shipped four grep-based audit hooks: `dossier-citation-audit.sh`, `dossier-forbidden-words.sh`, `dossier-section-order.sh`, and `dossier-dated-claim-scan.sh`. Each encoded a specific failure pattern from the a11y-extension Chrome-Web-Store session: the `[Xn]` citation convention, the OSS-mode forbidden-word list, H2-level glossary headings, and ISO-date patterns.

Dossiers in other styles use different conventions. A hiring brief uses prose citations, not `[Xn]` refs. A vendor-selection dossier may put Glossary under an H3 subsection. An architecture decision record may have no §Sources at all. The grep hooks either miss real failures (they don't recognize the pattern) or fire spurious failures (they match something the dossier does on purpose).

This checklist generalizes the *concerns* without hard-coding the *patterns*. The two hooks that remain (`dossier-framing-declared.sh` and `ballot-filename.sh`) are genuinely mechanical — a framing declaration either exists or doesn't; a ballot filename either matches the pattern or doesn't. A grep is the right tool for both.
