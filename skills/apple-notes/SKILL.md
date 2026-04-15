---
name: apple-notes
description: Read Apple Notes via AppleScript. Use when asked to check, search, or read notes. READ ONLY — no creating or modifying notes.
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "1.0.0"
---

# Apple Notes (Read Only)

Read notes via Notes.app AppleScript. **No creating, updating, or deleting notes.**

## Prerequisites

- Notes.app running and synced
- Automation permissions granted (System Settings → Privacy & Security → Automation → Terminal/Claude Code → Notes)
- If first access attempt times out, ask user to check for macOS permission dialog

## Reliability: always wrap osascript with timeout + retry

Notes.app's AppleScript bridge hangs intermittently. AppleScript-internal `with timeout of N seconds` does NOT kill a wedged osascript process — wrap with shell-level `timeout` and retry.

```bash
notes_query() {
  local script="$1" attempt
  for attempt in 1 2 3; do
    result=$(timeout 15 osascript -e "$script" 2>&1) && { echo "$result"; return 0; }
    sleep 2
  done
  echo "ERROR: Notes query failed after 3 attempts" >&2
  return 1
}
```

Reasonable defaults: **15s timeout, 3 retries, 2s sleep**. Bump to 30s for full-text search across many notes. If all retries fail, report and move on.

## Scripts

### List folders

```bash
${CLAUDE_SKILL_DIR}/scripts/list-folders.sh              # All folders across all accounts
${CLAUDE_SKILL_DIR}/scripts/list-folders.sh iCloud       # Only iCloud folders
```

### List notes in a folder

```bash
${CLAUDE_SKILL_DIR}/scripts/list-notes.sh                        # iCloud/Notes (default)
${CLAUDE_SKILL_DIR}/scripts/list-notes.sh "Shopping"             # iCloud/Shopping
${CLAUDE_SKILL_DIR}/scripts/list-notes.sh "Notes" "Gmail"        # Gmail/Notes
```

Output: `note name | modification date` (one per line)

### Read a note

```bash
${CLAUDE_SKILL_DIR}/scripts/read-note.sh "Shopping List"             # Search all accounts
${CLAUDE_SKILL_DIR}/scripts/read-note.sh "Meeting Notes" "iCloud"    # Specific account
```

Returns metadata header + HTML body.

### Search notes by name

```bash
${CLAUDE_SKILL_DIR}/scripts/search-notes.sh "recipe"                 # Search all accounts
${CLAUDE_SKILL_DIR}/scripts/search-notes.sh "recipe" "iCloud"        # Specific account
```

Output: `note name | account/folder | modification date` (one per line)

## Direct Commands

For quick one-off access without scripts:

```bash
# List all iCloud folders
osascript -e 'tell application "Notes" to get name of every folder of account "iCloud"'

# List all note names in a folder
osascript -e 'tell application "Notes" to get name of every note in folder "Notes" of account "iCloud"'

# Read a note body (returns HTML)
osascript -e 'tell application "Notes" to get body of note "Note Name"'

# Count all notes
osascript -e 'tell application "Notes" to count every note'
```

## Notes

- Note bodies are returned as **HTML** — use for display or pipe through a converter for plain text
- Note names are **case-sensitive** in AppleScript queries
- Searching large numbers of notes can be slow — scope to a specific account when possible
- The `whose name contains` filter is case-insensitive
- Notes.app must be running — scripts will launch it if needed, but sync may take a moment
