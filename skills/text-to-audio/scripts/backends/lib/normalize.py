#!/usr/bin/env python3
"""Layer 2: rule-based text normalization for TTS.

Deterministic transforms on top of the Layer 1 narrative output.
Handles: years, version strings, abbreviations, ranges, percentages,
raw URLs, file paths, common symbols, and number-word hygiene.

Order matters. See `normalize()` for pass order and rationale.

This module is exposed as `normalize(text: str) -> str` for the
pipeline + as a CLI for one-off use.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


# ---------- year spelling ----------

_ONES = [
    "zero", "one", "two", "three", "four",
    "five", "six", "seven", "eight", "nine",
]
_TEENS = [
    "ten", "eleven", "twelve", "thirteen", "fourteen",
    "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
]
_TENS = [
    "", "", "twenty", "thirty", "forty",
    "fifty", "sixty", "seventy", "eighty", "ninety",
]


def _two_digit(n: int) -> str:
    if n < 10:
        return _ONES[n]
    if n < 20:
        return _TEENS[n - 10]
    tens, ones = divmod(n, 10)
    return _TENS[tens] if ones == 0 else f"{_TENS[tens]}-{_ONES[ones]}"


def spell_year(year: int) -> str:
    """Spell a 4-digit year the way English speakers say it.

    2026 → "twenty twenty-six"
    1999 → "nineteen ninety-nine"
    2000 → "two thousand"
    2001 → "two thousand one"
    2005 → "two thousand five"
    1900 → "nineteen hundred"
    """
    century, rest = divmod(year, 100)
    if 2000 <= year <= 2009:
        return f"two thousand{'' if rest == 0 else ' ' + _ONES[rest]}"
    if rest == 0:
        return f"{_two_digit(century)} hundred"
    return f"{_two_digit(century)} {_two_digit(rest)}"


# ---------- version strings ----------

_VERSION_RE = re.compile(r"(?<![A-Za-z0-9])v(\d+(?:\.\d+)*)(?![A-Za-z0-9])")
_BARE_VERSION_RE = re.compile(
    r"(?<![A-Za-z0-9.])(\d+\.\d+(?:\.\d+)+)(?![A-Za-z0-9])"
)


def _spell_version_part(part: str) -> str:
    n = int(part)
    if n < 100:
        return _two_digit(n)
    # Fall back to digit-by-digit for 100+ version numbers.
    return " ".join(_ONES[int(d)] for d in part)


def spell_version(match: re.Match) -> str:
    parts = match.group(1).split(".")
    return "version " + " point ".join(_spell_version_part(p) for p in parts)


def spell_bare_version(match: re.Match) -> str:
    parts = match.group(1).split(".")
    return "version " + " point ".join(_spell_version_part(p) for p in parts)


# ---------- year matching — careful with version numbers and IPs ----------

_YEAR_RE = re.compile(r"(?<![0-9.])(19|20)(\d{2})(?![0-9])")


def _year_sub(match: re.Match) -> str:
    return spell_year(int(match.group(1) + match.group(2)))


# ---------- dates like 2026-04-18 ----------

_MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]
_ORDINALS = [
    "", "first", "second", "third", "fourth", "fifth", "sixth", "seventh",
    "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth",
    "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth",
    "nineteenth", "twentieth", "twenty-first", "twenty-second",
    "twenty-third", "twenty-fourth", "twenty-fifth", "twenty-sixth",
    "twenty-seventh", "twenty-eighth", "twenty-ninth", "thirtieth",
    "thirty-first",
]

_ISO_DATE_RE = re.compile(
    r"(?<![0-9])(19|20)(\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?![0-9])"
)


def _iso_date_sub(match: re.Match) -> str:
    year = int(match.group(1) + match.group(2))
    month = int(match.group(3))
    day = int(match.group(4))
    return f"{_MONTHS[month]} {_ORDINALS[day]}, {spell_year(year)}"


# ---------- abbreviations (ordered: multi-word first) ----------

_ABBREV_PAIRS = [
    (r"\be\.g\.", "for example"),
    (r"\bi\.e\.", "that is"),
    (r"\betc\.", "and so on"),
    (r"\bvs\.", "versus"),
    (r"\bvs\b", "versus"),
    (r"\bMr\.", "Mister"),
    (r"\bMrs\.", "Missus"),
    (r"\bMs\.", "Miss"),
    (r"\bDr\.", "Doctor"),
    (r"\bSt\.", "Saint"),
    (r"\bNo\.", "number"),
    (r"\bJan\.", "January"),
    (r"\bFeb\.", "February"),
    (r"\bApr\.", "April"),
    (r"\bAug\.", "August"),
    (r"\bSept\.", "September"),
    (r"\bOct\.", "October"),
    (r"\bNov\.", "November"),
    (r"\bDec\.", "December"),
]
_ABBREV_RE = [(re.compile(pat), repl) for pat, repl in _ABBREV_PAIRS]


# ---------- shorthand "Nmo" (months), "Nw" (weeks), "Nh" (hours) ----------

_SHORTHAND_RE = re.compile(
    r"(?<![A-Za-z0-9])(\d+)(mo|wk|hr|min|sec|ms|yr)\b",
    re.IGNORECASE,
)
_SHORTHAND_MAP = {
    "mo": "months",
    "wk": "weeks",
    "hr": "hours",
    "min": "minutes",
    "sec": "seconds",
    "ms": "milliseconds",
    "yr": "years",
}


def _shorthand_sub(match: re.Match) -> str:
    n = int(match.group(1))
    unit = match.group(2).lower()
    word = _SHORTHAND_MAP[unit]
    if n == 1:
        # Singularize.
        word = word.rstrip("s")
    return f"{n} {word}"


# ---------- ranges, percentages ----------

_RANGE_PCT_RE = re.compile(r"(\d+)-(\d+)%")
_PCT_RE = re.compile(r"(\d+(?:\.\d+)?)%")


def _range_pct_sub(match: re.Match) -> str:
    lo, hi = match.group(1), match.group(2)
    return f"{lo} to {hi} percent"


def _pct_sub(match: re.Match) -> str:
    return f"{match.group(1)} percent"


# ---------- raw URLs — drop, leave a stub ----------

_URL_RE = re.compile(r"https?://\S+|\bwww\.\S+\b")


def _url_sub(match: re.Match) -> str:
    # Drop URL entirely. A smarter pass could extract the domain, but the
    # Layer 1 prompt has already unwrapped [text](url) → text — anything
    # left is raw and likely noise.
    return ""


# ---------- compound words with slashes ----------

_MID_SLASH_RE = re.compile(r"\b([A-Za-z0-9]+)/([A-Za-z0-9]+)\b")


def _slash_sub(match: re.Match) -> str:
    a, b = match.group(1), match.group(2)
    return f"{a} or {b}"


# ---------- pipeline ----------


def normalize(text: str) -> str:
    """Apply all passes in order. Order is load-bearing."""
    # 1. URLs first — remove noise before other regex trips over them.
    text = _URL_RE.sub(_url_sub, text)

    # 2. ISO dates before raw years (so 2026-04-18 doesn't become
    #    "twenty twenty-six-04-18").
    text = _ISO_DATE_RE.sub(_iso_date_sub, text)

    # 3. Versions before bare years (both can look like 1.2.3 vs 1999).
    text = _VERSION_RE.sub(spell_version, text)
    text = _BARE_VERSION_RE.sub(spell_bare_version, text)

    # 4. Abbreviations — do before word-boundary number rules because
    #    "Jan." and "2026" can co-occur.
    for rx, repl in _ABBREV_RE:
        text = rx.sub(repl, text)

    # 5. Years (bare 4-digit).
    text = _YEAR_RE.sub(_year_sub, text)

    # 6. Shorthand time units.
    text = _SHORTHAND_RE.sub(_shorthand_sub, text)

    # 7. Percentages / ranges.
    text = _RANGE_PCT_RE.sub(_range_pct_sub, text)
    text = _PCT_RE.sub(_pct_sub, text)

    # 8. Compound slashes.
    text = _MID_SLASH_RE.sub(_slash_sub, text)

    # 9. Normalize whitespace runs.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" +\n", "\n", text)

    return text


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", nargs="?", help="input file (default: stdin)")
    ap.add_argument("-o", "--output", help="output file (default: stdout)")
    args = ap.parse_args()

    raw = Path(args.input).read_text() if args.input else sys.stdin.read()
    out = normalize(raw)
    if args.output:
        Path(args.output).write_text(out)
    else:
        sys.stdout.write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
