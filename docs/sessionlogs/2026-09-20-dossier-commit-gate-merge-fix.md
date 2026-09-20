# dossier: commit gate no longer denies merge commits (PR #100)

**Date:** 2026-09-20
**Source:** Claude Code (Fable 5.1)
**Session:** Dispatched from a separate session with a written brief; worked in a git worktree branched from `origin/main` (`eb09980`). No compactions. No subagents — three files and one judgement call, so a fan-out would have cost more than the work.

## Summary

`dossier-commit-gate.sh` built its file list from `git diff --cached --name-only`, which compares the index against `HEAD`. During a merge the index holds the whole incoming tree, so a `DOSSIER-*.md` that another branch committed long ago showed up as "staged" and was checked as if it were being authored now. Any session that merged `origin/main` before pushing and had to finish the merge with `git commit` (conflict, or `--no-commit`) was denied. The gate's own header says it exists to catch the moment DELIVER commits; a merge is not that moment.

Fixed by scoping the staged list, when `MERGE_HEAD` exists, to paths whose staged content differs from every parent. Proven in both directions with a scratch-repo test script that failed before the fix and passes after it. Opened as a PR for Max; not merged.

## 1. Why "differs from every parent", not "differs from the merge base"

The brief suggested diffing against the merge base. Checked before adopting: the incoming dossier differs from the merge base too (that is what makes it incoming), so the gate would still flag it. The semantics that match "what does this merge commit itself contribute" are the ones `git diff-tree --cc` uses for a finished merge commit: a path counts only if its content differs from all parents. Before the commit exists there is no `--cc`, so the hook takes the `HEAD` diff and intersects it with the diff against each line of `MERGE_HEAD`.

What survives the intersection: conflict resolutions, and files added by hand during the merge. What drops out: anything taken verbatim from either side. A path identical to a parent was committed by that parent, and that commit already faced this gate. So the fix adds no bypass that did not already exist — to sneak an unreviewed dossier through a merge you would first have to commit it somewhere, which is the very act the gate guards.

Two rejected alternatives. Skipping the gate entirely during a merge would let a dossier written during conflict resolution through unreviewed. Rebasing instead of merging (the known workaround) works but is a rule; adopters would not know to do it.

## 2. Reproduction needs a conflict, and the brief did not say so

The hook only fires when the Bash command text contains `git commit`. A clean `git merge origin/main` creates the commit internally and never trips the hook, so the bug only appears when the merge conflicts (or is run with `--no-commit`) and the agent finishes it with `git commit`. The test fixture therefore makes both branches edit the same file, resolves the conflict, stages it, and only then pipes the payload into the hook. The incoming dossier is deliberately unreviewed; with a review beside it the filesystem check would already pass and the merge case would prove nothing.

## 3. Implementation details that mattered

- **`grep -Fxf` was the obvious intersection and is wrong.** An empty diff list piped through `printf '%s\n'` yields one empty line, and an empty pattern line in `grep -f` matches everything, silently inverting the filter. `comm -12` on `sort -u`'d lists has no such edge.
- **Parents come from `git rev-parse --git-path MERGE_HEAD`,** read line by line. `git rev-parse MERGE_HEAD` returns only the first parent of an octopus merge, and `--git-path` resolves correctly inside a worktree.
- **The filter runs before the `git commit -a` append.** Working-tree edits made during a merge are genuinely this commit's, so they stay unfiltered.
- `review-artifact-present.sh` is untouched. The defect was in what the shim fed it, not in what it checks.

## 4. Test order, as run

`skills/dossier/tests/test-commit-gate.sh`, isolated from the user's git config (signing, hooksPath, templates) via `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_NOSYSTEM=1`.

| Case | Before fix | After fix |
|------|-----------|-----------|
| Plain commit, unreviewed dossier → denied | pass | pass |
| Plain commit, dispositioned review → allowed | pass | pass |
| Conflicted merge integrating an unreviewed upstream dossier → allowed, upstream file not named | **fail (exit 2)** | pass |
| Same merge plus a dossier added by hand → denied, names only the hand-added file | pass | pass |
| Review the hand-added dossier → merge allowed | fail (upstream file still flagged) | pass |

The fourth row is the one that makes this a repair rather than a removal: it passed before and still passes after, so the intersection is not dropping paths that are new in the merge.

## 5. Out of scope, all pre-existing

- `git merge --squash` leaves no `MERGE_HEAD` and really does author the incoming files into a non-merge commit; the gate fires there, which is arguably right.
- `git cherry-pick` of someone else's dossier is treated as authoring.
- Command strings that do not contain the literal `git commit` (for example `git -c x commit`) never reach the gate.

## 6. Process notes

- A third-party PreToolUse hook in this environment blocks any Bash command whose text names a `.git/` internal path. The test's original `[[ -f .git/MERGE_HEAD ]]` check was rewritten to `git rev-parse --git-path MERGE_HEAD`, which is the better form anyway.
- `pnpm install` was run with `--ignore-scripts` so the postinstall did not copy this branch's skills into the global skills directory.
- `shellcheck` clean on both the hook and the test script.

## Deliverables

1. `.claude-plugin/hooks/dossier-commit-gate.sh` — the fix.
2. `skills/dossier/tests/test-commit-gate.sh` — scripted proof of both directions; manual command in the skill README.
3. `skills/dossier/README.md`, `skills/dossier/SKILL.md` — test item 5b rewritten around the script; one sentence in the gates table.
4. Changeset (`dossier` patch).
5. This log, on the PR branch.
