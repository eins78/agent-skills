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
  osascript - "$NOTE_NAME" "$ACCOUNT" <<'EOF'
on run argv
  set noteName to item 1 of argv
  set accountName to item 2 of argv
  tell application "Notes"
    repeat with f in every folder of account accountName
      try
        set n to note noteName of f
        return "Name: " & name of n & "\nAccount: " & accountName & "\nFolder: " & (name of f) & "\nModified: " & (modification date of n as string) & "\n\n" & body of n
      end try
    end repeat
    error "Note not found: " & noteName & " (in account " & accountName & ")"
  end tell
end run
EOF
else
  osascript - "$NOTE_NAME" <<'EOF'
on run argv
  set noteName to item 1 of argv
  tell application "Notes"
    repeat with a in every account
      repeat with f in every folder of a
        try
          set n to note noteName of f
          return "Name: " & name of n & "\nAccount: " & (name of a) & "\nFolder: " & (name of f) & "\nModified: " & (modification date of n as string) & "\n\n" & body of n
        end try
      end repeat
    end repeat
    error "Note not found: " & noteName
  end tell
end run
EOF
fi
