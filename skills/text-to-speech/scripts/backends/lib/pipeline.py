#!/usr/bin/env python3
"""End-to-end text-preparation pipeline for TTS.

Stages:
  L1  narrative rewrite (LLM)
      → narrative.txt (contains [[CHAPTER: ...]] markers)

      By default this pipeline does NOT produce narrative.txt itself — it
      expects the driving Claude Code agent to have dispatched an isolated
      subagent (per SKILL.md) to write it, then to be re-invoked with
      --skip-layer 1. This avoids a nested `claude --print` subprocess
      inheriting the caller's active output style / CLAUDE.md, which can
      leak meta-commentary into the rewrite instead of clean prose.

      For standalone/headless runs with no driving agent present, pass
      --allow-inline-llm-rewrite to fall back to an isolated (--safe-mode)
      inline `claude --print` call.

      Regardless of source, narrative.txt is passed through
      validate_narrative() before use — this is the load-bearing backstop
      against non-conforming L1 output (missing chapter markers, collapsed
      word count, or known contamination patterns), since subagent
      isolation is a behavioral guarantee, not something checked statically.
  L2  rule normalization (normalize.py)
      → normalized.txt
  L3  Kokoro-specific prep:
       3a. phoneme dict (./phoneme-dict.yaml) — wrap matched terms in /IPA/
       3b. stress hints (./stress.yaml) — wrap in [word](+/-N)
       3c. punctuation normalization (kokoro_punct.py)
       → kokoro.txt
  Plus: chapters.json — list of chapter titles parsed from kokoro.txt,
  with character offsets (ms offsets come later, during TTS).

Intermediate files are always kept. --skip-layer N reuses existing
intermediate from run N to re-run downstream.

Usage:
    pipeline.py <markdown> <out_dir> [options]

Options:
    --skip-layer N              reuse existing <out_dir>/<name-from-layer-N>
                                (1..3) — skip the indicated layer + earlier
    --allow-inline-llm-rewrite  allow an isolated inline `claude --print`
                                call for L1 when narrative.txt doesn't
                                already exist (default: off — fail loudly
                                instead; see L1 note above)
    --llm-model MODEL           Claude model for the inline fallback and
                                chunk_and_rewrite.py (default: claude-sonnet-5)
    --prompt PATH                narrative prompt (default: bundled narrative-chapter-focused.md)
    --dict PATH                  phoneme dict YAML (default: ./phoneme-dict.yaml in input dir)
    --stress PATH                stress hints YAML (default: ./stress.yaml in input dir)
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from normalize import normalize  # noqa: E402
from kokoro_punct import normalize_punct  # noqa: E402


_SCRIPT_DIR = Path(__file__).resolve().parent
_BACKENDS_DIR = _SCRIPT_DIR.parent
DEFAULT_PROMPT = _BACKENDS_DIR / "prompts" / "narrative-chapter-focused.md"


# ---------- chapter-marker utilities ----------

CHAPTER_MARKER_RE = re.compile(r"^\s*\[\[CHAPTER:\s*(.+?)\s*\]\]\s*$", re.MULTILINE)


def parse_chapters(text: str) -> list[dict]:
    """Extract [[CHAPTER: Title]] markers with their byte offsets."""
    chapters: list[dict] = []
    for m in CHAPTER_MARKER_RE.finditer(text):
        chapters.append({
            "title": m.group(1),
            "char_offset": m.start(),
        })
    return chapters


# ---------- Layer 1 — LLM narrative rewrite (inline fallback only) ----------
#
# This is ONLY used when --allow-inline-llm-rewrite is passed — the default
# path expects narrative.txt to already exist, written by a subagent the
# driving Claude Code agent dispatched (see SKILL.md and the module
# docstring). --safe-mode disables CLAUDE.md auto-discovery, output styles,
# hooks, plugins, and custom agents/commands — the inheritance vectors that
# caused a nested `claude --print` to leak session meta-commentary
# (e.g. an explanatory-output-style "★ Insight" block) into the rewrite.

def run_layer1(md_text: str, prompt_path: Path, model: str) -> str:
    user_msg = (
        "Rewrite the following dossier into spoken prose per the system "
        "prompt rules. Output ONLY the rewritten prose with chapter markers "
        "— no preamble, no explanation, no markdown fences.\n\n"
        "---SOURCE---\n"
        f"{md_text}"
    )
    print(f"[L1] invoking {model} via claude CLI --safe-mode (prompt={prompt_path.name})")
    result = subprocess.run(
        [
            "claude", "--print",
            "--model", model,
            "--safe-mode",
            "--system-prompt", prompt_path.read_text(),
            user_msg,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"[L1] FAIL: claude exit {result.returncode}", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        raise SystemExit(1)
    out = result.stdout.strip()
    if out.lower().startswith("here is") or out.lower().startswith("here's"):
        first_nl = out.find("\n")
        if first_nl > 0 and first_nl < 200:
            out = out[first_nl:].lstrip()
    return out + "\n"


# ---------- Layer 1 validation — defensive check on narrative.txt ----------
#
# Applies uniformly regardless of narrative.txt's source (subagent-written,
# human-written, or the inline fallback above). This is the load-bearing
# backstop for Finding 2: subagent context isolation is a behavioral
# guarantee we verified empirically but can't check statically, so this
# function is what actually prevents garbage narrative from reaching L2/L3
# and being rendered to audio.

_HEADING_RE = re.compile(r"^#{1,2}\s+.+$", re.MULTILINE)
_SKIP_HEADING_RE = re.compile(
    r"^#{1,2}\s+(Sources|References|Appendix|Citations|Bibliography|Further Reading)\b",
    re.IGNORECASE,
)

# Known contamination patterns from the observed failure (a nested
# `claude --print` inheriting an active output style leaked a literal
# "★ Insight" block into rendered audio). This denylist is inherently
# incomplete — it targets the observed failure mode at near-zero cost. The
# structural checks below (missing markers, collapsed word count) are the
# general defense; don't rely on this list alone.
_CONTAMINATION_MARKERS = (
    "★",
    "Insight ─",
    "approve the plan",
    "The plan is written",
)


def validate_narrative(narrative: str, source_md: str) -> None:
    """Fail loudly (SystemExit) if narrative.txt doesn't look like a real
    rewrite of source_md. Never render audio from a narrative that fails
    this check."""
    chapters = parse_chapters(narrative)

    expected_headings = [
        m for m in _HEADING_RE.finditer(source_md)
        if not _SKIP_HEADING_RE.match(m.group(0))
    ]
    if expected_headings and not chapters:
        raise SystemExit(
            "narrative validation FAILED: source has "
            f"{len(expected_headings)} heading(s) but narrative.txt has "
            "zero [[CHAPTER: ...]] markers. This usually means the L1 "
            "rewrite returned meta-commentary instead of prose (e.g. it "
            "echoed an output style or explained the task) rather than "
            "following the narrative-chapter-focused.md prompt. Re-dispatch "
            "the L1 rewrite and re-run with --skip-layer 1."
        )

    source_words = len(source_md.split())
    narrative_words = len(narrative.split())
    if source_words > 0 and narrative_words / source_words < 0.2:
        raise SystemExit(
            "narrative validation FAILED: narrative.txt has "
            f"{narrative_words} words vs {source_words} in the source "
            f"({narrative_words / source_words:.0%}) — looks collapsed, not "
            "a rewrite. Re-dispatch the L1 rewrite and re-run with "
            "--skip-layer 1."
        )

    lowered = narrative.lower()
    hits = [m for m in _CONTAMINATION_MARKERS if m.lower() in lowered]
    if hits:
        raise SystemExit(
            "narrative validation FAILED: narrative.txt contains text that "
            f"looks like leaked session/meta-commentary ({hits!r}) rather "
            "than spoken prose — a known failure mode when an LLM rewrite "
            "inherits an active output style. Re-dispatch the L1 rewrite "
            "(this check is a denylist, not exhaustive — inspect the file "
            "manually too)."
        )


# ---------- Layer 3a — phoneme dict ----------

def apply_phoneme_dict(text: str, dict_path: Path) -> tuple[str, int]:
    """Wrap matched terms as Markdown-link phonemes. Returns (text, n_replacements).

    Kokoro/misaki expects the `[word](/IPA/)` Markdown-link form:
    the bracket keeps the original grapheme visible to the tokenizer
    while the link target (the `/IPA/` span) supplies the phonemes.
    Bare `/IPA/` without the word prefix is NOT reliably parsed — in
    Round 4 misaki voiced the IPA characters as their literal names
    ("slash D stress I lengthened schwa slash" for /dˈiːə/).
    """
    with dict_path.open() as f:
        data = yaml.safe_load(f)
    terms = data.get("terms", {})
    if not terms:
        return text, 0

    ipa_by_term: dict[str, str] = {}
    for term, entry in terms.items():
        ipa = entry.get("ipa")
        if ipa:
            ipa_by_term[term] = ipa
    if not ipa_by_term:
        return text, 0

    sorted_terms = sorted(ipa_by_term.keys(), key=len, reverse=True)
    alternation = "|".join(re.escape(t) for t in sorted_terms)
    pat = re.compile(rf"(?<!\w)(?:{alternation})(?!\w)")

    count = 0

    def _sub(m: re.Match) -> str:
        nonlocal count
        count += 1
        term = m.group(0)
        return f"[{term}](/{ipa_by_term[term]}/)"

    text = pat.sub(_sub, text)
    return text, count


# ---------- Layer 3b — stress hints ----------

def apply_stress_hints(text: str, stress_path: Path) -> tuple[str, int]:
    with stress_path.open() as f:
        data = yaml.safe_load(f)
    deemph = data.get("deemphasize", []) or []
    emph = data.get("emphasize", []) or []
    count = 0
    for word in deemph:
        pat = re.compile(rf"(?<!\w){re.escape(word)}(?!\w)", re.IGNORECASE)
        new_text, n = pat.subn(f"[{word}](-1)", text)
        if n:
            count += n
            text = new_text
    for word in emph:
        pat = re.compile(rf"(?<!\w){re.escape(word)}(?!\w)", re.IGNORECASE)
        new_text, n = pat.subn(f"[{word}](+1)", text)
        if n:
            count += n
            text = new_text
    return text, count


# ---------- Layer 3b-bis — ordinal emphasis ----------

_ORDINAL_WORDS = [
    "First", "Second", "Third", "Fourth", "Fifth",
    "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
]
_COUNT_WORDS = [
    "two", "three", "four", "five", "six",
    "seven", "eight", "nine", "ten",
]
_COUNT_NOUNS = (
    "item|items|step|steps|thing|things|reason|reasons|option|options|"
    "choice|choices|candidate|candidates|piece|pieces|requirement|requirements|"
    "constraint|constraints|layer|layers|phase|phases|stage|stages|"
    "factor|factors|part|parts|element|elements|dimension|dimensions|"
    "section|sections|tier|tiers|variant|variants|bot|bots"
)

_ORDINAL_LINE_START_RE = re.compile(
    r"(?:(?<=[.!?]\s)|(?m:^))(" + "|".join(_ORDINAL_WORDS) + r")(?=[,.:\s—])"
)
_OPENER_COUNT_RE = re.compile(
    r"(?<!\w)(" + "|".join(_COUNT_WORDS) + r")(\s+)(" + _COUNT_NOUNS + r")(?=[\s:,.])",
    re.IGNORECASE,
)
_ENUMERATOR_DASH_RE = re.compile(
    r"(?m)(?:^|(?<=[.!?]\s))(" + "|".join(_COUNT_WORDS) + r")(?=\s+—)",
    re.IGNORECASE,
)


def apply_ordinal_emphasis(text: str) -> tuple[str, int]:
    count = 0

    def _line_start(m: re.Match) -> str:
        nonlocal count
        count += 1
        return f"[{m.group(1)}](+1)"

    text = _ORDINAL_LINE_START_RE.sub(_line_start, text)

    def _opener(m: re.Match) -> str:
        nonlocal count
        count += 1
        return f"[{m.group(1)}](+1){m.group(2)}{m.group(3)}"

    text = _OPENER_COUNT_RE.sub(_opener, text)

    def _enumerator(m: re.Match) -> str:
        nonlocal count
        count += 1
        return f"[{m.group(1)}](+1)"

    text = _ENUMERATOR_DASH_RE.sub(_enumerator, text)

    return text, count


# ---------- pipeline ----------

def run(
    md_path: Path,
    out_dir: Path,
    skip_layer: int,
    model: str,
    prompt_path: Path,
    dict_path: Path | None = None,
    stress_path: Path | None = None,
    em_dash_mode: str = "period-dash",
    allow_inline_llm_rewrite: bool = False,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    narrative_path = out_dir / "narrative.txt"
    normalized_path = out_dir / "normalized.txt"
    kokoro_path = out_dir / "kokoro.txt"
    chapters_path = out_dir / "chapters.json"

    # Default to looking for config files alongside the input document.
    input_dir = md_path.resolve().parent
    if dict_path is None:
        dict_path = input_dir / "phoneme-dict.yaml"
    if stress_path is None:
        stress_path = input_dir / "stress.yaml"

    md_text = md_path.read_text()
    print(f"[pipeline] input: {md_path} ({len(md_text.split())} words)")

    # L1 ——————————————————————————————————————————————————————————
    if skip_layer >= 1 and narrative_path.exists():
        print(f"[pipeline] L1 skipped (reusing {narrative_path})")
        narrative = narrative_path.read_text()
    elif allow_inline_llm_rewrite:
        narrative = run_layer1(md_text, prompt_path, model)
        narrative_path.write_text(narrative)
        print(f"[pipeline] L1 wrote {narrative_path} ({len(narrative.split())} words)")
    else:
        raise SystemExit(
            f"no narrative found at {narrative_path}, and inline LLM "
            "rewrite is disabled by default. Either:\n"
            "  1. Have the driving Claude Code agent dispatch a rewrite "
            "subagent per SKILL.md, write narrative.txt, then re-run with "
            "--skip-layer 1 (recommended — isolated context, avoids "
            "inheriting an active output style/CLAUDE.md), or\n"
            "  2. Pass --allow-inline-llm-rewrite for a standalone/headless "
            "run with no driving agent present (uses `claude --print "
            "--safe-mode` internally)."
        )

    validate_narrative(narrative, md_text)

    chapters_pre = parse_chapters(narrative)
    print(f"[pipeline] found {len(chapters_pre)} chapter markers")

    # L2 ——————————————————————————————————————————————————————————
    if skip_layer >= 2 and normalized_path.exists():
        print(f"[pipeline] L2 skipped (reusing {normalized_path})")
        normalized = normalized_path.read_text()
    else:
        normalized = normalize(narrative)
        normalized_path.write_text(normalized)
        print(f"[pipeline] L2 wrote {normalized_path} ({len(normalized.split())} words)")

    # L3 ——————————————————————————————————————————————————————————
    if skip_layer >= 3 and kokoro_path.exists():
        print(f"[pipeline] L3 skipped (reusing {kokoro_path})")
        kokoro = kokoro_path.read_text()
    else:
        # L3a — phoneme dict (optional, project-local)
        if dict_path.exists():
            t3a, n_dict = apply_phoneme_dict(normalized, dict_path)
            print(f"[pipeline] L3a applied {n_dict} phoneme-dict substitutions")
        else:
            t3a = normalized
            print(f"[pipeline] L3a skipped (no phoneme-dict at {dict_path})")

        # L3b — stress hints (optional, project-local)
        if stress_path.exists():
            t3b, n_stress = apply_stress_hints(t3a, stress_path)
            print(f"[pipeline] L3b applied {n_stress} stress-hint wraps")
        else:
            t3b = t3a
            print(f"[pipeline] L3b skipped (no stress-hints at {stress_path})")

        t3b, n_ord = apply_ordinal_emphasis(t3b)
        print(f"[pipeline] L3b-bis applied {n_ord} ordinal-emphasis wraps")
        kokoro = normalize_punct(t3b, em_dash_mode=em_dash_mode)
        kokoro_path.write_text(kokoro)
        print(
            f"[pipeline] L3c wrote {kokoro_path} ({len(kokoro.split())} words, "
            f"em-dash-mode={em_dash_mode})"
        )

    chapters_in_kokoro = parse_chapters(kokoro)
    if len(chapters_pre) != len(chapters_in_kokoro):
        raise SystemExit(
            f"chapter count mismatch: narrative={len(chapters_pre)}, "
            f"kokoro={len(chapters_in_kokoro)} — L2/L3 may have eaten a marker"
        )
    chapters_final = [
        {"title": c["title"], "char_offset_narrative": c["char_offset"]}
        for c in chapters_pre
    ]
    chapters_path.write_text(json.dumps(chapters_final, indent=2) + "\n")
    print(f"[pipeline] wrote {chapters_path} ({len(chapters_final)} chapters)")

    print(f"[pipeline] DONE. Intermediates in {out_dir}/")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("markdown")
    ap.add_argument("out_dir")
    ap.add_argument("--skip-layer", type=int, default=0)
    ap.add_argument(
        "--allow-inline-llm-rewrite",
        action="store_true",
        help=(
            "allow an isolated inline `claude --print --safe-mode` call for "
            "L1 when narrative.txt doesn't already exist (default: off — "
            "fail loudly and expect the driving agent to have dispatched a "
            "rewrite subagent per SKILL.md)"
        ),
    )
    ap.add_argument("--llm-model", default="claude-sonnet-5")
    ap.add_argument("--prompt", default=str(DEFAULT_PROMPT))
    ap.add_argument("--dict", default=None, help="phoneme dict YAML (default: ./phoneme-dict.yaml)")
    ap.add_argument("--stress", default=None, help="stress hints YAML (default: ./stress.yaml)")
    ap.add_argument(
        "--em-dash-mode",
        default="period-dash",
        choices=("none", "period", "period-dash", "ellipsis"),
    )
    args = ap.parse_args()

    run(
        Path(args.markdown),
        Path(args.out_dir),
        args.skip_layer,
        args.llm_model,
        Path(args.prompt),
        dict_path=Path(args.dict) if args.dict else None,
        stress_path=Path(args.stress) if args.stress else None,
        allow_inline_llm_rewrite=args.allow_inline_llm_rewrite,
        em_dash_mode=args.em_dash_mode,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
