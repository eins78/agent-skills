#!/usr/bin/env bash
# sources-index-consistency.sh — keep a dossier's source archive self-describing.
#
# Checks that `sources/index.md` and the files in `sources/` agree:
#   - every file an index row points at exists on disk
#   - every captured file on disk has an index row
#
# This is a CONSISTENCY gate, not a COVERAGE gate. It never asks "was every
# citation archived?" — that question has no safe answer on a machine where no
# archiver is installed, and a gate that hard-fails a dossier because a source
# could not be captured is worse than no gate. It only asks whether the archive
# that does exist describes itself accurately. An unusable archive is the real
# failure mode: files with no provenance, or an index pointing at nothing.
#
# Silently passes when there is nothing to check:
#   - no sources/ directory       → the dossier simply wasn't archived
#   - sources/ but no index.md    → archival is mid-flight (the first capture
#                                   lands before the index is written)
#
# Deliberately jq-free: jq is not guaranteed on a bare machine, and the index
# is a markdown pipe table that awk parses directly.
#
# Usage: sources-index-consistency.sh <path-to-DOSSIER-*.md>
# Exit codes: 0 = accepted; 1 = rejected; 2 = bad args.

set -euo pipefail

path="${1:-}"
if [[ -z "$path" ]]; then
  echo "usage: $(basename "$0") <path-to-dossier.md>" >&2
  exit 2
fi

name=$(basename "$path")

# Not a main dossier → nothing to check. Ballots don't own a source archive.
if [[ "$name" != DOSSIER-*.md ]] || [[ "$name" == *BALLOT* ]]; then
  exit 0
fi

dir=$(dirname "$path")
sources="$dir/sources"

[[ -d "$sources" ]] || exit 0
[[ -f "$sources/index.md" ]] || exit 0

# Files referenced by index rows. Column 5 of the pipe table is the File cell,
# holding zero or more markdown links: "[name.html](name.html), [name.md](...)".
# archive-source.sh escapes literal pipes as %7C so the table stays parseable.
referenced=$(
  awk -F'|' '
    /^\|-/            { next }   # table rule
    $2 ~ /^ *ID *$/   { next }   # header
    NF >= 10          { print $5 }
  ' "$sources/index.md" \
  | grep -o '](\([^)]*\))' 2>/dev/null \
  | sed -e 's/^](//' -e 's/)$//' \
  | sort -u
)

# Files actually captured. index.md is the index, not a source; .gitignore is
# repo plumbing. Neither gets a row, and neither is an orphan.
present=$(
  find "$sources" -maxdepth 1 -type f \
    ! -name 'index.md' ! -name '.gitignore' \
    -exec basename {} \; 2>/dev/null | sort -u
)

failures=""

# A referenced file that git is ignoring is absent BY DESIGN, not by accident:
# public repos are told to gitignore `sources/*.html` (third-party page bodies)
# while still committing index.md and the .md extractions. On a fresh clone
# those .html are gone and the index still names them — correct, not broken.
# Falls back to "nothing is ignored" outside a git repo or without git.
is_ignored() {
  command -v git >/dev/null 2>&1 || return 1
  git -C "$sources" check-ignore -q "$1" 2>/dev/null
}

while IFS= read -r f; do
  [[ -n "$f" ]] || continue
  if [[ ! -f "$sources/$f" ]] && ! is_ignored "$f"; then
    failures+="  index.md references a missing file: sources/$f"$'\n'
  fi
done <<< "$referenced"

while IFS= read -r f; do
  [[ -n "$f" ]] || continue
  if ! printf '%s\n' "$referenced" | grep -qxF "$f"; then
    failures+="  captured file has no index.md row: sources/$f"$'\n'
  fi
done <<< "$present"

if [[ -n "$failures" ]]; then
  echo "ERROR: source archive is inconsistent with its index ($sources/index.md)" >&2
  printf '%s' "$failures" >&2
  echo "  Fix: re-run archive-source.sh for the affected source, or remove the stale entry/file." >&2
  exit 1
fi

exit 0
