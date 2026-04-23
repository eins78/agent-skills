# Canonical Structure

The agent-workspace skeleton. Not every workspace needs every directory — start with the minimum and grow.

## Tree

```
workspace-root/
├── CLAUDE.md                        # AI routing guide (required)
├── README.md                        # Human overview (required)
├── docs/
│   ├── stories/                     # Multi-session work items
│   │   ├── README.md                # Index of active stories
│   │   └── {slug}/
│   │       └── STORY-{slug}.md
│   ├── sessionlogs/                 # Dated per-topic session notes
│   │   └── YYYY-MM-DD-topic-slug.md
│   ├── rules/                       # Imported into CLAUDE.md
│   │   └── products/{name}.md
│   ├── templates/                   # Reusable artifact templates
│   │   └── STORY-template.md
│   ├── plans/                       # (optional, Plot convention) actionable plans
│   │   ├── active/
│   │   └── delivered/
│   └── changelogs/                  # (optional) YYYY-MM.md rollups
├── .claude/
│   ├── skills/                      # Workspace-local skills (incubating)
│   │   └── {skill-name}/SKILL.md
│   └── agents/                      # Workspace-local specialist agents
│       └── {agent-name}.md
├── apps/                            # optional: code submodules
├── infra/                           # optional: infra submodules
├── context/                         # optional: role / domain knowledge
└── scripts/                         # Workspace-level automation
```

## "Where does this go?" lookup

| Kind of content | Home |
|---|---|
| New multi-session work item | `docs/stories/{slug}/STORY-{slug}.md` |
| Story analysis (narrative) | `docs/stories/{slug}/analysis-{topic}.md` |
| Story implementation plan (actionable, Plot-style) | `docs/plans/active/{plan}.md`, cross-referenced from story |
| Per-session notes | `docs/sessionlogs/YYYY-MM-DD-topic-slug.md` |
| Meeting notes | `docs/sessionlogs/YYYY-MM-DD-meeting-topic.md` **or** `docs/stories/{slug}/meeting-{date}.md` |
| Agent behavior rule that applies repo-wide | `docs/rules/{topic}.md`, import from `CLAUDE.md` |
| Rule that applies only to one product/submodule | `docs/rules/products/{name}.md` |
| Reusable template for an artifact | `docs/templates/{artifact}-template.md` |
| Workspace-local skill (incubating) | `.claude/skills/{skill-name}/SKILL.md` |
| Workspace-local specialist agent | `.claude/agents/{agent-name}.md` |
| Customer-specific knowledge | **Not in this workspace.** Move to customer workspace. |
| Secrets, credentials | **Never.** Use a secret manager. |

## Frontmatter conventions

### Story frontmatter

```markdown
---
title: Human-readable title
status: active | paused | done | cancelled
created: YYYY-MM-DD
updated: YYYY-MM-DD
jira: OPTIONAL-TICKET-ID
---
```

### Sessionlog frontmatter

Usually none — the filename carries the date and topic. If you need one:

```markdown
---
date: YYYY-MM-DD
topic: short-slug
participants: [name1, name2]
---
```

### Skill frontmatter

Follows Agent Skills convention — see existing skills in this repo for examples. Key fields: `name`, `description` (triggers!), `compatibility`, `metadata.version`.

## Language conventions

- **Structural elements in English:** filenames, frontmatter keys, directory names, template section headings.
- **Content in the team's language:** German, French, whatever. Mixed is fine within a file.
- Reason: skills and agents are often shared across workspaces and orgs. English structure keeps them portable. Content stays natural.

## Naming conventions

- **Stories:** `{slug}/` or `{TICKET-ID}-{slug}/` — e.g. `wcag-audit/`, `PROJ-1234-wcag-audit/`.
- **Sessionlogs:** `YYYY-MM-DD-topic-slug.md` — one file per topic (not per session). Always today's date at creation.
- **Templates:** `{artifact}-template.md` — `STORY-template.md`, `sessionlog-template.md`.
- **Rules:** descriptive slug — `git-workflow.md`, `commit-messages.md`, `products/{name}.md`.

## Workspace-local vs shared skills

Skills incubate in `.claude/skills/` inside the workspace until:

1. They're battle-tested (used in real work for weeks, refined across multiple sessions).
2. They're generally useful outside this workspace.

Then promote to a shared skills repo (org-level or personal). Until then, local stays local. Don't publish half-baked skills.

## The "NOT in this workspace" list

Make these explicit in `CLAUDE.md`:

- What kind of code/content **does not** belong here.
- Which other workspace owns that content.
- A pointer to the owning workspace.

Example:

```markdown
## What This Workspace Is NOT For

- **Code** — lives in `~/CODE/{product}-workspace`
- **Customer-specific content** — lives in `{customer}-workspace`
- **Secrets** — use 1Password / vault
```

This is worth more than it looks. Explicit exclusions save agents (and humans) from guessing.
