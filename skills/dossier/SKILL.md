---
name: dossier
description: >-
  Use when asked to research, compare, evaluate, or investigate any topic.
  Triggers: research this, compare options, evaluate alternatives, investigate,
  find the best, product comparison, technology evaluation, which should I use,
  pros and cons, recommendation report, dossier, what are my options.
compatibility: claude-code, cursor
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "1.1.0"
---

# Dossier

Structured research producing actionable reports with ranked recommendations, cited sources, and optional decision ballots. Works for any domain — tech, travel, health, policy, finance, art.

## Workflow: SCOPE → GATHER → EVALUATE → SYNTHESIZE → DELIVER

### 0. Preflight — verify the request is actionable

Before starting research, confirm all three:

1. **Specific** — what to investigate is bounded: a named topic, a concrete comparison, or a clear question. "Look into the X space generically" fails this.
2. **Unambiguous** — contested terms are defined by context. If the request uses a word with multiple plausible meanings and context doesn't resolve which, flag it.
3. **Well-understood** — you can state the objective back to the operator in 1–2 sentences without hedging. If you'd have to pad with "I think you mean…" or "depending on what you want from this…", you don't understand it yet.

If one or more checks fail, **ask before starting**. A dossier built on unclear objectives wastes more research time than the clarifying turn costs. Batch questions; offer choices where reasonable; skip the obvious.

If all three check out, proceed directly to SCOPE. Do not ask just to perform diligence — the bar is "the answer isn't obvious from context," not "I want to be extra sure."

### 1. SCOPE

- **Type:** comparison, evaluation, or investigation?
- **Requirements:** R1-Rn with weights (Critical/High/Medium) — for comparisons
- **Selectivity:** 5-8 options, not a laundry list
- **Decision model** (when a choice is being made): note who decides, by when, and how — record in the Key Facts box before GATHER.
- **Sources:** consult `${CLAUDE_SKILL_DIR}/references/sources-by-domain.md`
- **Output folder:** Check existing `research/` directories first — if one matches the current topic, add to it rather than creating a new folder. Ask the user when unsure. Only create `research/YYYY-MM-DD-slug/` for genuinely new topics.

### 2. GATHER

Dispatch parallel subagents scaled to complexity:

| Complexity | Strategy |
|-----------|----------|
| Quick (1-2 options) | Sequential, no subagents |
| Standard (3-6) | 1 Explore agent per option |
| Deep (6+ or broad) | 1 per option + 3 fact-checkers post-synthesis |
| Architecture decision | 3 Plan agents with named perspectives |

Each agent returns structured findings with URLs for every claim. Check `/last30days` first for topics with social signal (consumer, OSS). Skip for B2B, academic, niche. Pivot to WebSearch if <3 results.

**Dated-claim verification.** Every deadline, CFP date, release-window, or "closes X 2026" claim must be re-verified against a primary source accessed on the production date. Dates stale silently; they are the single most common source of drift in multi-session dossiers. Reviewed via `${CLAUDE_SKILL_DIR}/references/review-checklist.md` (dated-claim-freshness item).

### 3. EVALUATE

- Score options against requirements
- Build attribute tables appropriate to the domain
- Cross-reference across agents — multi-source citations get highest weight
- Flag contradictions
- **Flag commercial incentives:** when sources have financial motivation, call this out explicitly in the dossier (e.g. "most links are vendor/affiliate sites") rather than silently discarding them

### 4. SYNTHESIZE

Write dossier using `${CLAUDE_SKILL_DIR}/templates/dossier.md`:

- **Key Facts box** (required, one screen): who decides, decision model, deadline, hard constraints, audience line, 3–5 load-bearing claims. Readers with five minutes read only this section — make every line count.
- **Glossary / Key Concepts** (3–8 terms): after Key Facts, **before** any summary or content section. Glossary is *read-support* — a reader needs definitions before encountering terms in content.
- **Hyperlink every entity** on first mention.
- **Cite factual claims** with clickable reference-link syntax: `claim [S1][ref-S1]` where each citation token (`S1`, `G6`, `R1`, `O3` — pick a consistent category-prefix scheme) has a matching `[ref-S1]: https://...` definition at the end of §Sources. The raw markdown preserves the `[S1]` bracket token for anyone reading the file directly; the rendered link reads as `S1` and clicks through to the URL. Inline `([text](url))` also works for one-off sources. Bar: "could someone verify this?". If your target renderer supports them, the footnote form `[^S1]` is lighter — see `${CLAUDE_SKILL_DIR}/references/review-checklist.md` (citation-integrity) for the portability trade-off.
- **Source categories** adapt to domain (see template).
- **Template-order rule.** Glossary stays at the top; Sources stay at the end. The asymmetry is deliberate — glossary is read-support (before), sources are trust-support (after). Do not move glossary to the appendix by analogy with sources.

