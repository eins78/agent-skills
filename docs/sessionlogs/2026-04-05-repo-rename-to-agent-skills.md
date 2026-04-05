# Repo Rename: eins78/skills → eins78/agent-skills

**Date:** 2026-04-05
**Source:** Claude Code
**Session:** Reconstructed from 1 compaction · ~21k input / ~44k output tokens

## Summary

Renamed the GitHub repository from `eins78/skills` to `eins78/agent-skills` and updated all references in both the skills repo (now `agent-skills`) and `home-workspace`. Local directory renamed from `~/CODE/skills` to `~/CODE/agent-skills`.

## Key Accomplishments

- GitHub repo renamed via `gh repo rename agent-skills`
- Git remote URL updated to `https://github.com/eins78/agent-skills.git`
- All in-repo references updated: `package.json`, `README.md`, plugin metadata files (`.claude-plugin/`, `.cursor-plugin/`), 9 `SKILL.md`/`README.md` files in `skills/`
- `home-workspace` updated: `CLAUDE.md` (root + 2 worktrees), delegate skill README, ralph-sprint-loop experiment docs, and 25+ sessionlogs across all 3 branches (main, worktree-bot, worktree-30d)
- `~/CODE/skills` → `~/CODE/agent-skills` directory rename
- Backward-compat symlink created by user (not in this session)
- `.git/config` `hooksPath` fixed (stale absolute path after `mv`)

## Decisions

- **Plugin name `eins78-skills` kept unchanged**: The marketplace ID (`eins78-skills@eins78-marketplace`) is decoupled from the repo name. Renaming it would silently break all existing installations. Only the `homepage`/`repository` URL fields in `plugin.json` were updated.

- **Sessionlog PR links not updated**: Historical PR links (`eins78/skills/pull/N`) left as-is — GitHub's permanent redirect handles them. Updating would be revisionist.

- **Version on main stays at 2.0.0**: The rename commit was accidentally made on the `add-dossier-skill` branch first (which has v2.1.0 from the dossier skill). Cherry-picked to `main` resolving the version conflict by keeping 2.0.0 — the dossier version bump belongs on that branch until its PR merges.

- **Three worktree commits needed**: `home-workspace` has `worktree-bot` and `worktree-30d` as separate git worktrees. Each required its own commit; changes to those directories don't appear in the main `git status`.

## Changes Made

### In `eins78/agent-skills` (committed `5e419da` to `main`):
- Modified: `package.json` — name `@eins78/agent-skills`, updated URLs
- Modified: `README.md` — heading, marketplace cmd, CLI cmd, manual paths
- Modified: `.claude-plugin/plugin.json` — homepage + repository URLs
- Modified: `.cursor-plugin/plugin.json` — homepage + repository URLs
- Modified: `skills/ai-review/SKILL.md`, `skills/apple-mail/SKILL.md`, `skills/bye/SKILL.md`, `skills/chrome-browser/SKILL.md`, `skills/dossier/SKILL.md` + `README.md`, `skills/tmux-control/SKILL.md`, `skills/tracer-bullets/SKILL.md`, `skills/typescript-strict-patterns/SKILL.md`
- Fixed: `.git/config` `hooksPath` (after directory rename)

### In `eins78/home-workspace` (3 branches committed + pushed):
- `main` (`e2ac080`): CLAUDE.md, delegate skill README, ralph-sprint-loop docs (5 files), plan file, 25 sessionlogs
- `worktree-bot` (`040b9e4`): same scope for bot worktree
- `worktree-30d` (`0cf31b1`): same scope for 30d worktree (new branch pushed to remote)

## Complications

- **Bash CWD failure after rename**: After `mv ~/CODE/skills ~/CODE/agent-skills`, all subsequent `Bash` tool calls failed ("path does not exist"). Verification was done via `Read` tool on `.git/config` directly. Future sessions won't be affected.
- **Cherry-pick conflict**: The rename commit landed on `add-dossier-skill` instead of `main` (the other session had checked out that branch). Cherry-picking to `main` produced 2 conflicts: `package.json` version (resolved to 2.0.0) and dossier files (git rm'd, since dossier doesn't exist on `main` yet).

## Next Steps

- [ ] After dossier PR merges, verify `add-dossier-skill` history merges cleanly (it has the rename commit + the dossier commit)
- [ ] Open new terminal session from `~/CODE/agent-skills` (current session's CWD is the renamed/gone path)
- [ ] Update any personal notes or external docs that reference `eins78/skills`

## Repository State

- Branch: `main` (agent-skills repo)
- Committed: `5e419da` — chore: rename repo from eins78/skills to eins78/agent-skills
- Remote: `https://github.com/eins78/agent-skills.git`
- Old URL `https://github.com/eins78/skills` → permanent GitHub redirect active
