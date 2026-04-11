# Definition of Done — Skill PRs

Checklist that must pass before any skill PR is merged.

## Automated

- [ ] **`pnpm test` passes** — all skills parse without errors (`skills add . --list`)

## Code Quality

- [ ] **`/simplify` run** on all changed skill files — reviewed for clarity and token efficiency
- [ ] **`/ai-review` passes** — result is APPROVE or INFO-only (no CHANGE or BLOCK items)

## Skill File Completeness

- [ ] **`SKILL.md` frontmatter is valid:**
  - `name` matches directory name (lowercase, hyphens only)
  - `description` present (≤ 1024 chars)
  - `version` present (semver, e.g. `"1.0.0"`)
  - `license` present (e.g. `MIT`)
  - `metadata.author` and `metadata.repo` present
- [ ] **`README.md` present and current** — purpose, tier, provenance, testing notes, known gaps
- [ ] **`README.md` skills table updated** — new skill added to root `README.md`

## Content Standards

- [ ] **Description follows CSO principles** — triggering conditions only, no workflow summary (see [writing-skills](https://github.com/anthropics/superpowers))
- [ ] **No hardcoded user-specific values** — no personal names, account paths, or workspace-specific file paths in `SKILL.md` or templates
- [ ] **`${CLAUDE_SKILL_DIR}` used** for all bundled file references (never `./scripts/` or `../`)

## Versioning

- [ ] **Skill version incremented** in `SKILL.md` frontmatter (semver):
  - Patch (`x.y.Z`): wording, bug fixes
  - Minor (`x.Y.0`): new sections, new patterns
  - Major (`X.0.0`): structural changes, removed sections
- [ ] **Changeset added** — `pnpm changeset` run and changeset file describes the change with correct bump type
- [ ] **`bumps:` block in changeset** — every changeset that touches a skill includes a `<!-- bumps: skills: ... -->` block
- [ ] **Plugin version synced** — verified via `pnpm run version` (do NOT edit version fields manually)
