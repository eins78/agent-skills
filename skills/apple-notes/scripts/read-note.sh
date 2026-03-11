#!/bin/bash
set -euo pipefail

# Read an Apple Note by name
# Usage: read-note.sh <note-name> [account]
#   note-name: Name of the note to read (required)
#   account:   Account name (default: searches all accounts)

NOTE_NAME="${1:-}"
ACCOUNT="${2:-}"

show_help() {
  echo "Usage: $(basename "$0") <note-name> [account]"
  echo ""
  echo "Read a note's content by name. Returns HTML body."
  echo ""
  echo "Arguments:"
  echo "  note-name   Name of the note (required, case-sensitive)"
  echo "  account     Account name (default: searches all accounts)"
  echo ""
  echo "Examples:"
  echo "  $(basename "$0") 'Shopping List'"
  echo "  $(basename "$0") 'Meeting Notes' 'iCloud'"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_help
  exit 0
fi

if [[ -z "$NOTE_NAME" ]]; then
  echo "Error: note name is required" >&2
  echo "" >&2
  show_help >&2
  exit 1
fi

if [[ -n "$ACCOUNT" ]]; then
  osascript <<EOF
tell application "Notes"
  repeat with f in every folder of account "$ACCOUNT"
    try
      set n to note "$NOTE_NAME" of f
      return "Name: " & name of n & "\nAccount: $ACCOUNT" & "\nFolder: " & (name of f) & "\nModified: " & (modification date of n as string) & "\n\n" & body of n
    end try
  end repeat
  error "Note not found: $NOTE_NAME (in account $ACCOUNT)"
end tell
EOF
else
  osascript <<EOF
tell application "Notes"
  repeat with a in every account
    repeat with f in every folder of a
      try
        set n to note "$NOTE_NAME" of f
        return "Name: " & name of n & "\nAccount: " & (name of a) & "\nFolder: " & (name of f) & "\nModified: " & (modification date of n as string) & "\n\n" & body of n
      end try
    end repeat
  end repeat
  error "Note not found: $NOTE_NAME"
end tell
EOF
fi
