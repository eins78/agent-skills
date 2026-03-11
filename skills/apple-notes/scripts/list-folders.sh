#!/bin/bash
set -euo pipefail

# List Apple Notes folders
# Usage: list-folders.sh [account]
#   account: Notes account name (default: lists all accounts)

ACCOUNT="${1:-}"

show_help() {
  echo "Usage: $(basename "$0") [account]"
  echo ""
  echo "List all folders in Apple Notes."
  echo ""
  echo "Arguments:"
  echo "  account   Notes account name (e.g., 'iCloud'). If omitted, lists all accounts."
  echo ""
  echo "Examples:"
  echo "  $(basename "$0")           # All folders across all accounts"
  echo "  $(basename "$0") iCloud    # Only iCloud folders"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_help
  exit 0
fi

if [[ -n "$ACCOUNT" ]]; then
  osascript - "$ACCOUNT" <<'EOF'
on run argv
  set accountName to item 1 of argv
  tell application "Notes"
    set folderNames to name of every folder of account accountName
    repeat with f in folderNames
      log f
    end repeat
  end tell
end run
EOF
else
  osascript <<'EOF'
tell application "Notes"
  set accts to every account
  repeat with a in accts
    set acctName to name of a
    set folderNames to name of every folder of a
    repeat with f in folderNames
      log acctName & " / " & f
    end repeat
  end repeat
end tell
EOF
fi
