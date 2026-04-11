# Skills Repository

Agent Skills collection for Claude Code, following the [agentskills.io](https://agentskills.io/) spec.

Uses the [`skills`](https://www.npmjs.com/package/skills) CLI for validation.

## Skill Format

Each skill lives in its own directory under `skills/` and consists of:

```
skills/<skill-name>/
├── SKILL.md      # The skill itself (frontmatter + instructions)
└── README.md     # Development documentation (REQUIRED)
```

### SKILL.md

YAML frontmatter followed by markdown instructions:

```yaml
---
name: skill-name
description: When to activate and what the skill covers.
globs: ["**/*.ts", "**/*.tsx"]
license: MIT
---
```

The markdown body contains patterns, rules, and examples that Claude follows when the skill is active.

### README.md (required)

Every skill directory must contain a README.md with development documentation:

- Purpose and scope of the skill
- Skill tier (publishable/reusable vs project-specific)
- How the skill was tested and validated
- Provenance (where patterns originated)
- Known gaps and planned improvements

## Validation

```bash
pnpm test        # runs: skills add . --list
```

This lists all discovered skills and exits non-zero if any skill fails to parse.

## Digraph Rendering

If SKILL.md contains ` ```dot ` blocks:
1. Create `diagrams/` directory in skill folder
2. Run `.dev/scripts/render-digraphs.sh SKILL.md ./diagrams`
3. Commit both .dot and .png files
4. Reference images in SKILL.md where helpful

Requires: `brew install graphviz`

## Key Principles

1. **Be concise** — Only add what Claude doesn't already know
2. **Progressive disclosure** — Overview in SKILL.md, details in referenced files
3. **Third person** — "Processes files" not "I help you process files"
4. **One level deep** — Reference files directly from SKILL.md, avoid nesting
5. **Use `${CLAUDE_SKILL_DIR}` for bundled files** — Never use relative paths (`./scripts/`, `./file.md`) in SKILL.md. Use `${CLAUDE_SKILL_DIR}/scripts/foo.sh` so agents can find scripts regardless of their working directory.
6. **Use checklists** — Multi-step workflows benefit from copy-paste checklists
7. **Test across models** — Haiku may need more guidance than Opus

## Skill Composition

Skills can reference other skills by name in their instructions. Claude loads both skills when context matches — no formal import system, just mention by name.

## Adding and Editing Skills

- **Always use `/writing-skills` when planning, creating, editing, or reviewing skills**
- Keep skills generic — no account-specific data, API keys, or personal identifiers
- Skills should be self-contained: a single SKILL.md should cover a coherent topic
- **Keep README.md in sync** — When adding, removing, or renaming skills, update the skills table in the root README.md
- Continuous improvement: after using a skill, note gaps and propose concrete improvements
- Installation: symlink from `~/.claude/skills/` to the skill directory

## Versioning

Every skill MUST have a `metadata.version` field in its SKILL.md frontmatter.

**When a skill is changed, increment its version** (semver):

- **Patch** (`x.y.Z`): bug fixes, wording improvements, minor clarifications
- **Minor** (`x.Y.0`): new sections, new patterns, expanded coverage
- **Major** (`X.0.0`): structural reorganization, removed sections, breaking workflow changes

**Pre-release graduation:** Any bump strips pre-release suffixes. `1.0.0-beta.1` + minor = `1.1.0`.

**When any skill version is bumped, add a changeset:**

```bash
pnpm changeset   # creates a timestamped file in .changeset/ — edit bump type and description
```

The changeset describes what changed and at what semver level:
- Skill patch → plugin `patch` changeset (at minimum)
- Skill minor → plugin `minor` changeset (at minimum)
- Skill major → plugin `major` changeset

### Changeset `Skills:` Footer (required)

Every changeset that modifies a skill MUST include a `Skills:` footer line. This is parsed by `bump-skill-versions.sh` to automatically update each skill's `metadata.version` in its SKILL.md frontmatter.

```markdown
---
"@eins78/agent-skills": minor
---

Add `lab-notes` skill — structured experiment management

Skills: lab-notes (minor)
```

Multiple skills in one changeset: `Skills: dossier (patch), bye (patch)`

If two changesets bump the same skill differently, the highest bump wins (major > minor > patch).

**Do NOT manually edit version numbers** in `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, or `.cursor-plugin/plugin.json`. These are managed by `pnpm run version` which syncs all files automatically. Skill versions in SKILL.md are bumped automatically from the `Skills:` footer — do not manually edit those either.

## Releasing

### Automated (GitHub Actions)

Releases are automated via the `changesets/action` GitHub Action:

1. Merge a PR with changesets to `main`
2. The Action creates a "Version Packages" PR with version bumps, CHANGELOG updates, and per-skill marketplace entries
3. Review and merge the version PR
4. The Action creates git tags (`v2.2.0` + `lab-notes@1.1.0`) and a GitHub Release

### Manual (fallback)

```bash
GITHUB_TOKEN=$(gh auth token) pnpm run version   # bumps skill versions, consumes changesets, syncs all metadata
pnpm run release   # runs version, commits, tags — then push with: git push --follow-tags
```

### Validation

```bash
pnpm run validate  # checks all SKILL.md frontmatter (name, version, license, README)
```

## Skill Name Stylization

When referencing skill names in prose (changelogs, PR descriptions, commit messages, documentation):
- Use backticks: `lab-notes`, `dossier`, `bye`
- Do NOT prefix with slash: `lab-notes` not `/lab-notes`
- The slash prefix is for invocation in chat (`/lab-notes`), not for naming in docs

## Commit Conventions

Follow the existing commit style: `<skill-name>: <description>` for skill changes, plain descriptions for repo-level changes.
