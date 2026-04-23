# CLAUDE.md

> Scaffold. Replace all `{{…}}` placeholders. Delete sections that don't apply.

## Workspace Purpose

{{One paragraph: what this workspace is, who uses it, why it exists as a separate repo. Name the access boundary if relevant.}}

## What This Workspace Is For

- {{Primary use case 1}}
- {{Primary use case 2}}
- {{Primary use case 3}}

## What This Workspace Is NOT For

- **Code** — lives in {{pointer}}
- **Customer-specific content** — lives in {{customer-workspace pointer}}
- **Secrets** — {{secret manager}}

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

- Stories live in `docs/stories/{slug}/STORY-{slug}.md` — see `docs/templates/STORY-template.md`.
- Session logs live in `docs/sessionlogs/YYYY-MM-DD-topic-slug.md` — one file per topic, not per session.
- Commit with `docs:`, `feature:`, `fix:` prefixes.
- {{Workspace-specific rule}}.

{{For longer rule sets, split into files and import:}}

@./docs/rules/{{topic}}.md

## Conventions

- **Language:** English for structural elements (filenames, frontmatter, directory names). Content in {{team language}}.
- **Tooling:** Claude Code + Cursor both supported. Skills in `.claude/skills/` must work in both.
- **Branch prefixes:** {{idea/, feature/, bug/, docs/, infra/}}
- **Skill incubation:** skills stay in `.claude/skills/` until battle-tested and generally useful.

## Active Stories

See `docs/stories/README.md` for the live index.

## Related Workspaces

- `{{other-workspace}}` at `{{pointer}}` — {{relationship}}
- `{{another-workspace}}` at `{{pointer}}` — {{relationship}}
