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
  version: "1.0.1"
---

# Dossier

Structured research producing actionable reports with ranked recommendations, cited sources, and optional decision ballots. Works for any domain — tech, travel, health, policy, finance, art.

## Workflow: FRAME → GATHER → EVALUATE → SYNTHESIZE → DELIVER

### 0. FRAME (before any research)

Declare three things in writing before the first WebSearch. Without these, framing drifts and entire rounds get wasted.

- **Decision model.** Who decides, by when, and how. Examples: "single decider, by Friday, single-choice." "Two-reviewer vote, no hard deadline, must-agree on must-tier." "Consensus-of-three."
- **Framing mode.** One of `oss` / `commercial` / `hiring` / `vendor` / `personal`. Consult `${CLAUDE_SKILL_DIR}/references/framing-modes.md` for when each applies and what vocabulary each forbids. If two modes seem to apply, declare the dominant one.
- **Audience.** Who reads the dossier (not who decides — different people often). Readers shape jargon, link density, and the Key Facts box.

Emit these as the first three lines of the dossier proper, plus a frontmatter `framing-mode:` field that the forbidden-word gate reads (see `${CLAUDE_SKILL_DIR}/references/audit-checks.md`).

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

**Dated-claim verification.** Every deadline, CFP date, release-window, or "closes X 2026" claim must be re-verified against a primary source accessed on the production date. Run `bash ${CLAUDE_SKILL_DIR}/../../.claude-plugin/hooks/dossier-dated-claim-scan.sh <dossier.md>` after gathering — it lists every dated claim for re-verification. Dates stale silently; they are the single most common source of drift in multi-session dossiers.

### 3. EVALUATE

- Score options against requirements
- Build attribute tables appropriate to the domain
- Cross-reference across agents — multi-source citations get highest weight
- Flag contradictions

### 4. SYNTHESIZE

Write dossier using `${CLAUDE_SKILL_DIR}/templates/dossier.md`:

- **Key Facts box** (required, one screen): who decides, decision model, deadline, hard constraints, 3–5 load-bearing claims. Readers with five minutes read only this section — make every line count.
- **Glossary / Key Concepts** (3–8 terms): after Key Facts, **before** any summary or content section. Glossary is *read-support* — a reader needs definitions before encountering terms in content.
- **Hyperlink every entity** on first mention
- **Cite factual claims** inline: `claim ([source](url))` — bar: "could someone verify this?". If using `[Xn]` footnote refs instead, every reference must have a matching definition in §Sources.
- **Source categories** adapt to domain (see template)
- **Template-order rule.** Glossary stays at the top; Sources stay at the end. The asymmetry is deliberate — glossary is read-support (before), sources are trust-support (after). Do not move glossary to the appendix by analogy with sources.

**Citation-integrity audit.** Before calling SYNTHESIZE complete, run `bash ${CLAUDE_SKILL_DIR}/../../.claude-plugin/hooks/dossier-citation-audit.sh <dossier.md>`. It fails on any `[Xn]` ref in the body without a matching definition in `## Sources`. Fix the orphan — add the definition or remove the ref.

**Ballot** (when a decision is needed): one file per reviewer, filename `DOSSIER-<slug>-BALLOT-<Reviewer>.md`. Use `${CLAUDE_SKILL_DIR}/templates/ballot-per-reviewer.md`. Rules:

- **No anti-options.** If an option is labelled "not recommended" or "for completeness", either justify it in a comment or delete it. Every anti-option costs reviewer ticking-time without changing outcomes.
- **One DEC = one decision surface = one time-horizon.** Do not mix "launch-day channels" with "next year's conference commitments" in one multi-select.
- **Recommended-but-not-pre-ticked.** Prose can name a recommendation per DEC; checkboxes stay empty. A pre-ticked box is pressure, not a recommendation.
- **Clean cover block.** Reviewer designation, role, peer-ballot cross-reference, dossier link. No "updated 2026-…" paragraph — archaeology belongs in the commit log, not the ballot.
- **Reconciliation in the sessionlog**, not in a third file. Ballots are the durable artefact; reconciliation is a session output and lives where the discussion happens.

