#!/usr/bin/env bash
# dossier-forbidden-words.sh — fail if a dossier's declared framing mode has
# any of its forbidden words in the body (case-insensitive).
#
# Framing mode is read from, in order:
#   1. First arg after filename: $2 (e.g. `oss`, `commercial`, `hiring`, `vendor`, `personal`)
#   2. YAML frontmatter field `framing-mode: <value>`
#   3. HTML comment anywhere in the file: `<!-- dossier-framing-mode: <value> -->`
#
# Lines containing `<!-- allow-forbidden -->` are skipped (intended meta-denial).
# Wordlists live in skills/dossier/references/framing-modes.yaml — single source
# of truth, consumed here via yq v4 (mikefarah).
#
# Usage: dossier-forbidden-words.sh <dossier.md> [mode]
# Exit codes: 0 = clean or no mode declared; 1 = violation; 2 = bad args.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
wordlist_file="$here/../../skills/dossier/references/framing-modes.yaml"

file="${1:-}"
mode_arg="${2:-}"

if [[ -z "$file" ]]; then
  echo "usage: $(basename "$0") <dossier.md> [mode]" >&2
  exit 2
fi
if [[ ! -f "$file" ]]; then
  echo "ERROR: not a file: $file" >&2
  exit 2
fi
if ! command -v yq >/dev/null 2>&1; then
  echo "ERROR: yq not found on PATH — required by $(basename "$0")" >&2
  echo "  Install: brew install yq (expects mikefarah/yq v4)" >&2
  exit 2
fi
if [[ ! -f "$wordlist_file" ]]; then
  echo "ERROR: wordlist file not found: $wordlist_file" >&2
  exit 2
fi

# Resolve mode.
mode="$mode_arg"
if [[ -z "$mode" ]]; then
  mode=$(awk '/^---$/{b++; next} b==1 && /^framing-mode:/{sub(/^framing-mode:[[:space:]]*/,""); gsub(/"/,""); print; exit} b>=2{exit}' "$file")
fi
if [[ -z "$mode" ]]; then
  mode=$(grep -oE '<!--[[:space:]]*dossier-framing-mode:[[:space:]]*[a-z]+[[:space:]]*-->' "$file" | head -1 | sed -E 's/.*dossier-framing-mode:[[:space:]]*([a-z]+).*/\1/' || true)
fi
if [[ -z "$mode" ]]; then
  # No framing declared → skip. Declaration itself is gated by
  # dossier-framing-declared.sh; this hook handles vocabulary only.
  exit 0
fi

# Template placeholder (e.g. `{oss | commercial | ...}`) → skip; this is not a
# real dossier. The placeholder gets replaced when an agent instantiates.
# See skills/dossier/references/framing-modes.md §"Template placeholder handling".
if [[ "$mode" == *'{'* || "$mode" == *'|'* ]]; then
  exit 0
fi

# Validate mode against the YAML keys.
known_modes=$(yq '.modes | keys | .[]' "$wordlist_file" | tr '\n' '|' | sed 's/|$//')
if ! grep -qx "$mode" <<< "$(yq '.modes | keys | .[]' "$wordlist_file")"; then
  echo "ERROR: unknown framing mode '$mode' (expected: $known_modes)" >&2
  echo "  See $wordlist_file for the canonical mode list." >&2
  exit 2
fi

# Load wordlist for this mode from the YAML file.
# yq v4 prints array entries one per line; empty arrays print nothing.
mapfile -t words < <(yq ".modes.\"$mode\".forbidden[]" "$wordlist_file")

if [[ ${#words[@]} -eq 0 ]]; then
  exit 0
fi

# Strip lines with exemption marker before scanning.
filtered=$(grep -v '<!--[[:space:]]*allow-forbidden' "$file" || true)

violations=""
for word in "${words[@]}"; do
  [[ -z "$word" ]] && continue
  hits=$(printf '%s\n' "$filtered" | grep -inE "$word" || true)
  if [[ -n "$hits" ]]; then
    violations+="  [$word]:"$'\n'
    violations+=$(printf '%s\n' "$hits" | sed 's/^/    /')$'\n'
  fi
done

if [[ -n "$violations" ]]; then
  echo "ERROR: forbidden words for framing mode '$mode' in $file:" >&2
  printf '%s' "$violations" >&2
  echo "  (to allow a specific line, append '<!-- allow-forbidden -->' to it)" >&2
  echo "  Wordlist: $wordlist_file" >&2
  exit 1
fi

exit 0
