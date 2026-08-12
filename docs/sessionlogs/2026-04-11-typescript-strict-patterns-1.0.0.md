# typescript-strict-patterns stable 1.0.0 release

**Date:** 2026-04-11
**Source:** Claude Code

## Summary

Released `typescript-strict-patterns` from pre-release `1.0.0-beta.1` to stable `1.0.0` via PR #33, which was merged same session. Includes a minor-level changeset for the `@eins78/agent-skills` package.

## Key Accomplishments

- Diagnosed that `increment_semver` in `.dev/scripts/lib.sh` cannot graduate a pre-release to its exact base version (always increments a component)
- Set `metadata.version` directly to `1.0.0` in SKILL.md (bypassing the bump script)
- Created changeset with `@eins78/agent-skills: minor` and intentionally empty `skills:` block
- PR #33 created, CI passed (validate: SUCCESS), merged

## Changes Made

- Modified: `skills/typescript-strict-patterns/SKILL.md` — version `1.0.0-beta.1` → `1.0.0`
- Created: `.changeset/20260411-213819.md` — minor changeset with empty `skills:` block

## Decisions

- **Version set directly, not via bumps block:** Standard patch bump on `1.0.0-beta.1` produces `1.0.1`. To achieve exactly `1.0.0`, set the version manually and omit the skill from the `bumps:` block to prevent re-bumping during `pnpm run version`.
- **Package bump level `minor`:** Graduating a skill from beta to stable 1.0.0 is a meaningful public milestone, warranting minor over patch.
- **Empty `skills:` block passes CI:** The CI changeset check only validates that *referenced* skill directories exist — an empty section is valid.

## Next Steps

- [ ] Monitor that the changesets action creates the "Version Packages" PR (automated)
- [ ] Review and merge the version PR when it appears

## Repository State

- Committed: `5b01b37` - typescript-strict-patterns: promote to stable 1.0.0 (on branch `typescript-strict-patterns/stable-1.0.0`)
- PR #33: merged