### 5. DELIVER

Run the forbidden-word sweep for the declared framing mode:

```
bash ${CLAUDE_SKILL_DIR}/../../.claude-plugin/hooks/dossier-forbidden-words.sh <dossier.md>
```

Fix each hit, or tag the line `<!-- allow-forbidden -->` if it is an intentional meta-denial (e.g. "this is *not* lead-gen"). Then:

- Commit dossier folder (`D:` intention per commit-notation)
- **Do NOT end the session** — stay available for follow-ups, iterations, or additional dossiers

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

Scripts in `${CLAUDE_SKILL_DIR}/../../.claude-plugin/hooks/`:

| Gate | When | Fails on |
|------|------|----------|
| `dossier-citation-audit.sh` | Before DELIVER | Orphan `[Xn]` ref with no §Sources definition |
| `dossier-forbidden-words.sh` | Before DELIVER | Forbidden word for declared framing mode (see `references/framing-modes.md`) |
| `dossier-section-order.sh` | Before DELIVER | Glossary after Executive Summary, or Sources not last |
| `dossier-ballot-filename.sh` | Before DELIVER | Ballot file not named `DOSSIER-*-BALLOT-<reviewer>.md` |
| `dossier-dated-claim-scan.sh` | After GATHER | (Never fails — lists dates for manual verification) |

Full invocation and rationale: `${CLAUDE_SKILL_DIR}/references/audit-checks.md`.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping FRAME, letting evidence set the framing | Declare mode/decider/audience before the first WebSearch |
| Commercial vocabulary in an OSS dossier | Declare `framing-mode: oss`; gate fails on `revenue`/`monetiz`/`Stripe`/etc. |
| Orphan `[Xn]` citations | Run citation-audit gate before DELIVER |
| Glossary at the back of the dossier | Glossary first (read-support); Sources last (trust-support) |
| Dates treated as static | Dated-claim scan after GATHER; re-verify each |
| Anti-options in ballots ("not recommended", "for completeness") | Cut them or add a justification; they cost reviewer time |
| One DEC mixing launch-day + next-year items | Split into two DECs with distinct time-horizons |
| Pre-ticked recommendation checkboxes | Recommend in prose, leave boxes empty; reviewer makes the mark |
| Ballot cover with "updated 2026-…" paragraph | Commit log and sessionlog hold archaeology; ballot cover is clean |
| Reconciliation as a separate file | Reconciliation lives in the sessionlog where the discussion is |
| Single-file two-column ballot | One file per reviewer (`DOSSIER-*-BALLOT-<Reviewer>.md`) |
| Exhaustive list, not selective | Set selectivity in SCOPE ("5-8, not all") |
| Generic recommendations | Tailor to THIS user's context and infrastructure |
| Bare product names without URLs | Hyperlink every entity on first mention |
| Generic `ballot.md` filename | Use `DOSSIER-*-BALLOT-<Reviewer>.md` to sort with the dossier |
| Same source categories every time | Adapt to domain (see `references/sources-by-domain.md`) |
| Ending or re-starting session after delivery | Stay open — auto-compact handles context |

## Related Skills

| Skill | Integration |
|-------|-------------|
| `last30days` | Social signal for consumer/OSS topics |
| `commit-notation` | `D:` prefix for dossier commits |
| `bye` | Sessionlog at session end (NOT after each dossier) |
| `challenge-the-plan` | Optional: interview-style requirements refinement |

Decision ballots share a format with, but are not yet extracted into, a standalone `ballot` skill. The `templates/ballot-per-reviewer.md` and the anti-option / time-horizon / reconciliation conventions live here for now; if a future `ballot` skill lands, this section becomes a cross-reference.
