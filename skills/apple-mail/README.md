# Apple Mail Skill

Developer documentation for the Apple Mail read-only skill.

## Purpose

Project-specific skill for reading email via Mail.app AppleScript integration.

## Tier

**Project-specific** — relies on macOS Mail.app and personal account configuration.

## Architecture

Two access paths, chosen by workload:

- **AppleScript via `osascript`** — live state (unread counts, recent inbox, account
  and mailbox names) and attachment extraction. Nothing else exposes Mail's live
  view, or its decoded attachments, without third-party dependencies.
- **`ripgrep` over the `.emlx` files** — archive search. Mail stores every message
  as a file under `~/Library/Mail/`, so the archive is greppable directly.

They are complementary rather than alternatives: the archive path *locates* a
message across a large store, and the AppleScript path *acts* on it once found.

### Why not one path for everything?

| Approach | Pros | Cons |
|----------|------|------|
| **AppleScript** (live queries, attachments) | Zero dependencies, full Mail.app access, sees live state, only path that extracts attachments | Verbose, requires Mail.app running, bridge hangs intermittently, cross-account search degrades badly with account count, `tell`-block terminology collisions |
| **ripgrep over `.emlx`** (archive search) | Fast over the whole archive, no Mail.app, no hangs | Needs Full Disk Access; on-disk only; cannot extract attachments, and attachment text is base64 so it never matches |
| **Spotlight / `mdfind`** | Would be instant | **Does not work** — `~/Library/Mail` is not indexed; every query returns 0 |
| **IMAP direct** | Works headless, more portable | Requires credentials, no unified inbox |
| **mailutil CLI** | Simpler syntax | Limited functionality |

`mdfind` is listed because its failure is silent: 0 results is indistinguishable
from a true negative unless you already know the store is unindexed. That
misreading is the bug this path exists to prevent.

## Skill Structure

```
apple-mail/
├── SKILL.md              # User-facing skill reference
├── README.md             # This file
├── scripts/
│   └── emlx.py           # .emlx parser: `list` (triage TSV) and `show` (one message)
└── tests/
    └── test-emlx.sh      # Smoke test against a synthetic fixture
```

### Why a parser instead of a shell pipeline

Raw `grep` finds the right files but cannot report them. Measured against a real
multi-account store on the authoring machine: ~24% of `Subject:` headers are
MIME-encoded (`=?UTF-8?B?...?=`) and ~20% are folded onto continuation lines, so a
`grep -m1 '^Subject:' | cut -c10-` pipeline is wrong for roughly a third of
messages. `email.policy.default` handles encoding, folding, charsets, and
transfer-encoding in one step.

## Origin

Extracted from [clawd-workspace TOOLS.md](https://github.com/eins78/clawd-workspace/blob/main/TOOLS.md#apple-mail-tachikoma-vm), adapted for direct macOS use (not VM-based).

The archive-search path comes from
[issue #69](https://github.com/eins78/agent-skills/issues/69): Spotlight returned 0
on a large multi-account store and AppleScript cross-account search was unusable at
that scale. The reported recipes were re-verified before being documented, and
corrected where measurement disagreed — see Testing.

## Dependencies

- macOS with Mail.app (AppleScript path)
- Automation permissions for the calling terminal app (AppleScript path)
- **Full Disk Access** for the calling terminal app (archive-search path)
- `ripgrep` and Python 3 (archive-search path; Python 3 is stdlib-only)

## Limitations

- **Read only** — cannot send, delete, or modify emails
- **Requires Mail.app** — must be running and logged in (AppleScript path only)
- **Permission dialogs** — first access may trigger macOS permission prompt
- **Spotlight is unavailable** — `~/Library/Mail` is not indexed; `mdfind` silently
  returns 0 for every query
- **Full Disk Access failures are silent** — without it, `rg` returns 0 results
  rather than an error, especially with `--no-messages`
- **Attachment text is unsearchable locally** — base64 in full messages, absent
  entirely from `.partial.emlx`; extract via the AppleScript `Save attachments`
  recipe first
- **Performance** — AppleScript search across many accounts is impractical; use the
  archive path

## Testing

```bash
# Parser smoke test — synthetic fixture, touches no real mail
bash skills/apple-mail/tests/test-emlx.sh

# Verify Mail.app is accessible
osascript -e 'tell application "Mail" to get name of every account'

# Verify inbox access
osascript -e 'tell application "Mail" to count messages of inbox'

# Verify attachment listing (pick a subject you know has an attachment)
osascript -e 'tell application "Mail"
  set msg to item 1 of (messages of inbox whose subject contains "invoice")
  repeat with a in (mail attachments of msg)
    log (name of a)
  end repeat
end tell'

# Verify archive access (0 means no Full Disk Access, not an empty archive)
rg --files ~/Library/Mail -g '*.emlx' | wc -l
```

The attachment commands added in 1.1.0 were verified end-to-end against a real
mailbox: listing, saving four attachments across four messages via the `my
posixTarget(…)` handler, and byte-size comparison against the originals. The two
gotchas were confirmed by reproducing each failure and its fix.

`tests/test-emlx.sh` builds an `.emlx` fixture exercising a MIME-encoded subject, a
folded header, quoted-printable body, and a stubbed attachment part, then asserts
`emlx.py` decodes each. It is not run by `pnpm test`.

### Validation of the issue #69 recipes

Verified against a real multi-account store (7 accounts, ~116k `.emlx`, 1.8 GB) on
the authoring machine — a different and smaller store than the reporter's:

| Claim | Result |
|-------|--------|
| `mdfind -onlyin ~/Library/Mail` returns 0 | **Confirmed** — 0 for every term tried, while `mdutil -s /` reports indexing enabled and `kMDItemTextContent` is `(null)` |
| `rg` over `.emlx` is fast | **Confirmed** — full-archive search in ~3s |
| `-g '*.emlx'` covers `*.partial.emlx` | **Confirmed** — no extra glob needed |
| Subjects come back MIME-encoded from raw grep | **Confirmed** — ~24% of messages |
| Partials "may lack the body" | **Corrected** — text bodies are intact; only attachment parts are stubbed (empty payload + `X-Apple-Content-Length`) |
| Shell `grep`/`cut` header triage | **Replaced** — truncates ~20% folded subjects, does not decode, and `sort -u` orders dates lexicographically |
| Search path `~/Library/Mail/V10` | **Broadened** to `~/Library/Mail` — version dirs change across macOS releases |

## Known Gaps

- **Terminology collisions are only partly enumerated.** The reserved-word list in
  SKILL.md was found by probing common identifiers, not by reading Mail's `.sdef`.
  Generating the full list from the dictionary would be more reliable.
- **No write operations by design** — see Limitations.
- **Attachment *contents* are not searchable.** The archive path cannot see inside
  attachments (base64 when present, absent from `.partial.emlx`); extracting them
  is an AppleScript-path job.

## Future Improvements

- Script for structured JSON output from mail queries
- Mailbox-specific search helpers
- Unread count per account
- Helper script for bulk attachment extraction with name sanitization
- Optional attachment-text extraction (would need `pdftotext` and friends)
