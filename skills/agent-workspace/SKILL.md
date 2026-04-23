---
name: agent-workspace
description: >-
  Use when entering, bootstrapping, or working inside a shared repo organized
  as an "agent-workspace" — a workspace designed for humans and AI agents to
  collaborate, with conventions for story tracking, session logs, skills, and
  CLAUDE.md routing. Triggers: agent workspace, bootstrap workspace, set up
  CLAUDE.md, workspace audit, "where does this go in the workspace".
compatibility: claude-code, cursor
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: 0.1.0-alpha.1
---

# Agent Workspace

An **agent-workspace** is a git repo structured so humans and AI agents can work in it together without friction. It's a pattern, not a product — a handful of directory conventions and files that let an agent land cold, orient itself, and contribute without breaking the grain of ongoing work.

Workspaces vary widely in what they hold — some aggregate code across repos, some carry shared knowledge (rules, templates, playbooks), most carry both. The same skeleton applies regardless.

Full concept & rationale: `${CLAUDE_SKILL_DIR}/references/concept.md`.
Bootstrapping a new workspace: `${CLAUDE_SKILL_DIR}/references/bootstrapping.md`.

## When to invoke this skill

- You landed in a repo with `docs/stories/`, `docs/sessionlogs/`, or `.claude/skills/` — orient before acting.
- The user says "bootstrap a workspace," "set up CLAUDE.md for this," "audit this workspace," or "where should this file go."
- Converting an existing ad-hoc shared repo into the pattern.

## Workflow: ORIENT → LOCATE → CONTRIBUTE

### 1. ORIENT

Before doing anything, read in this order:

1. `CLAUDE.md` at the repo root — your routing guide. If missing, this is not (yet) an agent-workspace; flag it.
2. `README.md` — human overview; may carry context CLAUDE.md assumes.
3. `docs/stories/` index (usually `README.md` or an "Active Stories" section) — what work is live.
4. `docs/sessionlogs/` — last 2-3 entries; see what happened recently and what's unresolved.
5. `.claude/skills/` and `.claude/agents/` — workspace-local conventions that override generic behavior.

If the user named a story or slug, jump to `docs/stories/{slug}/STORY-*.md` and follow story-tracking conventions.

### 2. LOCATE

Before creating any file, check the canonical homes (see `references/structure.md`):

| Kind of content | Home |
|---|---|
| Multi-session work tracking | `docs/stories/{slug}/STORY-{slug}.md` |
| Per-session notes | `docs/sessionlogs/YYYY-MM-DD-topic-slug.md` |
| Project rules for agents | `docs/rules/` (imported from `CLAUDE.md`) |
| Reusable templates | `docs/templates/` |
| Workspace-local skills | `.claude/skills/{name}/` (incubate here before promoting) |
| Workspace-local agents | `.claude/agents/{name}.md` |
| Customer/project specifics | Moved to the corresponding customer workspace — **not here** |

**Access boundary rule (critical):** customer-specific content belongs in the customer workspace, never in a workspace shared by a team/role. A shared workspace must be safe to share with every member of that group; a customer workspace is shared with that customer. Mixing them is a leak.

### 3. CONTRIBUTE

Follow the conventions the workspace already demonstrates:

- **Language:** structural elements (filenames, frontmatter keys, headings in templates) in English; content in whatever language the team writes.
- **Story updates:** append session summaries, update status markers, never silently rewrite history.
- **Commits:** small, focused, conventional-ish prefixes (`docs:`, `D:`, `feature:` — match the repo).
- **Skill incubation:** new skills live in the workspace until battle-tested AND generally useful. Only then promote to a shared skills repo.
- **Dual-tool compatibility:** anything in `.claude/` must also work when loaded by Cursor. Prefer plain Markdown + frontmatter over Claude-Code-specific tool syntax in skill bodies.

## Bootstrapping a new workspace

Run the interview protocol in `references/bootstrapping.md`. It produces:

- `CLAUDE.md` — AI routing guide (architecture, glossary, "when X → go to Y")
- `README.md` — human scannable overview
- `docs/{stories,sessionlogs,rules,templates}/` — standard directories seeded
- `.claude/{skills,agents}/` — empty scaffolds with `.gitkeep`

Templates live in `${CLAUDE_SKILL_DIR}/templates/`.

## Red flags

Stop and surface these to the user rather than patching over:

- No `CLAUDE.md` at root → don't silently create one; ask whether this workspace should adopt the pattern.
- Customer-specific content in a workspace shared by a group → flag as access-boundary violation.
- Skills scattered outside `.claude/skills/` → flag; don't "helpfully" reorganize without approval.
- Conflict between workspace `CLAUDE.md` and this skill → **workspace wins**. This skill describes the pattern; individual workspaces refine it.
