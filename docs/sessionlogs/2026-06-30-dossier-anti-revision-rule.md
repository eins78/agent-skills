# Dossier — anti-revision rule (#56)

**Date:** 2026-06-30
**Source:** Claude Code (Opus 4.7, 1M)
**Session:** No compactions · single-shot from a complete user spec

## Summary

Implemented eins78/agent-skills#56 ("dossier skill: add anti-revision rule"). When a user gave mid-session corrections on an unpublished dossier, the agent was accumulating *document history* in the body (Revision-note blocks, `rev. <date>` date suffixes, "first draft framed X / corrected after feedback" phrasing). The skill now instructs the agent to collapse the dossier to a single current version and recast corrections as plain present-tense facts. Branch `worktree-dossier-i56-anti-revision`, PR **#57** opened against `main`.

## Key Accomplishments

- Added "Anti-revision rule" bullet to `skills/dossier/SKILL.md` §SYNTHESIZE (alongside the existing Template-order rule)
- Added "Narrating edit history in the body" row to the SKILL.md Common Mistakes table
- Added item **#9 Single current version (no edit history in the body)** to `skills/dossier/references/review-checklist.md` with the standard What/Why/Good/Red-flags structure
- Extended the `templates/dossier.md` header HTML comment to name the anti-revision rule alongside the section-order rule
- Bumped `skills/dossier/README.md` item count `8 → 9` in two places (tree comment + Testing step 5)
- Wrote `.changeset/dossier-anti-revision-rule.md` at patch level (1.1.0 → 1.1.1) with the `bumps:` block

## Changes Made

- Modified: `skills/dossier/SKILL.md`
- Modified: `skills/dossier/references/review-checklist.md`
- Modified: `skills/dossier/templates/dossier.md`
- Modified: `skills/dossier/README.md`
- Created: `.changeset/dossier-anti-revision-rule.md`

Commit `6267f10`, +46 / -2 lines across 5 files.

## Decisions

- **`patch` not `minor` bump.** The change adds a new SYNTHESIZE bullet, a new Common Mistakes row, *and* a brand-new review-checklist item (#9). By a strict reading of CLAUDE.md's versioning rules ("minor = new sections / expanded coverage"), this could justify `minor`. Chose `patch` because the issue is framed as a bug-fix — an existing-rule-was-missing-and-agents-drifted clarification, not a new dimension of dossier behavior. Confirmed with the user via AskUserQuestion before exiting plan mode.
- **No new hook.** The skill's README documents a 2026-04-18 polish pass that removed six overfit grep hooks because their patterns were specific to the a11y-extension session and missed equivalent patterns in other dossier styles. Adding `dossier-anti-revision.sh` would re-create that anti-pattern. The rule lives in prose; the review-checklist item #9 is the enforcement surface. The "judgement, not grep" pattern is now load-bearing for the skill's design.
- **Anti-revision bullet placed next to the Template-order rule** in §SYNTHESIZE — both are "how the body of the dossier should read" rules and form a natural cluster, before the Ballot subsection.
- **Header-comment extension over a separate template block.** The dossier template already has a section-order rule comment at the top; adding a parallel paragraph for the anti-revision rule reinforces the pattern instead of adding a third surface. Avoided putting the rule in any of the `<!-- REQUIRED -->` annotations, which are about per-section structure, not document-wide style.

## Verification

- `pnpm install` (worktree had no `node_modules`) — installed cleanly via postinstall (skills add)
- `pnpm test` — exit 0, `dossier` listed in the skills CLI parse output
- `pnpm run validate` — `All skills valid (0 warning(s))`
- `git diff --stat` — 4 modified files + 1 new changeset, doc-only, no hooks/`package.json`/version files touched manually

## Plan Reference

- Plan: `~/.claude/plans/address-eins78-agent-skills-issue-56-tidy-ripple.md`
- Plan was written and approved in plan mode; executed exactly as written. No deviations.

## Out of Scope (per issue)

Deliberate dated addenda on already-published dossiers — that case stays valid and was explicitly excluded both in the issue and in the new SKILL.md/checklist text.

## Next Steps

- Await PR #57 review. Once merged, the changesets/action will open a "Version Packages" PR bumping dossier to `1.1.1` and the plugin via the `bumps:` block.
