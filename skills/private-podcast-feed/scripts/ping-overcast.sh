#!/usr/bin/env bash
# ping-overcast.sh — Notify Overcast that a private feed has new content.
#
# Overcast accepts unauthenticated GETs to /ping?urlprefix=<encoded-prefix>.
# It rate-limits but is idempotent — safe to call on every feed regen. Any
# URL under that prefix is considered pingable.
#
# Usage:
#   ping-overcast.sh <feed-prefix>
#
# Example:
#   ping-overcast.sh https://your-host.com/p/5042a002464df562718eef84ac1316f5/
#
# The prefix must end with /. It is the URL prefix under which your MP3s and
# feed are hosted. Overcast will fetch any item whose URL starts with it.
#
# Exit 0 on HTTP 2xx, non-zero otherwise. The HTTP code is always printed
# as "overcast_ping=<code>" so callers can tee + grep.

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "usage: ping-overcast.sh <feed-prefix>" >&2
    echo "example: ping-overcast.sh https://your-host.com/p/<token>/" >&2
    exit 1
fi

PREFIX="$1"

# URL-encode the prefix. We only need to encode ":" and "/" for the query
# parameter to be well-formed; sed handles both.
encoded=$(printf '%s' "$PREFIX" | sed -e 's|:|%3A|g' -e 's|/|%2F|g')

url="https://overcast.fm/ping?urlprefix=${encoded}"

# -f: fail (non-zero) on HTTP >=400. -s: silent. -S: show errors on stderr.
# -o /dev/null: discard body. -w: print http_code for the caller.
code=$(curl -fsS -o /dev/null -w '%{http_code}' "$url" || true)

printf 'overcast_ping=%s\n' "$code"

case "$code" in
    2*) exit 0 ;;
    *)  exit 1 ;;
esac
