# Apple Notes Skill

Developer documentation for the Apple Notes read-only skill.

## Purpose

Read-only access to Apple Notes via AppleScript. Enables Claude Code to list, read, and search notes without any third-party dependencies.

## Tier

**Project-specific** — requires macOS with Notes.app. Not portable to Linux/Windows.

## Architecture

Uses AppleScript via `osascript` to interact with Notes.app.

### Why AppleScript?

| Approach | Pros | Cons |
|----------|------|------|
| **AppleScript** (chosen) | Zero dependencies, full Notes access, fast | Verbose syntax, requires Notes.app running |
| **memo CLI** | Simpler text interface | Extra Homebrew dependency, slower, limited formatting |
| **Shortcuts.app** | Permissions already granted | No structured output, hard to parse results |

## Skill Structure

```
apple-notes/
├── SKILL.md              # User-facing skill reference
├── README.md             # This file
└── scripts/
    ├── list-folders.sh   # List folders (optionally by account)
    ├── list-notes.sh     # List notes in a folder
    ├── read-note.sh      # Read a note by name (HTML body)
    └── search-notes.sh   # Search notes by keyword
```

## Origin

Extracted from [clawd-workspace TOOLS.md](https://github.com/eins78/clawd-workspace) Apple Notes section, adapted as a standalone skill.

## Dependencies

- macOS with Notes.app
- Automation permissions for the calling terminal app

## Limitations

- **Read only** — cannot create, update, or delete notes
- **Requires Notes.app** — must be running and synced
- **HTML output** — note bodies come back as HTML, not plain text
- **Permission dialogs** — first access may trigger macOS permission prompt
- **Performance** — searching all notes across accounts can be slow

## Testing

```bash
# Verify Notes.app is accessible
osascript -e 'tell application "Notes" to count every note'

# Test each script
./scripts/list-folders.sh
./scripts/list-notes.sh
./scripts/read-note.sh "some known note name"
./scripts/search-notes.sh "test"
```
