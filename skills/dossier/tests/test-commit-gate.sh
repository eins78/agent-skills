#!/usr/bin/env bash
# Smoke test for .claude-plugin/hooks/dossier-commit-gate.sh in scratch git
# repos. Touches no real repo. Run: bash skills/dossier/tests/test-commit-gate.sh
#
# The gate must hold in both directions, and the merge cases prove both:
#   - authoring a DOSSIER-*.md without a review artifact is denied (exit 2)
#   - a merge commit that only integrates a dossier already committed on the
#     incoming branch is allowed, even when that dossier has no review beside it
#   - a dossier added by hand *during* a merge is still denied, and the denial
#     names that file and not the integrated one
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
gate="${DOSSIER_COMMIT_GATE:-$here/../../../.claude-plugin/hooks/dossier-commit-gate.sh}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Keep the user's git config out of the scratch repos: signing, hooksPath,
# templates and default-branch settings would all change what commits do.
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com

fail=0
pass() { echo "  ok   — $1"; }
flunk() { echo "  FAIL — $1"; fail=1; }

# run_gate <command> — pipes a PreToolUse payload for <command> into the gate
# from the current directory. Sets $status and $stderr, never aborts the test.
run_gate() {
  local payload
  payload=$(jq -cn --arg c "$1" '{tool_input:{command:$c}}')
  set +e
  stderr=$(printf '%s' "$payload" | "$gate" 2>&1 >/dev/null)
  status=$?
  set -e
}

expect_status() { # expect_status <label> <expected-exit>
  if [[ "$status" -eq "$2" ]]; then
    pass "$1 (exit $status)"
  else
    flunk "$1: expected exit $2, got $status"
    [[ -n "$stderr" ]] && printf '%s\n' "$stderr" | sed 's/^/         | /'
  fi
}

expect_stderr_has() { # expect_stderr_has <label> <substring>
  if [[ "$stderr" == *"$2"* ]]; then pass "$1"; else flunk "$1: stderr lacks '$2'"; fi
}

expect_stderr_lacks() { # expect_stderr_lacks <label> <substring>
  if [[ "$stderr" != *"$2"* ]]; then pass "$1"; else flunk "$1: stderr mentions '$2'"; fi
}

new_repo() { # new_repo <name> — creates and enters an initialised repo
  local dir="$tmp/$1"
  git init -q -b main "$dir"
  cd "$dir"
  echo "shared" > notes.md
  git add notes.md
  git commit -q -m "init"
}

write_dossier() { # write_dossier <dir> <slug>
  mkdir -p "$1"
  printf '# %s\n' "$2" > "$1/DOSSIER-$2.md"
}

write_review() { # write_review <dir> — one finding, dispositioned, dated today
  printf '### F1 — something\n**Disposition:** waived — not a defect\n' \
    > "$1/review-$(date +%Y-%m-%d).md"
}

echo "1. Ordinary commits (no merge in progress)"
new_repo plain
write_dossier research/topic Topic
git add research
run_gate "git commit -m 'deliver'"
expect_status "unreviewed dossier is denied" 2
expect_stderr_has "denial names the dossier" "DOSSIER-Topic.md"
write_review research/topic
git add research
run_gate "git commit -m 'deliver'"
expect_status "dossier with dispositioned review passes" 0
run_gate "ls -la"
expect_status "non-commit command is ignored" 0

echo "2. Merge that only integrates a dossier committed on the other branch"
new_repo merge
git checkout -q -b incoming
write_dossier research/theirs Theirs        # committed upstream, no review
echo "theirs" > notes.md
git add -A
git commit -q -m "upstream: dossier and notes"
git checkout -q main
echo "ours" > notes.md
git commit -q -am "ours: notes"
if git merge -q incoming >/dev/null 2>&1; then
  flunk "fixture: merge was expected to conflict on notes.md"
fi
echo "resolved" > notes.md
git add notes.md
if [[ -f "$(git rev-parse --git-path MERGE_HEAD)" ]]; then
  pass "fixture: merge in progress (MERGE_HEAD present)"
else
  flunk "fixture: MERGE_HEAD missing"
fi
run_gate "git commit -m 'merge incoming'"
expect_status "merge integrating an unreviewed upstream dossier is allowed" 0
expect_stderr_lacks "integrated dossier is not named" "DOSSIER-Theirs.md"

echo "3. Same merge, plus a dossier authored by hand during the merge"
write_dossier research/mine Mine
git add research/mine
run_gate "git commit -m 'merge incoming'"
expect_status "dossier added during a merge is still denied" 2
expect_stderr_has "denial names the hand-added dossier" "DOSSIER-Mine.md"
expect_stderr_lacks "denial does not name the integrated dossier" "DOSSIER-Theirs.md"
write_review research/mine
git add research/mine
run_gate "git commit -m 'merge incoming'"
expect_status "reviewing the hand-added dossier unblocks the merge" 0

echo
if [[ "$fail" -eq 0 ]]; then
  echo "All commit-gate checks passed."
else
  echo "Some commit-gate checks FAILED."
  exit 1
fi
