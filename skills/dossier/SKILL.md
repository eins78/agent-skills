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

## Workflow: FRAME → GATHER → EVALUATE → SYNTHESIZE → DELIVER

### 0. FRAME (before any research)

Declare three things in writing before the first WebSearch. Without these, framing drifts and entire rounds get wasted.

- **Decision model.** Three axes, each explicit:
  - *Who decides* — single decider / panel of N / consensus-of-N / recommending-decider-plus-approver
  - *By when* — calendar date, sprint end, or "no deadline"
  - *How* — majority / unanimous / single-choice / must-agree-on-must-tier
- **Framing mode.** One of `oss` / `commercial` / `hiring` / `vendor` / `personal`. Declared in YAML frontmatter as `framing-mode: <value>`. Consult `${CLAUDE_SKILL_DIR}/references/framing-modes.md` for when each applies; canonical forbidden-word lists live in `${CLAUDE_SKILL_DIR}/references/framing-modes.yaml`. A missing declaration fails the `dossier-framing-declared` gate.
- **Audience.** Who reads the dossier (not who decides — different people often). Readers shape jargon, link density, and the Key Facts box. Expressed as a prose line inside the Key Facts box, not as a frontmatter field.

### 1. SCOPE

- **Type:** comparison, evaluation, or investigation?
- **Requirements:** R1-Rn with weights (Critical/High/Medium) — for comparisons
- **Selectivity:** 5-8 options, not a laundry list
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

**Dated-claim verification.** Every deadline, CFP date, release-window, or "closes X 2026" claim must be re-verified against a primary source accessed on the production date. The `dossier-dated-claim-scan` hook lists every dated claim at audit time for manual verification. Dates stale silently; they are the single most common source of drift in multi-session dossiers.

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
- **Cite factual claims** inline: `claim ([source](url))` — bar: "could someone verify this?". If using `[Xn]` footnote refs instead, every reference must have a matching definition in §Sources.
- **Source categories** adapt to domain (see template).
- **Template-order rule.** Glossary stays at the top; Sources stay at the end. The asymmetry is deliberate — glossary is read-support (before), sources are trust-support (after). Do not move glossary to the appendix by analogy with sources.

**Ballot** (when the decision has two or more reviewers): use the `ballot` skill. Template at `skills/ballot/templates/ballot-per-reviewer.md`; conventions at `skills/ballot/SKILL.md`.

### 5. DELIVER

Audits run automatically on Write/Edit via the PostToolUse hook wiring — exit 2 feeds stderr back to Claude, which should fix and re-write. See §Gates below. Once audits pass:

- Commit dossier folder (`D:` intention per commit-notation).
- **Do NOT end the session** — stay available for follow-ups, iterations, or additional dossiers.

## Output Convention

```
research/YYYY-MM-DD-slug/
├── DOSSIER-Title-Words-YYYY-MM-DD.md           # Main report
├── DOSSIER-Title-Words-BALLOT-Max.md           # Optional: one per reviewer
├── DOSSIER-Title-Words-BALLOT-Patrick.md       # Optional: one per reviewer
├── DOSSIER-Followup-Title-YYYY-MM-DD.md        # Follow-up dossiers in same folder
└── (attachments — rare)
```

Location: workspace `research/` for standalone; `projects/{name}/research/` for project-specific.

Multiple dossiers per folder is expected.

## Gates (hooks)

PostToolUse on `Write|Edit` routes through `.claude-plugin/hooks/dossier-hook-dispatcher.sh`. Exit 2 pipes stderr back to Claude. These are **alerting-level** hooks — the file is already on disk when they fire; a motivated agent can ignore. PreToolUse rigor is future work.

| Gate | Fails on |
|------|----------|
| `dossier-framing-declared.sh` | Non-ballot DOSSIER-*.md with no `framing-mode:` declaration |
| `dossier-citation-audit.sh` | Orphan `[Xn]` ref with no §Sources definition; emits warning when zero `[Xn]` refs found (audit is a no-op on hyperlink-only dossiers) |
| `dossier-forbidden-words.sh` | Forbidden word for declared framing mode (wordlists in `references/framing-modes.yaml`) |
| `dossier-section-order.sh` | Glossary after Executive Summary, or Sources not last |
| `dossier-dated-claim-scan.sh` | (Never fails — lists dates at audit time for manual verification) |

Ballot-specific gates (fire on `DOSSIER-*BALLOT*.md`) are owned by the `ballot` skill. Full rationale and invocation details: `${CLAUDE_SKILL_DIR}/references/audit-checks.md`.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping FRAME, letting evidence set the framing | Declare mode/decider/audience before the first WebSearch |
| Missing `framing-mode:` frontmatter | `dossier-framing-declared.sh` fails; add the frontmatter |
| Commercial vocabulary in an OSS dossier | `framing-mode: oss` plus fixing each gate hit |
| Orphan `[Xn]` citations | Citation audit fails until each `[Xn]` has a §Sources definition |
| Zero `[Xn]` refs without intent | Citation audit emits warning — verify the dossier uses inline `[text](url)` deliberately |
| Glossary at the back of the dossier | Glossary first (read-support); Sources last (trust-support) |
| Dates treated as static | Dated-claim scan after GATHER; re-verify each |
| Exhaustive list, not selective | Set selectivity in SCOPE ("5-8, not all") |
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
