# TTS Shootout — Ship `text-to-speech` + `private-podcast-feed` skills

**Date:** 2026-04-29
**Source:** Claude Code
**Session:** Reconstructed from 3 compaction(s) · ~510k input / ~300k output tokens

## Summary

Shipped two Agent Skills extracted from the `eins78/home-workspace` TTS shootout (Rounds 4–5): `text-to-speech` (Markdown→MP3 pipeline backed by Kokoro-82M) and `private-podcast-feed` (private RSS+MP3 feed for Overcast self-subscription). Branch `skills/tts-shootout-ship` was created, worked, and merged as PR #49.

## Key Accomplishments

- Created `skills/text-to-speech/` with SKILL.md, README.md, `synth-audio.sh` dispatcher, `backends/kokoro.sh`, 7 bundled Python lib scripts, L1 rewrite prompt, and 3 config templates
- Created `skills/private-podcast-feed/` with SKILL.md, README.md, `ping-overcast.sh`, and `generate-feed.ts.example`
- Renamed skill from `text-to-audio` → `text-to-speech` (late-session, before merge)
- Resolved merge conflict with `main` (concurrent `pdf-zine` skill addition)
- Opened and merged PR #49

## Changes Made

- Created: `skills/text-to-speech/` (full tree: SKILL.md, README.md, scripts, templates)
- Created: `skills/private-podcast-feed/` (full tree)
- Modified: `README.md` — added both skills to table; resolved conflict with `pdf-zine`
- Created: `.changeset/20260425-tts-shootout-skills.md`

## Decisions

- **Bundle experiment scripts (not stub):** kokoro.sh bundles the 7 Python scripts from `experiments/tts-shootout/scripts/` into `backends/lib/`. Alternative was a thin stub requiring the user to have the experiment checked out. Blueprint was silent; Max chose "bundle" when asked.

- **pipeline.py path stripping:** Experiment's `pipeline.py` had hardcoded `EXPERIMENT_DIR = Path(__file__).resolve().parent.parent` pointing at the experiment root, and `DICT_PATH`/`STRESS_PATH` as module-level constants. Changed to `_SCRIPT_DIR = Path(__file__).resolve().parent` with dict/stress paths as optional CWD-relative lookups (applied only if file exists). This makes the script portable when bundled.

- **ping-overcast.sh sanitization:** Experiment script had `DEFAULT_PREFIX="https://files.178.is/p/5042a002…"` (personal URL). Blueprint said "ship as-is" but CLAUDE.md says "no account-specific data." Stripped `DEFAULT_PREFIX`; made `$1` required with usage error. No escalation needed — this was a clear CLAUDE.md constraint override.

- **marketplace.json deferred:** CLAUDE.md says do not manually edit `.claude-plugin/marketplace.json`. New skill entries were not added; left for `pnpm run version` in the upcoming "Version Packages" PR (automated via GitHub Actions changeset workflow).

- **Rename text-to-audio → text-to-speech:** Max requested this as a final step before merge. All references updated in one `R:` commit: SKILL.md frontmatter `name:`, heading, README.md title, private-podcast-feed cross-reference, root README table row, and changeset `bumps:` block.

- **Changeset over CHANGELOG.md:** Blueprint listed CHANGELOG.md in the file tree. CLAUDE.md specifies the changeset workflow as canonical; CHANGELOG.md is written automatically by `pnpm run version`. Created `.changeset/20260425-tts-shootout-skills.md` with `bumps:` block instead.

## Bugs Fixed During Execution

- **shellcheck SC2034** (B commit): `kokoro.sh` accepted `--skill-dir` and assigned it to `$SKILL_DIR`, but the variable was never used (the backend computes `LIB_DIR` from `$BASH_SOURCE[0]`). Changed to `--skill-dir) shift 2 ;; # accepted but unused — backend computes own path`.

## Plan Reference

- Plan: `~/.claude/plans/you-are-the-phase-twinkly-axolotl.md`
- Planned: 9 ordered commits covering both skills, SKILL.md/README pairs, scripts, templates, changeset, README table update, and validation
- Executed: 10 commits (9 per plan + 1 rename commit `R: text-to-audio → text-to-speech`). One deviation: blueprint included CHANGELOG.md, replaced with changeset per CLAUDE.md.

## Next Steps

- [ ] Version Packages PR (automated via GitHub Actions) will consume the changeset, bump skill versions, and write CHANGELOG entries
- [ ] Monitor Actions for "Version Packages" PR — review and merge when it appears

## Repository State

- Committed: `5bc7b74` — Merge pull request #49 from eins78/skills/tts-shootout-ship
- Branch: `main` (PR #49 merged)
