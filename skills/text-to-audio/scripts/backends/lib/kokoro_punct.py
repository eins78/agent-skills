#!/usr/bin/env python3
"""Layer 3c: Kokoro-specific punctuation normalization.

After Layer 1 (narrative), Layer 2 (rule normalization), and Layer 3a/3b
(phoneme dict + stress hints), this pass tunes punctuation for Kokoro's
prosody model.

Round 5 addition: em-dash pause mode. Kokoro/misaki only chunk on
terminal punctuation (`.`, `!`, `?`). An em-dash influences intonation
but does NOT trigger a hard chunk boundary — so long dash-connected
clauses read as one breath. Max heard Round 4 as "breathless" for
exactly this reason. We now offer four modes, tunable via `em_dash_mode`:

    "none"        leave as-is (Round 4 behavior)
    "period"      " — " -> ". " (hard break, lose the dash intonation)
    "period-dash" " — " -> ". — " (keep the dash, add a pause)
    "ellipsis"    " — " -> "… " (ellipsis pause, softer than period)

Default is "period-dash" — preserves Kokoro's em-dash intonation curve
while adding the chunk boundary that forces a breath.

Other rules (in order):
  1. Short parentheticals (<80 chars, mid-sentence) -> em-dashes.
  2. Triple dots -> Unicode ellipsis (U+2026).
  3. Double or triple spaces -> single space.
  4. Trailing hyphen at end of line (line-break-joined word) -> remove.
  5. Preserve paragraph breaks (blank lines).

Intentionally does NOT touch:
  - Oxford commas. Kokoro handles them.
  - Colons before lists — good prosodic anchor.
  - Quotation marks, smart quotes.
  - Em-dashes inside `[[CHAPTER: ...]]` marker lines — those lines are
    excluded from synthesis by the downstream chunker anyway, and we
    want the markers recognizable for debug reads of kokoro.txt.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


# Short parenthetical aside: (content) where content is <80 chars and
# doesn't contain a period (so we don't capture full sentences inside).
# Only inside a sentence — heuristic: preceded by a letter or comma,
# followed by space + lowercase letter.
_SHORT_PAREN_RE = re.compile(
    r"(?<=[a-zA-Z,])\s*\(([^().\n]{1,80})\)(?=\s+[a-zA-Z])"
)


def _paren_sub(match: re.Match) -> str:
    return f" — {match.group(1)} —"


_TRIPLE_DOT_RE = re.compile(r"\.{3,}")
_MULTI_SPACE_RE = re.compile(r"[ \t]{2,}")
_LINE_HYPHEN_RE = re.compile(r"-\n(?=[a-z])")

# Em-dash between two words with optional surrounding whitespace, NOT
# immediately touching a Markdown-link-IPA wrap `](`. The IPA wraps don't
# contain em-dashes, but we want to be safe if a term like `mac-zrh` ends
# with a wrap immediately followed by ` — `.
_EM_DASH_CLAUSE_RE = re.compile(r"\s*—\s*")

# Chapter-marker lines. Protected from em-dash rewriting so the debug
# reader of kokoro.txt still recognizes them. The TTS chunker strips
# them out before synthesis regardless.
_CHAPTER_LINE_RE = re.compile(r"^\s*\[\[CHAPTER:.+?\]\]\s*$", re.MULTILINE)

VALID_EM_DASH_MODES = ("none", "period", "period-dash", "ellipsis")


def _apply_em_dash(text: str, mode: str) -> str:
    """Convert clause-joining em-dashes to chunk-boundary punctuation.

    Returns the modified text. `mode` must be one of VALID_EM_DASH_MODES.
    Em-dashes inside `[[CHAPTER: ...]]` lines are preserved.
    """
    if mode == "none":
        return text
    if mode not in VALID_EM_DASH_MODES:
        raise ValueError(f"em_dash_mode must be one of {VALID_EM_DASH_MODES}, got {mode!r}")

    # Save chapter-marker lines under opaque placeholders so em-dashes
    # inside titles survive. Restore after the substitution.
    saved: list[str] = []

    def _stash(m: re.Match) -> str:
        saved.append(m.group(0))
        return f"\x00CHAP{len(saved) - 1}\x00"

    text = _CHAPTER_LINE_RE.sub(_stash, text)

    replacements = {
        "period": ". ",
        "period-dash": ". — ",
        "ellipsis": "… ",
    }
    text = _EM_DASH_CLAUSE_RE.sub(replacements[mode], text)

    # Restore markers.
    def _unstash(m: re.Match) -> str:
        return saved[int(m.group(1))]

    text = re.sub(r"\x00CHAP(\d+)\x00", _unstash, text)
    return text


def normalize_punct(text: str, em_dash_mode: str = "period-dash") -> str:
    text = _SHORT_PAREN_RE.sub(_paren_sub, text)
    text = _TRIPLE_DOT_RE.sub("…", text)
    text = _LINE_HYPHEN_RE.sub("", text)
    # Em-dash pause mode runs AFTER paren→em-dash substitution so newly
    # inserted em-dashes also become chunk boundaries.
    text = _apply_em_dash(text, em_dash_mode)
    text = _MULTI_SPACE_RE.sub(" ", text)
    # Trim trailing whitespace per line but preserve blank lines.
    text = "\n".join(line.rstrip() for line in text.split("\n"))
    return text


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", nargs="?")
    ap.add_argument("-o", "--output")
    ap.add_argument(
        "--em-dash-mode",
        default="period-dash",
        choices=VALID_EM_DASH_MODES,
        help="how to handle clause-joining em-dashes (default: period-dash)",
    )
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    raw = Path(args.input).read_text() if args.input else sys.stdin.read()
    out = normalize_punct(raw, em_dash_mode=args.em_dash_mode)
    if args.output:
        Path(args.output).write_text(out)
    else:
        sys.stdout.write(out)
    return 0


def self_test() -> int:
    cases: list[tuple[str, str, str]] = [
        (
            "short-paren",
            "The pipeline (Python) uses Kokoro for synthesis.",
            "The pipeline. — Python. — uses Kokoro for synthesis.",
        ),
        (
            "paren-with-period-inside-untouched",
            "Several variants existed (A. large, B. small, C. medium) at the time.",
            "Several variants existed (A. large, B. small, C. medium) at the time.",
        ),
        (
            "paren-at-sentence-end-untouched",
            "The model was released last month (a surprise).",
            "The model was released last month (a surprise).",
        ),
        (
            "triple-dots",
            "Wait for it... the result lands here.",
            "Wait for it… the result lands here.",
        ),
        (
            "four-dots",
            "Ellipsis variant.... still collapses.",
            "Ellipsis variant… still collapses.",
        ),
        (
            "double-space",
            "Two  spaces  collapse.",
            "Two spaces collapse.",
        ),
        (
            "line-hyphen",
            "com-\npact",
            "compact",
        ),
        (
            "blank-line-preserved",
            "First paragraph.\n\nSecond paragraph.",
            "First paragraph.\n\nSecond paragraph.",
        ),
        (
            "em-dash-clause-becomes-period-dash",
            "The first option — Kokoro — is fast.",
            "The first option. — Kokoro. — is fast.",
        ),
        (
            "em-dash-inside-chapter-marker-preserved",
            "[[CHAPTER: Audio — Feasibility]]\n\nFirst paragraph.",
            "[[CHAPTER: Audio — Feasibility]]\n\nFirst paragraph.",
        ),
    ]
    failed = []
    for name, raw, expected in cases:
        got = normalize_punct(raw)
        status = "PASS" if got == expected else "FAIL"
        print(f"  {status}  {name}")
        if got != expected:
            failed.append((name, raw, expected, got))
    # Additionally test the other em-dash modes on one clause.
    mode_cases = [
        ("none",        "A — B.", "A — B."),
        ("period",      "A — B.", "A. B."),
        ("period-dash", "A — B.", "A. — B."),
        ("ellipsis",    "A — B.", "A… B."),
    ]
    for mode, raw, expected in mode_cases:
        got = normalize_punct(raw, em_dash_mode=mode)
        status = "PASS" if got == expected else "FAIL"
        print(f"  {status}  em-dash-mode:{mode}")
        if got != expected:
            failed.append((f"em-dash-mode:{mode}", raw, expected, got))
    if failed:
        print(f"\n{len(failed)} FAIL:")
        for name, raw, expected, got in failed:
            print(f"--- {name} ---")
            print(f"  raw:      {raw!r}")
            print(f"  expected: {expected!r}")
            print(f"  got:      {got!r}")
        return 1
    total = len(cases) + len(mode_cases)
    print(f"\n[self-test] {total}/{total} passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
