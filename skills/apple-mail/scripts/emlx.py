#!/usr/bin/env python3
"""Read Apple Mail .emlx files: decoded headers for triage, or one full message.

An .emlx file is a byte-count line, then the RFC822 message, then an XML plist
trailer. Parsing it with the stdlib email package (policy=default) decodes
MIME-encoded headers (=?UTF-8?B?...?=) and transfer-encoded bodies, which raw
grep cannot do.

Usage:
  emlx.py list [FILE...]     # TSV: date, from, subject, flags, path (stdin if no FILE)
  emlx.py show FILE          # decoded headers + best-available body

Read only: never writes to or modifies the Mail store.
"""

import email
import email.policy
import sys
from datetime import timezone
from email.utils import parsedate_to_datetime

# Mail stubs out MIME parts it has not downloaded: the part keeps its headers
# and carries this one, but its payload is empty. Only attachments, in practice.
STUB_HEADER = "X-Apple-Content-Length"


def parse(path):
    """Return the parsed message from an .emlx file, or None if unreadable."""
    try:
        with open(path, "rb") as fh:
            raw = fh.read()
    except OSError as exc:
        print(f"{path}: {exc}", file=sys.stderr)
        return None
    try:
        nl = raw.index(b"\n")
        length = int(raw[:nl].strip())
    except ValueError:
        # Not an .emlx length prefix — try the whole file as RFC822.
        nl, length = -1, len(raw)
    try:
        return email.message_from_bytes(
            raw[nl + 1 : nl + 1 + length], policy=email.policy.default
        )
    except Exception as exc:  # noqa: BLE001 — one bad message must not stop a sweep
        print(f"{path}: parse failed: {exc}", file=sys.stderr)
        return None


def header(msg, name):
    """Decoded header as a single line, or '' — never raises on malformed input."""
    try:
        value = msg[name]
    except Exception:  # noqa: BLE001 — malformed headers raise on access
        return ""
    if value is None:
        return ""
    return " ".join(str(value).split())


def sort_key(msg):
    """UTC datetime for chronological sort; None-tolerant.

    Normalising to UTC keeps the printed column lexicographically sortable —
    local offsets vary across a long archive, so ISO strings carrying them
    compare wrongly under `sort`.
    """
    try:
        dt = parsedate_to_datetime(msg["Date"])
    except Exception:  # noqa: BLE001 — absent or malformed Date
        return None
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.astimezone()
    return dt.astimezone(timezone.utc)


def stubbed_parts(msg):
    """Content types Mail has not downloaded (declared length, empty payload)."""
    out = []
    for part in msg.walk():
        if part.get_content_maintype() == "multipart":
            continue
        if part.get(STUB_HEADER) is not None and not part.get_payload(decode=True):
            out.append(part.get_content_type())
    return out


def best_body(msg):
    """Body text, preferring text/plain and falling back to text/html."""
    try:
        part = msg.get_body(preferencelist=("plain", "html"))
    except Exception:  # noqa: BLE001
        part = None
    if part is None:
        return "", None
    try:
        return part.get_content(), part.get_content_type()
    except Exception as exc:  # noqa: BLE001 — unknown/invalid charset
        return f"[body could not be decoded: {exc}]", part.get_content_type()


def cmd_list(paths):
    rows = []
    for path in paths:
        msg = parse(path)
        if msg is None:
            continue
        flags = []
        if path.endswith(".partial.emlx"):
            flags.append("PARTIAL")
        stubs = stubbed_parts(msg)
        if stubs:
            flags.append("NOT-DOWNLOADED:" + ",".join(sorted(set(stubs))))
        key = sort_key(msg)
        date = (key.strftime("%Y-%m-%dT%H:%M:%SZ") if key
                else (header(msg, "Date") or "?"))
        rows.append((key, date, header(msg, "From"), header(msg, "Subject"),
                     ",".join(flags), path))
    # Undated messages sort last rather than crashing the comparison.
    rows.sort(key=lambda r: (r[0] is None, r[0]))
    for _, date, sender, subject, flags, path in rows:
        print(f"{date}\t{sender}\t{subject}\t{flags}\t{path}")


def cmd_show(path):
    msg = parse(path)
    if msg is None:
        return 1
    for name in ("Date", "From", "To", "Cc", "Subject", "Message-ID"):
        value = header(msg, name)
        if value:
            print(f"{name}: {value}")
    stubs = stubbed_parts(msg)
    if stubs:
        print(f"\n[not downloaded: {', '.join(sorted(set(stubs)))} "
              f"— open the message in Mail.app to fetch it]")
    body, kind = best_body(msg)
    print(f"\n--- body ({kind or 'none found'}) ---\n{body}")
    return 0


def main(argv):
    if len(argv) < 2 or argv[1] not in ("list", "show"):
        print(__doc__, file=sys.stderr)
        return 2
    if argv[1] == "show":
        if len(argv) != 3:
            print("usage: emlx.py show FILE", file=sys.stderr)
            return 2
        return cmd_show(argv[2])
    paths = argv[2:] or [line.strip() for line in sys.stdin if line.strip()]
    cmd_list(paths)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
