# Apple Notes Skill

Developer documentation for the Apple Notes read-only skill.

## Purpose

Read-only access to Apple Notes via AppleScript. Enables Claude Code to list, read, and search notes without any third-party dependencies.

## Tier

**Project-specific** — requires macOS with Notes.app. Not portable to Linux/Windows.

## Architecture

Two access paths, deliberately:

| Path | Used by | Needs |
|---|---|---|
| AppleScript via `osascript` | `list-folders`, `list-notes`, `read-note`, `search-notes` | Automation permission |
| Direct SQLite read of `NoteStore.sqlite` | `list-attachments` | Full Disk Access |

### Why AppleScript?

| Approach | Pros | Cons |
|----------|------|------|
| **AppleScript** (chosen) | Zero dependencies, full Notes access, fast | Verbose syntax, requires Notes.app running |
| **memo CLI** | Simpler text interface | Extra Homebrew dependency, slower, limited formatting |
| **Shortcuts.app** | Permissions already granted | No structured output, hard to parse results |

### Why SQLite for attachments?

AppleScript was tried first and **wedged**: `get name of every attachment of
note "…"` hung indefinitely, and a shell-level `timeout 30` did *not* kill it
(the process survived `SIGTERM` while blocked on the Apple Event). That is the
same bridge instability this skill already warns about, but here it is not
recoverable by retry, so the attachment path deliberately avoids the bridge.

The database also turns out to be strictly better for the job:

- `ZOCRSUMMARY` already holds the recognised text of every scanned attachment,
  so identifying a scan is a column read rather than a PDF text extraction
  (measured: 55 of 55 scanned attachments had it populated).
- It resolves on-disk paths, which AppleScript does not expose usefully.
- It keeps working while the AppleScript bridge is hung.

Reads go through `VACUUM INTO` to a temp snapshot. The live database is WAL-mode
and held open by Notes.app; a plain `cp` keeps `journal_mode=wal` and then
refuses a read-only open because it cannot create the `-shm` sidecar.

## Skill Structure

```
apple-notes/
├── SKILL.md              # User-facing skill reference
├── README.md             # This file
└── scripts/
    ├── list-folders.sh     # List folders (optionally by account)
    ├── list-notes.sh       # List notes in a folder
    ├── read-note.sh        # Read a note by name (HTML body)
    ├── search-notes.sh     # Search notes by keyword
    └── list-attachments.sh # List a note's attachments (SQLite, not AppleScript)
```

## Origin

Extracted from [clawd-workspace TOOLS.md](https://github.com/eins78/clawd-workspace) Apple Notes section, adapted as a standalone skill.

`list-attachments.sh` was added after a real failure: an agent was asked to fetch
a named PDF from a note, searched the note's *body*, found nothing, concluded the
document did not exist, and used a similar-looking PDF from a different note
instead. The result was internally consistent and wrongly sourced — the hardest
kind of wrong to notice downstream. The note did have the PDF; it was one of four
attachments all titled `PDF`.

## Dependencies

- macOS with Notes.app
- Automation permissions for the calling terminal app (AppleScript scripts)
- Full Disk Access for the calling terminal app (`list-attachments.sh`)
- `sqlite3` — stock macOS
- `pdftotext` (poppler) or similar, only to read an attachment's full contents

## Limitations

- **Read only** — cannot create, update, or delete notes
- **Requires Notes.app** — must be running and synced
- **HTML output** — note bodies come back as HTML, not plain text
- **Permission dialogs** — first access may trigger macOS permission prompt
- **Performance** — searching all notes across accounts can be slow
- **Attachment listing is schema-coupled.** It reads `ZICCLOUDSYNCINGOBJECT`
  directly, so a macOS release could rename columns. If it returns nothing for a
  note that visibly has attachments, check the schema before assuming the note is
  empty — the whole point of the script is not to conclude "absent" from a failed
  lookup.
- **Attachment *contents* are not searched.** The script surfaces each
  attachment's OCR/summary text, which is the first part of the document, not all
  of it. To search inside, resolve the path with `--paths` and extract.

## Testing

```bash
# Verify Notes.app is accessible
osascript -e 'tell application "Notes" to count every note'

# Test each script
./scripts/list-folders.sh
./scripts/list-notes.sh
./scripts/read-note.sh "some known note name"
./scripts/search-notes.sh "test"

# Attachments — needs Full Disk Access, not Automation
./scripts/list-attachments.sh "some note with a PDF"
./scripts/list-attachments.sh "some note with a PDF" --paths
./scripts/list-attachments.sh "no-such-note-xyz"   # expect exit 1, message on stderr
```

Verify both path branches, since they resolve differently: a note with a
**scanned** document (`FallbackPDFs/…`) and a note with an **image or
file-picker attachment** (`Media/…`). A regression in the `Media` join shows up
as a silently missing path, not an error.
