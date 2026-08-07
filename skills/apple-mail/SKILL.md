---
name: apple-mail
description: Read email via Apple Mail.app and AppleScript. Use when asked to check, search, or read emails. READ ONLY — no sending or modifying emails.
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "1.0.0"
---

# Apple Mail (Read Only)

Read email via Mail.app AppleScript. **No sending or modifying emails.**

## Prerequisites

- Mail.app running and logged in
- Automation permissions granted (System Settings → Privacy & Security → Automation → Terminal/Claude Code → Mail)
- If first access attempt times out, ask user to check for macOS permission dialog

## Reliability: always wrap osascript with timeout + retry

Apple Mail's AppleScript bridge hangs intermittently — sometimes for minutes — even on simple queries. The AppleScript-internal `with timeout of N seconds` does NOT kill a wedged osascript process. **Always wrap calls with shell-level `timeout` and retry on failure.**

Pattern:

```bash
# Run osascript with 15s shell timeout, retry up to 3 times with 2s backoff.
mail_query() {
  local script="$1" attempt
  for attempt in 1 2 3; do
    result=$(timeout 15 osascript -e "$script" 2>&1) && { echo "$result"; return 0; }
    sleep 2
  done
  echo "ERROR: Mail query failed after 3 attempts" >&2
  return 1
}

# Usage:
mail_query 'tell application "Mail" to count (messages of inbox whose read status is false)'
```

Reasonable defaults: **15s timeout, 3 retries, 2s sleep**. Bump the timeout for `messages of every mailbox` (cross-account searches) to 60s. If all 3 retries fail, report the failure and move on — never block a briefing on Mail.

## Account & Machine Context

See `docs/email-accounts.md` for which accounts are configured on which machines.

## Commands

### List accounts

```bash
osascript -e 'tell application "Mail" to get name of every account'
```

### Count unread messages

```bash
osascript -e 'tell application "Mail" to count (messages of inbox whose read status is false)'
```

### Recent inbox messages (last 10)

```bash
osascript -e 'tell application "Mail"
  set recentMsgs to messages 1 thru 10 of inbox
  repeat with msg in recentMsgs
    set msgInfo to "From: " & (sender of msg) & " | Subject: " & (subject of msg) & " | Date: " & (date sent of msg)
    log msgInfo
  end repeat
end tell'
```

### Get message content by index

```bash
osascript -e 'tell application "Mail"
  set msg to message 1 of inbox
  return "From: " & (sender of msg) & "\nSubject: " & (subject of msg) & "\nDate: " & (date sent of msg) & "\n\n" & (content of msg)
end tell'
```

### Search messages by subject

```bash
osascript -e 'tell application "Mail"
  set foundMsgs to (messages of inbox whose subject contains "keyword")
  count foundMsgs
end tell'
```

### Search and read first match

```bash
osascript -e 'tell application "Mail"
  set foundMsgs to (messages of inbox whose subject contains "keyword")
  if (count foundMsgs) > 0 then
    set msg to item 1 of foundMsgs
    return "From: " & (sender of msg) & "\nSubject: " & (subject of msg) & "\nDate: " & (date sent of msg) & "\n\n" & (content of msg)
  else
    return "No messages found"
  end if
end tell'
```

### Search across all mailboxes

```bash
osascript -e 'tell application "Mail"
  set foundMsgs to (messages of every mailbox of every account whose subject contains "keyword")
  -- Note: this can be slow across many accounts
end tell'
```

### List mailboxes for an account

```bash
osascript -e 'tell application "Mail" to get name of every mailbox of account "Gmail"'
```

### List attachments

```bash
osascript -e 'tell application "Mail"
  set msg to item 1 of (messages of inbox whose subject contains "invoice")
  set out to ""
  repeat with a in (mail attachments of msg)
    set out to out & (name of a) & " [" & (file size of a) & " bytes]" & linefeed
  end repeat
  return out
end tell'
```

### Save attachments

Build the file target **outside** the `tell` block — via a handler called with `my`, so it still works inside a loop:

```bash
osascript <<'EOF'
on posixTarget(p)
  return POSIX file p
end posixTarget

set outDir to "/tmp/attachments/"   -- must already exist
tell application "Mail"
  repeat with m in (messages of inbox whose subject contains "invoice")
    repeat with a in (mail attachments of m)
      save a in (my posixTarget(outDir & (name of a)))
    end repeat
  end repeat
end tell
EOF
```

`outDir` must already exist — `save` into a missing directory fails with the uninformative `-10000 AppleEvent handler failed`, which says nothing about the path. `mkdir -p` first.

Attachment names often contain `:` (e.g. `SOA-2026-08-02-12:20:06.xlsx`). It saves fine, but Finder and many tools render it as `/` — sanitize with `text item delimiters` if the name is going anywhere else.

Fallback: `source of msg` returns the raw MIME, so Python's `email` module can extract parts without AppleScript at all. Useful when a mailbox is wedged or names need heavy cleanup.

## Gotchas inside `tell application "Mail"`

Both of these have one root cause: **unqualified terms resolve against Mail's dictionary, not AppleScript's.**

**1. `POSIX file` fails.** Written inside the block it errors `-1728 Can't get POSIX file "…"` — Mail tries to resolve it as one of its own objects. Coerce outside the block or via `my` (see above). Note the error names the path, so it reads like a missing-file problem; it isn't.

**2. Ordinary variable names are reserved.** These all fail inside the block, with `-10003`, `-10006`, or the unguessable `Can't set «constant ldaslsba» to …`:

`base` · `name` · `subject` · `content` · `file` · `path` · `index` · `size` · `date` · `text` · `character`

Prefix them — `basePath`, `msgSubject`, `outFile`. The failure is a *syntax* error at compile time for some (`base`, `file`, `date`, `text`, `character`) and a *runtime* error for others (`name`, `subject`, `content`, `index`, `size`), so a script can parse cleanly and still blow up mid-loop.

## Notes

- AppleScript `messages of inbox` returns a unified inbox across all accounts
- Messages are indexed newest-first (message 1 = most recent)
- `content of msg` returns plain text body; `source of msg` returns raw MIME
- Large mailboxes can be slow — use `whose` clauses to filter
- Timeout: use `with timeout of 60 seconds` for slow queries

## Self-Improvement

If you encounter an AppleScript pattern that fails, a macOS behavior change, or missing guidance in this skill, don't just work around it — fix the skill:

1. **Create a PR** from a fresh worktree of `https://github.com/eins78/agent-skills` on a new branch, fixing the issue directly
2. **Or file an issue** on `https://github.com/eins78/agent-skills` with: what failed, the actual behavior, and the suggested fix

Never silently work around a skill gap. The fix benefits all future sessions.
