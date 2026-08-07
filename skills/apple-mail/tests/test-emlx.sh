#!/usr/bin/env bash
# Smoke test for scripts/emlx.py using a synthetic .emlx fixture.
# Touches no real mail. Run: bash skills/apple-mail/tests/test-emlx.sh
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
emlx="$here/../scripts/emlx.py"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fail=0
check() { # check <label> <expected-substring> <actual>
  if [[ "$3" == *"$2"* ]]; then
    echo "  ok   — $1"
  else
    echo "  FAIL — $1: expected to find '$2'"
    fail=1
  fi
}

# Build an .emlx: byte-count line, RFC822 message, XML plist trailer.
# Exercises the three traps raw grep hits — a MIME-encoded subject, a subject
# folded across lines, and an attachment part Mail has not downloaded.
build_fixture() {
  local msg="$tmp/msg.raw"
  {
    printf 'Date: Tue, 4 Mar 2025 09:15:00 +0100\r\n'
    printf 'From: Sender <sender@example.com>\r\n'
    printf 'To: recipient@example.com\r\n'
    # =?UTF-8?B?w4RwZmVs?= is base64 for "Äpfel"; second line is a fold.
    printf 'Subject: =?UTF-8?B?w4RwZmVs?= order\r\n\tconfirmation 12345\r\n'
    printf 'Message-ID: <test@example.com>\r\n'
    printf 'MIME-Version: 1.0\r\n'
    printf 'Content-Type: multipart/mixed; boundary="BOUND"\r\n'
    printf '\r\n'
    printf -- '--BOUND\r\n'
    printf 'Content-Type: text/plain; charset=utf-8\r\n'
    printf 'Content-Transfer-Encoding: quoted-printable\r\n'
    printf '\r\n'
    printf 'tracking code WIDGET-42 for =C3=84pfel\r\n'
    printf -- '--BOUND\r\n'
    printf 'Content-Type: application/pdf; name="invoice.pdf"\r\n'
    printf 'X-Apple-Content-Length: 90210\r\n'
    printf '\r\n'
    printf -- '--BOUND--\r\n'
  } > "$msg"

  local n
  n=$(wc -c < "$msg" | tr -d ' ')
  {
    printf '%s\n' "$n"
    cat "$msg"
    printf '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict></dict></plist>\n'
  } > "$tmp/1.partial.emlx"
}

build_fixture

echo "list mode:"
listed="$(python3 "$emlx" list "$tmp/1.partial.emlx")"
check "decodes MIME-encoded subject"      "Äpfel order"   "$listed"
check "unfolds continuation line"         "confirmation 12345" "$listed"
check "subject is not left encoded"       "order"         "$listed"
check "emits UTC timestamp"               "2025-03-04T08:15:00Z" "$listed"
check "flags the partial file"            "PARTIAL"       "$listed"
check "flags undownloaded attachment"     "NOT-DOWNLOADED:application/pdf" "$listed"
if [[ "$listed" == *"=?"* ]]; then
  echo "  FAIL — subject still contains MIME encoding"
  fail=1
else
  echo "  ok   — no residual '=?' encoding"
fi

echo "show mode:"
shown="$(python3 "$emlx" show "$tmp/1.partial.emlx")"
check "decodes quoted-printable body"     "tracking code WIDGET-42" "$shown"
check "decodes charset in body"           "Äpfel"         "$shown"
check "reports the undownloaded part"     "not downloaded: application/pdf" "$shown"

echo "robustness:"
printf 'not an emlx\n' > "$tmp/junk.emlx"
: > "$tmp/empty.emlx"
if python3 "$emlx" list "$tmp/junk.emlx" "$tmp/empty.emlx" >/dev/null 2>&1; then
  echo "  ok   — malformed and empty files do not crash the sweep"
else
  echo "  FAIL — malformed input crashed"
  fail=1
fi

if [[ $fail -eq 0 ]]; then
  echo "PASS"
else
  echo "FAILED"
  exit 1
fi
