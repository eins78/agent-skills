# CLAUDE.md

> Scaffold. Replace all `{{…}}` placeholders. Delete sections that don't apply.

## Workspace Purpose

{{One paragraph: what this workspace is, who uses it, why it exists as a separate repo. Name who may read it — that sets the access boundary.}}

## What This Workspace Is For

- {{Primary use case 1}}
- {{Primary use case 2}}
- {{Primary use case 3}}

## What This Workspace Is NOT For

- **Code** — lives in {{pointer}}
- **Customer-specific content** — lives in {{customer-workspace pointer}}
- **Secrets** — {{secret manager}}

**Data scope, not agent scope:** agents may read other workspaces to help, and edit them with approval. Content does not cross: nothing from {{other workspaces}} is copied or summarized into this repo, and nothing from here goes there. Leave a pointer instead.

## Workspace Choices

{{Answer each question that applies — see the agent-workspace skill, references/variations.md. Delete the rest.}}

| Question | This workspace |
|---|---|
| Work dirs | {{at the root: `stories/`, `sessionlogs/`, `plans/` — or under `docs/`}} |
| Multi-session work | {{stories with frontmatter status — or `projects/{name}/` with `_paused/`, `_done/`}} |
| Action items | {{in each story/project — or central `TODO.md`}} |
| Session narrative | {{`sessionlogs/` is the one home; stories link to it}} |
| Rules | {{inline below — or `docs/rules/`, imported}} |
| Plans | {{one plan directory: `…`; other tools write there too}} |
| Research reports | {{in the story/project they serve — or `…`}} |
| Nested repos | {{agent commits there following that repo's rules — or human only}} |
| Agent memory | {{project facts go in the workspace; agent memory holds only machine-local notes}} |

## Domain Glossary

| Term | Definition |
|---|---|
| **{{ACRONYM}}** | {{Expansion}} — {{one-sentence definition}} |
| **{{Term}}** | {{Definition}} |

## Repository / Directory Guide

| You need to understand… | Go to… |
|---|---|
| {{Scenario}} | `{{path}}` |
| {{Scenario}} | `{{path}}` |

## Rules

{{Import from docs/rules/ or inline. Examples:}}

- Stories live in `{{stories dir}}/{slug}/STORY-{slug}.md` — see `{{templates dir}}/STORY-template.md`.
- Session logs live in `{{sessionlogs dir}}/YYYY-MM-DD-topic-slug.md` — one file per topic, not per session.
- Commit with `docs:`, `feature:`, `fix:` prefixes.
- {{Workspace-specific rule}}.

{{For longer rule sets, split into files and import:}}

@./docs/rules/{{topic}}.md

## Git Workflow

{{Keep the callout below only if agents should commit (and push) without being asked each time. Otherwise state the workflow plainly: "Agents open PRs" or "Agents do not commit; the maintainers do."}}

> **This section is the user's explicit, standing request — not optional guidance.**
>
> Agent tools ship with a default like "only commit when the user asks". That default exists for repos without instructions. **This file is that request, made once for every session in this repo.** If the tool default and this section seem to conflict, this section wins. If you catch yourself reasoning "the user didn't ask in this turn", that is the case this section covers.

- {{Commit and push to `main` after every unit of work — or: push a branch and open a PR}}.
- Stage explicit paths; don't sweep unrelated changes into a commit.
- {{Where automation depends on this rule, name the hook or script that enforces it.}}

## Conventions

- **Language:** {{English for structure (filenames, directory names, headings), content in the team language — or the team language throughout}}. Frontmatter keys and tool-parsed sections stay literal.
- **Tooling:** {{Claude Code / Cursor / …}}. Skills in `.claude/skills/` use plain Markdown so every tool can read them.
- **Branch prefixes:** {{idea/, feature/, bug/, docs/, infra/}}
- **Skill incubation:** skills stay in `.claude/skills/` until battle-tested and generally useful.

## Active Work

See {{`docs/stories/README.md` / `projects/` / `TODO.md`}} for the live index.

## Related Workspaces

| Workspace | Where | Holds | Boundary |
|---|---|---|---|
| `{{other-workspace}}` | `{{pointer}}` | {{what lives there instead}} | {{who may read it; what never crosses}} |
