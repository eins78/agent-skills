# ai-council-review: roster overhaul, README tables, models changelog (PR #103)

**Date:** 2026-09-20
**Source:** Claude Code (Opus 5)
**Session:** Dispatched from a separate session with a written brief and a pre-researched pricing
ballot; worked in a git worktree branched from `origin/main`. No compactions. Two commits on one
PR branch (an initial overhaul, then a same-day amendment).

## Summary

First scheduled monthly model review for `ai-council-review`, reshaping its council presets from
5 to 8 (`default`, `code`, `prose`, `budget`, `crowd`, `max`, `flagship`, `smoke`), adding
per-preset and per-model pricing tables to `README.md`, and adding a new hand-maintained
`references/MODELS-CHANGELOG.md` — model rosters are external dependencies outside the skill's
semver contract, so their history is tracked separately from `CHANGELOG.md`.

All slugs were re-verified live against the OpenRouter catalog with `council.mjs models --verify`
before any file was touched, rather than trusted from the pricing ballot that motivated the work.
Opened as a PR against `main`; not merged.

## 1. `default` becomes the code-review roster

`code` and the pre-existing `default` differed in exactly one seat
(`openai/gpt-5.3-codex` vs `openai/gpt-5.5`) and were otherwise identical. Since code/diff review
is this skill's normal use case, and the codex seat is also cheaper ($3.88/M in vs $7.13), `code`'s
roster became the new `default`. The old `default` roster survives under a new name, `prose`, for
plan docs and other prose review where a codex-tuned seat is a downgrade. This is a **behaviour
change for every adopter of a public skill**, not a patch — the changeset says so explicitly and
takes a minor bump.

## 2. Two corrections found by re-verifying rather than trusting the ballot

- The ballot's `crowd` total was $1.18/M in; live pricing gives **$1.12/M** at the time this preset
  first shipped (small rounding drift in the source numbers). See §4 for the number after the
  post-ship correction.
- The ballot estimated a flagship run at "$1.4–1.6 of output alone." At the skill's configured
  `outputTokensPerModel: 3000`, four-seat output cost is actually ~$0.35; **input** is what
  dominates on a real diff (a 30k-token diff adds ~$0.72, landing near $1.07 total). Flagship still
  reliably trips the skill's $1 confirmation gate — just for the size of the diff, not for output
  volume as originally reasoned.

## 3. A roster shipped before anyone checked context windows, caught same-day

`crowd` (six cheap seats across five vendors, for breadth rather than per-vendor independence)
first shipped with `tencent/hunyuan-a13b-instruct` in one seat. Its context window is 131,072
tokens — 8× smaller than every other seated model. The dispatch script fits every member's payload
to the **smallest** context window across the council before sending
(`scripts/council.mjs`, calling `fitPayload` in `scripts/lib/input.mjs`), so this one seat was
silently capping all six members' input at 131k — defeating the point of a six-seat "many
independent opinions" preset on anything but a small diff.

Caught during review before merge and swapped for `tencent/hy4-preview` (1,048,576 ctx,
$0.83/$2.50, re-verified live). The new effective cap is **1,000,000 tokens exactly** — set by
`qwen/qwen3.8-flash` and `qwen/qwen3.8-27b` (both 1,000,000), not by the Tencent seat, whose own
window (1,048,576) is slightly larger. That distinction is stated precisely everywhere the cap is
documented, since rounding it to "~1M" would have hidden which seat actually sets the limit next
time it changes. `crowd`'s per-preset total input price moved from $1.12/M to $1.81/M as a result;
seat count and vendor count (five, Alibaba represented twice by design) were unaffected.

## 4. `MODELS-CHANGELOG.md`: one entry per shipped state, not one per edit

The hunyuan → hy4-preview swap (§3) happened before the PR merged, so it was folded into the same
2026-09-20 changelog entry that introduced `crowd`, rather than appended as a second dated entry —
the changelog records shipped roster history, and this preset never shipped with hunyuan in it.
The entry's trigger line states the mechanism plainly (fit-to-smallest-context, one narrow-window
seat capping the whole preset) so a future editor understands *why* the seat was replaced, not just
that it was.

## 5. Existing tests needed no changes, verified rather than assumed

`tests/live-smoke.test.mjs` pins `deepseek/deepseek-v4-flash` directly via `--models`, bypassing
preset resolution entirely, so it was unaffected by every preset in this PR changing. Same for
`tests/dispatch.test.mjs`, which dispatches against mock slugs throughout. Both were re-run (not
assumed) after each of the two commits: 64 passed, 1 skipped (no API key), 0 failed both times.

## 6. A stale local override reproduced the exact failure mode the docs warn about

While verifying that every new preset name resolves through `scripts/lib/config.mjs`, three
presets (`default`, `budget`, `max`) kept returning pre-4.5.1 rosters. Cause: a stale
`~/.config/ai-council-review/config.json` on the machine this session ran on — a user-level
override whose presets take precedence over the bundled `references/presets.json` by design, and
which happened to still hold the previous rosters. This is precisely the documented risk in the
skill's config-precedence design (a user override "replaces the bundled roster of the same name
wholesale"): once this PR merges, that same file would silently mask every preset it changed,
until someone thinks to check for an override. The file was moved aside, all eight presets and a
`flagship --dry-run` were re-verified clean, and it was moved straight back — deleting a config
file outside the skill's own tree wasn't this PR's job.

## 7. Process notes

- `pnpm install` was run with `--ignore-scripts` so the repo's `postinstall`
  (`skills add . --global`) did not copy this in-progress worktree's skill tree into the shared
  global skills directory mid-edit.
- Both commits' commit messages were written to a scratch file and passed via `git commit -F`;
  a heredoc passed inline to `git commit -m` failed to parse in this shell environment.

## Deliverables

1. `skills/ai-council-review/references/presets.json` — the reshaped roster.
2. `skills/ai-council-review/references/MODELS-CHANGELOG.md` — new, hand-maintained.
3. `skills/ai-council-review/README.md` — per-preset and per-model tables; roster-swap narration
   in Provenance trimmed in favor of pointing at the new changelog.
4. `skills/ai-council-review/SKILL.md`, `skills/ai-council-review/references/synthesis.md` — preset
   references and the same-vendor discount note updated to match.
5. Changeset (`ai-council-review` minor, "behaviour change" stated for the `default` swap).
6. This log, on the PR branch.
