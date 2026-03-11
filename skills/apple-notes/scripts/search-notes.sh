#!/bin/bash
set -euo pipefail

# Search Apple Notes by keyword
# Usage: search-notes.sh <keyword> [account]
#   keyword: Search term (searches note names, case-insensitive)
#   account: Account name (default: searches all accounts)

KEYWORD="${1:-}"
ACCOUNT="${2:-}"

show_help() {
  echo "Usage: $(basename "$0") <keyword> [account]"
  echo ""
  echo "Search notes by keyword in note names."
  echo ""
  echo "Arguments:"
  echo "  keyword   Search term (required, case-insensitive)"
  echo "  account   Account name (default: searches all accounts)"
  echo ""
  echo "Examples:"
  echo "  $(basename "$0") 'shopping'"
  echo "  $(basename "$0") 'recipe' 'iCloud'"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_help
  exit 0
fi

if [[ -z "$KEYWORD" ]]; then
  echo "Error: keyword is required" >&2
  echo "" >&2
  show_help >&2
  exit 1
fi

if [[ -n "$ACCOUNT" ]]; then
  osascript <<EOF
tell application "Notes"
  set matches to every note of account "$ACCOUNT" whose name contains "$KEYWORD"
  repeat with n in matches
    try
      set folderName to name of container of n
      log (name of n) & " | " & folderName & " | " & (modification date of n as string)
    end try
  end repeat
  log (count of matches) & " note(s) found"
end tell
EOF
else
  osascript <<EOF
tell application "Notes"
  set totalCount to 0
  repeat with a in every account
    set acctName to name of a
    set matches to every note of a whose name contains "$KEYWORD"
    repeat with n in matches
      try
        set folderName to name of container of n
        log (name of n) & " | " & acctName & "/" & folderName & " | " & (modification date of n as string)
      end try
    end repeat
    set totalCount to totalCount + (count of matches)
  end repeat
  log totalCount & " note(s) found"
end tell
EOF
fi
