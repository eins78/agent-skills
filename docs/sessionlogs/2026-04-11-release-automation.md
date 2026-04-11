# Release Automation

**Date:** 2026-04-11
**Source:** Claude Code
**Session:** No compactions · ~79k input / ~44k output tokens

## Summary

Designed and implemented a monorepo-style release automation system for the agent-skills plugin repo. Each skill is independently versioned via changeset `<!-- bumps: -->` blocks, with automated GitHub Actions for CI validation, version bumping, and GitHub Release creation.

## Key Accomplishments

- Built full release pipeline: `bump-skill-versions.sh` → `changeset version` → `sync-versions.sh` → `generate-skill-manifests.sh`
- Created GitHub Actions: `ci.yml` (PR validation) and `release.yml` (automated releases via `changesets/action`)
- Shipped first automated release: **v2.2.0** with 12 git tags (1 overall + 11 per-skill)
- Merged PR #28 (dossier Telegram removal) as a real-world test of the pipeline
- Rebased PR #30 (delphitools) onto release automation with proper changeset

## Decisions

- **Changeset format**: Skill bumps use `<!-- bumps: skills: ... -->` HTML comment blocks in the changeset body (not YAML frontmatter, which `@changesets/cli` validates against workspace packages). Hidden from rendered CHANGELOG. Extensible to `agents:` later. Initially used a `Skills:` text footer; changed after PR review feedback requesting structured data.
- **No pnpm workspace**: Skills are markdown, not JS packages. Adding fake `package.json` files to each skill directory was rejected. Instead, the `skills` CLI provides `ls --json` for canonical skill enumeration.
- **Script execution order is critical**: `bump-skill-versions.sh` MUST run before `changeset version` because the latter deletes changeset files. Encoded in `package.json` version script.
- **Pre-release graduation**: Any bump strips pre-release suffixes (`1.0.0-beta.1` + minor = `1.1.0`), graduating skills to stable.
- **Per-skill marketplace entries**: `marketplace.json` is rebuilt with individual entries per skill, enabling granular installation. Entry [0] is always the full collection (sync-versions.sh compatibility).
- **Self-attribution stripping**: `@changesets/changelog-github` hardcodes "Thanks @owner!" — post-processed via sed in `sync-versions.sh`, reading owner from `.changeset/config.json`.

## Bugs Found During Code Review

1. **Critical**: `getline < FILENAME` in awk re-reads from file start (should be bare `getline line`)
2. **High**: Shell operator precedence — `[ -z "$a" ] || [ -z "$b" ] && { ... }` silently drops errors
3. **High**: Version dots treated as regex wildcards in `gsub()` — switched to `index()` for fixed-string match
4. **High**: Redundant `marketplace.json` write in `sync-versions.sh` immediately overwritten by `generate-skill-manifests.sh`

## Changes Made

- Created: `.dev/scripts/lib.sh`, `bump-skill-versions.sh`, `generate-skill-manifests.sh`, `validate-skills.sh`, `create-release.sh`
- Created: `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Modified: `.dev/scripts/sync-versions.sh`, `package.json`, `.changeset/_template`
- Modified: `CLAUDE.md`, `README.md`, `docs/definition-of-done.md`
- Fixed: `skills/apple-notes/SKILL.md` (missing metadata)
- Released: v2.2.0 (lab-notes minor, pandoc minor, dossier patch)

## Next Steps

- [ ] PR #30 (delphitools) — ready for review, kept as draft
- [ ] Consider adding `agents:` support to bumps block when agents are introduced
- [ ] Upgrade GitHub Actions to Node.js 24 before June 2026 deprecation deadline

## Repository State

- Branch: `main` at `9cacb69`
- Release: v2.2.0 — https://github.com/eins78/agent-skills/releases/tag/v2.2.0
- Open PRs: #30 (delphitools, draft), no pending changesets on main
