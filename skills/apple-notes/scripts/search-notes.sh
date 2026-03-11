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
  osascript - "$ACCOUNT" "$KEYWORD" <<'EOF'
on run argv
  set accountName to item 1 of argv
  set theKeyword to item 2 of argv
  tell application "Notes"
    set resultCount to 0
    repeat with f in every folder of account accountName
      set folderName to name of f
      set matches to every note of f whose name contains theKeyword
      repeat with n in matches
        log (name of n) & " | " & accountName & "/" & folderName & " | " & (modification date of n as string)
        set resultCount to resultCount + 1
      end repeat
    end repeat
    log resultCount & " note(s) found"
  end tell
end run
EOF
else
  osascript - "$KEYWORD" <<'EOF'
on run argv
  set theKeyword to item 1 of argv
  tell application "Notes"
    set resultCount to 0
    repeat with a in every account
      set acctName to name of a
      repeat with f in every folder of a
        set folderName to name of f
        set matches to every note of f whose name contains theKeyword
        repeat with n in matches
          log (name of n) & " | " & acctName & "/" & folderName & " | " & (modification date of n as string)
          set resultCount to resultCount + 1
        end repeat
      end repeat
    end repeat
    log resultCount & " note(s) found"
  end tell
end run
EOF
fi
