#!/usr/bin/env bash
# dossier-commit-gate.sh — PreToolUse shim that enforces the REVIEW stage at
# the moment DELIVER commits.
#
# WHY PreToolUse ON Bash, AND NOT PostToolUse ON Write
#
# The existing dossier hooks are PostToolUse on Write|Edit: the file is already
# on disk when they fire, so they are alerting-level and a motivated agent can
# ignore them. That is acceptable for a filename shape. It is not acceptable
# here, because the whole point is that "I reviewed it" must stop being
# answerable without the work.
#
# PostToolUse on Write would also be the wrong *moment*. A dossier is written
# and edited dozens of times during SYNTHESIZE, and demanding a review artifact
# on every one of those edits would fire constantly during normal authoring —
# noise that trains the reader to ignore it. Review belongs at the end.
#
# git commit is the delivery act in this skill (DELIVER: "Commit dossier
# folder"), which makes it the one moment where the check is both meaningful
# and rare. PreToolUse exit 2 denies the call, so the gate actually holds.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

payload=$(cat)
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty')

# Fast exit: this hook sees every Bash call, so anything that is not a commit
# must cost as close to nothing as possible.
if [[ "$command" != *"git commit"* ]]; then
  exit 0
fi

# Not in a git repo (or git unavailable) — nothing to check, and it is not this
# hook's business to complain about that.
if ! root=$(git rev-parse --show-toplevel 2>/dev/null); then
  exit 0
fi

staged=$(git diff --cached --name-only 2>/dev/null || true)

# `git commit -a` stages tracked modifications as part of the commit itself, so
# they are not in the index yet when this hook runs.
if [[ "$command" == *" -a"* || "$command" == *"--all"* ]]; then
  staged+=$'\n'$(git diff --name-only 2>/dev/null || true)
fi

if [[ -z "${staged//[[:space:]]/}" ]]; then
  exit 0
fi

failures=""

while IFS= read -r rel; do
  [[ -z "$rel" ]] && continue
  base=$(basename "$rel")
  [[ "$base" == DOSSIER-*.md ]] || continue
  [[ "$base" == *-BALLOT-*.md ]] && continue

  abs="$root/$rel"
  [[ -f "$abs" ]] || continue

  if ! output=$("$here/review-artifact-present.sh" "$abs" 2>&1); then
    failures+="$output"$'\n'
  elif [[ -n "$output" ]]; then
    # Warnings (staleness) pass through without blocking.
    printf '%s\n' "$output" >&2
  fi
done <<< "$staged"

if [[ -n "$failures" ]]; then
  printf '%s' "$failures" >&2
  echo "" >&2
  echo "Commit blocked: the REVIEW stage has not completed for the dossier(s) above." >&2
  echo "Run REVIEW (references/review-lenses.md), then commit the dossier and its review artifact together." >&2
  exit 2
fi

exit 0
