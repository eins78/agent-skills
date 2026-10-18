# agent-workspace: unparked for alpha release (PR #47)

**Date:** 2026-10-18
**Source:** Claude Code (Opus 5.5)
**Session:** Dispatched from a separate session with a written brief; worked in a git worktree on the PR branch. Nine Haiku subagents ran the skill test scenarios (three rounds of three); one fresh-context skill-reviewer agent reviewed the result.

## Summary

PR #47 had been parked since April because the maintainer's own workspaces don't follow one convention. The decision now is to publish anyway as an alpha and "teach the controversy": where workspaces differ, the skill names the options and says when each fits.

Rebased onto `main`. The only conflict was `.claude-plugin/marketplace.json`; skill PRs no longer edit it by hand (the release regenerates it), so the PR's hunk was dropped. Then one content commit: `references/variations.md` (questions workspaces answer differently; 14 in round one, 18 after round two, 21 after round three), a data-scope access boundary, folded-in fixes from an April review of the first draft, the maintainer's PR comment on system-prompt friction, and a rewritten changeset.

## 1. Version stays `0.1.0-alpha.1`

The old changeset listed `agent-workspace: minor` in `bumps:`. `increment_semver` strips pre-release suffixes, so the release would have shipped `0.2.0` — no longer alpha. A recent new skill that went in as `1.0.0-beta.1` with `minor` shipped as `1.1.x` for this reason. The changeset now has an empty `skills:` list; `bump-skill-versions.sh` was dry-run on a scratch copy and leaves the version alone.

## 2. Test scenarios found the real failure

Fixture: a single-owner workspace with `projects/` + `_paused/`, root `sessionlogs/`, and a work workspace mounted as a submodule. Three requests, three fresh Haiku agents per version.

- Layout was never the problem: with the old skill, 3/3 followed the workspace's own `CLAUDE.md` over the skill's default table.
- Scope was: 0/3 refused to summarize a work runbook into the personal sessionlog. The old access-boundary text talked about customer content in shared workspaces and didn't reach this case.
- Rewritten as a check on an observable fact — "did any of this content come from a different repo?" — with three allowed outcomes (answer in chat, write in the source repo, leave a pointer). 3/3 in both later rounds.
- An unnamed home for a research report produced three different answers and one invented top-level directory. Added "ask before writing a path `CLAUDE.md` doesn't name". Round three: no invented directories.

## 3. What was deliberately not done

- No Cursor test; the README says the `compatibility` claim is declared, not verified.
- No gates shipped. The skill recommends hooks for rules automation depends on; the README lists that as a known gap.
- No `ai-council-review` run from this session: the cost dry-run worked ($0.29 estimate), but the real dispatch was blocked by the session's permission policy because it reads an API key from the keychain. It was later run by the dispatching session (section 6).
- No Copilot review request: blocked by the same policy as an external write.
- Substitute: a fresh-context skill reviewer found five cross-file contradictions (defaults stated as requirements, a research dir in the default tree, a missing variation item), three misapplication risks (sessionlog continuation, relative paths, a "below" that meant "above"), an over-broad trigger, and a glossary example that read like a real system. All fixed in the content commit.
- Not merged.

## 4. Round two: comparing an umbrella workspace with its unit workspaces

The maintainer asked for a comparison across the workspaces of one organisation: an umbrella workspace that mounts client and function workspaces as submodules. Three were readable locally (the umbrella and two client workspaces). The rest were not initialized on this machine, and a shallow clone over SSH was blocked by the session's permission policy, so they are not covered. The per-workspace comparison table went to the maintainer only; nothing here names the workspaces.

Four new items in `variations.md`:

- **15, entry file.** One unit workspace keeps its content in `AGENTS.md` and makes `CLAUDE.md` a one-line import.
- **16, sub-unit as folder vs own workspace.** The umbrella documents measured costs and an explicit promotion test; it generalises directly.
- **17, conventions inherited by link.** Unit workspaces state local settings and link to the umbrella's convention doc. Some `CLAUDE.md` sections are parsed by skills, so their headings and keys must stay literal.
- **18, rollups and generated files.** Monthly changelogs, a yearly summary and weekly reports all occur; generated indexes and sync status are committed and checked by scripts.

Existing items gained options: ticket-prefixed story slugs and `author:` frontmatter (2); a wiki schema and manifest (6); sync automation for large umbrellas (8); credential scanning as a gate (12).

## 5. Round three: the remaining unit workspaces

The maintainer approved cloning the unit workspaces that were not checked out, on condition they were removed afterwards. Eight were shallow-initialized, read for structure only (directory names, entry-file headings, file counts), then de-initialized, and their stored clones moved to the Trash; submodule status was back to "not initialized" for all of them. One access-restricted workspace is mounted opt-in (`update = none`) and was deliberately left unread. Nothing was committed in any of the surveyed repos.

Three new items in `variations.md`:

- **19, language of structure.** Several workspaces use the team's language for directory names and headings, which contradicted the skill's "English structure" convention. English stays the default; the rule is now only that tool-parsed keys and headings stay literal.
- **20, top-level taxonomy.** Functional directories, numbered area folders, or topical files at the root.
- **21, workspace agents.** `.claude/agents/` holds specialist tools, role personas, or domain workers that act on outside systems, with autonomy levels and approval workflows.

Existing items gained options:

- 13: public-by-design workspaces with a name gate, opt-in mounts for restricted workspaces, and a real-client-data section.
- 15: entry files kept as full copies, and a hub-and-spoke entry file.
- 18: single append-only logs.

## 6. Council review (prose preset, 4 of 4 members delivered)

Run by the dispatching session after the maintainer approved it. I checked every finding against the files.

Fixed:

- **Bootstrap prompt used `references/*.md` paths.** These don't resolve in the repo being bootstrapped. The prompt now names the files in the skill's own `references/` folder.
- **The prompt required a tool-specific question tool.** It now says "a structured question tool if you have one, otherwise one question at a time".
- **"Commit the skeleton" was unconditional.** It now depends on the git workflow chosen in the interview.
- **`AGENTS.md`-only repos tripped the "no `CLAUDE.md`" red flag and the minimum bar.** Both now accept either file, and item 15 gained an `AGENTS.md`-only option.
- **The boundary check was keyed only to "a different repo".** Same-repo client and sub-unit folders with narrower audiences escaped it. The check now compares the source's audience with the destination's, and the overlapping customer-content red flag is merged into it.
- **Sessionlog continuation offered two options with no default.** The default is now one file per topic with dated appended sections. The new-file-per-session alternative moved to item 4.
- **The LOCATE table had no plans row.** Added.
- **Diagram-review rows in the CLAUDE.md first-draft checklist.** Replaced with CLAUDE.md-specific rows, and the two diagram size limits now agree.

Kept as is:

- **Cursor compatibility.** The frontmatter declaration stays; the README already says it is untested. The tool-neutral prompt removes the one Claude-only instruction.

Declined:

- **Gates for the boundary.** Listed as a known gap for the alpha.
- **`metadata.author`.** Repo-wide convention.
- **The n=3 caveat.** The README already states the sample size.
- **The "copy notes from another repo" trigger.** It is exactly the case the boundary rule exists for.

Decided by the maintainer: the empty `bumps:` list. Three members flagged it against the repo's changeset rule. The bump script has no way to keep a pre-release suffix. Of three options — a documented exception, a `prerelease` bump type in the script, or accepting `0.2.0` — the maintainer chose the exception. The repo's `CLAUDE.md` now says a brand-new pre-release skill ships at its authored version and is left out of `skills:` for its first release.
