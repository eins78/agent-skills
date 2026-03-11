#!/bin/bash
set -euo pipefail

# List Apple Notes in a folder
# Usage: list-notes.sh [folder] [account]
#   folder:  Folder name (default: "Notes")
#   account: Account name (default: "iCloud")

FOLDER="${1:-Notes}"
ACCOUNT="${2:-iCloud}"

show_help() {
  echo "Usage: $(basename "$0") [folder] [account]"
  echo ""
  echo "List all notes in a folder."
  echo ""
  echo "Arguments:"
  echo "  folder    Folder name (default: 'Notes')"
  echo "  account   Account name (default: 'iCloud')"
  echo ""
  echo "Examples:"
  echo "  $(basename "$0")                      # Notes in iCloud/Notes"
  echo "  $(basename "$0") 'Shopping'            # Notes in iCloud/Shopping"
  echo "  $(basename "$0") 'Notes' 'Gmail'       # Notes in Gmail/Notes"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_help
  exit 0
fi

osascript <<EOF
tell application "Notes"
  set noteList to every note in folder "$FOLDER" of account "$ACCOUNT"
  repeat with n in noteList
    set noteName to name of n
    set modDate to modification date of n
    log noteName & " | " & (modDate as string)
  end repeat
end tell
EOF
