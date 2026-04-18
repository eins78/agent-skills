#!/usr/bin/env bash
# dossier-hook-dispatcher.sh — extracts file_path from the Claude Code
# PostToolUse JSON payload (piped on stdin) and invokes the one remaining
# mechanical hook against it. The hook self-gates on filename pattern, so
# the dispatcher calls it unconditionally and aggregates failures.
#
# The dispatcher exists purely as an argv/stdin shim — the kept script
# takes argv for CLI-testability, while Claude Code pipes JSON on stdin.
#
# Prior versions of this dispatcher routed to 7 hooks and branched on
# filename pattern. Six of those hooks were removed in the 2026-04-18
# polish pass as overfit to the a11y-extension session (see
# docs/sessionlogs/2026-04-18-pitch-b-impl.md §Post-review Polish).
# dossier-framing-declared was removed in the 2026-04-18 preflight-gate
# pass (framing-mode convention replaced by judgment-based preflight gate).
# The remaining hook (ballot-filename) is the mechanical check that
# generalizes across dossier styles.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Template files are placeholders; hooks would fail on placeholder values.
if [[ "$file_path" == */templates/* ]]; then
  exit 0
fi

name=$(basename "$file_path")

# Only audit DOSSIER-*.md paths (this covers main dossiers + ballots).
if [[ "$name" != DOSSIER-*.md ]]; then
  exit 0
fi
if [[ ! -f "$file_path" ]]; then
  exit 0
fi

failures=""

# The script self-gates on filename pattern — safe to call unconditionally.
if ! output=$("$here/ballot-filename.sh" "$file_path" 2>&1); then
  failures+="$output"$'\n'
fi

if [[ -n "$failures" ]]; then
  printf '%s' "$failures" >&2
  echo "" >&2
  echo "Dossier audit failures above. Fix before calling DELIVER complete." >&2
  exit 2
fi

exit 0