**Ballot** (when decisions happen async — reviewed over chat, on a PR, after the session ends): use the `ballot` skill. Works for multi-reviewer panels and single async deciders alike. Template at `skills/ballot/templates/ballot-per-reviewer.md`; conventions at `skills/ballot/SKILL.md`.

### 5. DELIVER

Before committing, run the reviewer checklist at `${CLAUDE_SKILL_DIR}/references/review-checklist.md` against the finished dossier. It covers preflight evidence, citation integrity, dated-claim freshness, section ordering, source bias flagging, hyperlink density, selectivity, and Key Facts box accuracy. The mechanical gate (`ballot-filename`) fires automatically on Write/Edit via the PostToolUse hook — exit 2 feeds stderr back to Claude — but most review concerns need human or judgement-capable model review, not pattern matching. Once the checklist passes:

- Commit dossier folder (`D:` intention per commit-notation).
- **Do NOT end the session** — stay available for follow-ups, iterations, or additional dossiers.

## Output Convention

```
research/YYYY-MM-DD-slug/
├── DOSSIER-Title-Words-YYYY-MM-DD.md           # Main report
├── DOSSIER-Title-Words-BALLOT-Max.md           # Optional: one per decider
├── DOSSIER-Title-Words-BALLOT-Patrick.md       # Optional: one per decider (multi-reviewer case)
├── DOSSIER-Followup-Title-YYYY-MM-DD.md        # Follow-up dossiers in same folder
└── (attachments — rare)
```

Location: workspace `research/` for standalone; `projects/{name}/research/` for project-specific.

Multiple dossiers per folder is expected.

## Gates (hooks)

One mechanical gate runs PostToolUse on `Write|Edit` through `.claude-plugin/hooks/dossier-hook-dispatcher.sh`. Exit 2 pipes stderr back to Claude. **Alerting-level** — the file is already on disk when it fires; a motivated agent can ignore. PreToolUse rigor is future work.

| Gate | Fails on |
|------|----------|
| `ballot-filename.sh` | Ballot file not matching `DOSSIER-<slug>-BALLOT-<Reviewer>.md` (owned by the `ballot` skill) |

Everything else is reviewed by checklist, not by grep. Earlier iterations shipped grep-gates for citation integrity, forbidden words, section ordering, dated claims, and ballot cover-block archaeology — a 2026-04-18 polish pass removed them after they proved overfit to the a11y-extension session. `dossier-framing-declared.sh` was removed in the 2026-04-18 preflight-gate pass: the framing-mode convention it enforced doesn't generalize across dossier styles. See `${CLAUDE_SKILL_DIR}/references/review-checklist.md`.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Orphan citations | Reviewed in the checklist (citation-integrity item) — every inline reference should match a §Sources entry |
| Glossary at the back of the dossier | Glossary first (read-support); Sources last (trust-support) |
| Dates treated as static | Reviewed in the checklist (dated-claim-freshness item) — re-verify each |
| Exhaustive list, not selective | Set selectivity in SCOPE ("5-8, not all"); reviewed in the checklist |
| Generic recommendations | Tailor to THIS user's context and infrastructure |
| Bare product names without URLs | Hyperlink every entity on first mention |
| Same source categories every time | Adapt to domain (see `references/sources-by-domain.md`) |
| Ending or re-starting session after delivery | Stay open — auto-compact handles context |

For ballot-specific mistakes (anti-options, pre-ticked checkboxes, cover-block archaeology, single-file two-column ballots, reconciliation placement), see `skills/ballot/SKILL.md` §Common Mistakes.

## Related Skills

| Skill | Integration |
|-------|-------------|
| `ballot` | Extracted decision-ballot format. SYNTHESIZE hands off when a decision surface is needed. |
| `last30days` | Social signal for consumer/OSS topics |
| `commit-notation` | `D:` prefix for dossier commits |
| `bye` | Sessionlog at session end (NOT after each dossier) |
| `challenge-the-plan` | Optional: interview-style requirements refinement |
