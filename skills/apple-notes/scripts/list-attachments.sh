#!/bin/bash
set -euo pipefail

# List the attachments on an Apple Note, with identifying text and file paths.
#
# Why this exists: a note's *body* does not contain its attachments. They are
# separate rows in the Notes database, so reading the body — via AppleScript or
# any other route — cannot see them. A PDF, scan or image on a note is invisible
# to every other script in this skill.
#
# Usage: list-attachments.sh <note-title-substring> [--paths]

NOTE="${1:-}"
WANT_PATHS=0
[[ "${2:-}" == "--paths" ]] && WANT_PATHS=1

GROUP="$HOME/Library/Group Containers/group.com.apple.notes"
DB="$GROUP/NoteStore.sqlite"

show_help() {
  echo "Usage: $(basename "$0") <note-title-substring> [--paths]"
  echo ""
  echo "List attachments on every note whose title contains the given text."
  echo ""
  echo "Output columns:"
  echo "  type | title | identifying text"
  echo ""
  echo "'identifying text' is the attachment's OCR/summary text — the only way to"
  echo "tell scanned PDFs apart, since Notes titles every one of them literally"
  echo "'PDF' with no filename."
  echo ""
  echo "Options:"
  echo "  --paths   Also print the on-disk file path for each attachment"
  echo ""
  echo "Examples:"
  echo "  $(basename "$0") 'Recipe Ideas'"
  echo "  $(basename "$0") 'Recipe Ideas' --paths"
}

if [[ -z "$NOTE" || "$NOTE" == "--help" || "$NOTE" == "-h" ]]; then
  show_help
  exit 0
fi

if [[ ! -f "$DB" ]]; then
  echo "ERROR: Notes database not found at $DB" >&2
  exit 1
fi

# Read from a snapshot: the live DB is in WAL mode and Notes.app holds it open.
# VACUUM INTO is the only copy method that both captures WAL content and reopens
# read-only (a plain cp keeps journal_mode=wal and then refuses -readonly,
# because it cannot create the -shm sidecar).
SNAP="$(mktemp -t notes-attach).sqlite"
trap 'rm -f "$SNAP"' EXIT
if ! sqlite3 "file:$DB?mode=ro" "VACUUM INTO '$SNAP'" 2>/dev/null; then
  echo "ERROR: could not read the Notes database." >&2
  echo "This usually means the terminal lacks Full Disk Access" >&2
  echo "(System Settings -> Privacy & Security -> Full Disk Access)." >&2
  exit 1
fi

FOUND=$(sqlite3 "$SNAP" "
  select count(*)
  from ZICCLOUDSYNCINGOBJECT n
  where n.ZTITLE1 like '%$(printf '%s' "$NOTE" | sed "s/'/''/g")%'
    and n.ZTITLE1 is not null;")

if [[ "$FOUND" == "0" ]]; then
  echo "No note matching '$NOTE'." >&2
  exit 1
fi

sqlite3 -separator ' | ' "$SNAP" "
  select
    n.ZTITLE1,
    replace(a.ZTYPEUTI, 'com.apple.', ''),
    coalesce(a.ZTITLE, '(untitled)'),
    replace(
      substr(trim(coalesce(nullif(a.ZOCRSUMMARY,''), nullif(a.ZSUMMARY,''), '')), 1, 70),
      char(10), ' / '),
    coalesce(a.ZIDENTIFIER, ''),
    coalesce(a.ZFALLBACKPDFGENERATION, ''),
    coalesce(m.ZIDENTIFIER, ''),
    coalesce(m.ZFILENAME, '')
  from ZICCLOUDSYNCINGOBJECT a
  join ZICCLOUDSYNCINGOBJECT n on a.ZNOTE = n.Z_PK
  left join ZICCLOUDSYNCINGOBJECT m on a.ZMEDIA = m.Z_PK
  where n.ZTITLE1 like '%$(printf '%s' "$NOTE" | sed "s/'/''/g")%'
  order by n.ZTITLE1, a.ZTYPEUTI, a.Z_PK;
" | while IFS='|' read -r note uti title summary ident gen mident mfile; do
  note="${note# }"; note="${note% }"
  uti="${uti# }"; uti="${uti% }"
  title="${title# }"; title="${title% }"
  summary="${summary# }"; summary="${summary% }"
  ident="${ident# }"; ident="${ident% }"
  gen="${gen# }"; gen="${gen% }"
  mident="${mident# }"; mident="${mident% }"
  mfile="${mfile# }"; mfile="${mfile% }"

  printf '%s\n' "[$note] $uti | $title${summary:+ | $summary}"

  if [[ $WANT_PATHS -eq 1 && -n "$ident" ]]; then
    # Scanned documents render to a generated PDF under FallbackPDFs.
    p=""
    if [[ -n "$gen" ]]; then
      for cand in "$GROUP/Accounts"/*/FallbackPDFs/"$ident"/"$gen"/FallbackPDF.pdf; do
        [[ -f "$cand" ]] && { p="$cand"; break; }
      done
    fi
    # Real file attachments (images, ordinary PDFs) live under Media — but keyed
    # by the *linked media row's* identifier, not the attachment's, and the real
    # filename is on that row too. The attachment row's own ZFILENAME is null.
    if [[ -z "$p" && -n "$mident" && -n "$mfile" ]]; then
      for cand in "$GROUP/Accounts"/*/Media/"$mident"/"$mfile"; do
        [[ -f "$cand" ]] && { p="$cand"; break; }
      done
    fi
    printf '    %s\n' "${p:-(no file on disk — may not have synced down yet)}"
  fi
done
