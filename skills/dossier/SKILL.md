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
  version: "1.0.0-beta.1"
---

# Dossier

Structured research producing actionable reports with ranked recommendations, cited sources, and optional decision ballots. Works for any domain — tech, travel, health, policy, finance, art.

## Workflow: SCOPE → GATHER → EVALUATE → SYNTHESIZE → DELIVER

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

### 3. EVALUATE

- Score options against requirements
- Build attribute tables appropriate to the domain
- Cross-reference across agents — multi-source citations get highest weight
- Flag contradictions

### 4. SYNTHESIZE

Write dossier using `${CLAUDE_SKILL_DIR}/templates/dossier.md`:

- **Key Concepts glossary** (3-8 terms): after header, before summary. Links: Wikipedia > docs > tutorial > blog
- **Hyperlink every entity** on first mention
- **Cite factual claims** inline: `claim ([source](url))` — bar: "could someone verify this?"
- **Source categories** adapt to domain (see template)
- **Ballot** (`DOSSIER-Title-BALLOT.md`): alongside dossier when a decision is needed — checkboxes for iPad/phone editing. Name matches the dossier for sorting.

### 5. DELIVER

- Commit dossier folder (`D:` intention per commit-notation)
- Telegram: summary + file attachment (+ ballot if created)
- **Do NOT end the session** — stay available for follow-ups, iterations, or additional dossiers

## Output Convention

```
research/YYYY-MM-DD-slug/
├── DOSSIER-Title-Words-YYYY-MM-DD.md           # Main report
├── DOSSIER-Title-Words-BALLOT.md                # Optional: decision checkboxes
├── DOSSIER-Followup-Title-YYYY-MM-DD.md         # Follow-up dossiers in same folder
└── (attachments — rare)
```

Location: workspace `research/` for standalone; `projects/{name}/research/` for project-specific.

Multiple dossiers per folder is expected.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Exhaustive list, not selective | Set selectivity in SCOPE ("5-8, not all") |
| Generic recommendations | Tailor to THIS user's context and infrastructure |
| Bare product names without URLs | Hyperlink every entity on first mention |
| Facts without sources | Cite key claims inline — "could someone verify?" |
| Ending or re-starting session after delivery | Stay open — auto-compact handles context |
| Creating new folder for follow-up research | Check existing `research/` dirs — same topic = same folder |
| Generic `ballot.md` filename | Use `DOSSIER-Title-BALLOT.md` to sort with the dossier |
| Same source categories every time | Adapt to domain (see sources-by-domain.md) |

## Related Skills

| Skill | Integration |
|-------|-------------|
| `last30days` | Social signal for consumer/OSS topics |
| `commit-notation` | `D:` prefix for dossier commits |
| `bye` | Sessionlog at session end (NOT after each dossier) |
| `challenge-the-plan` | Optional: interview-style requirements refinement |
