#!/usr/bin/env python3
"""Chunk a long markdown dossier by H2, run Layer 1 per chunk, concat.

Workaround for long-document LLM calls that stall/throttle on >5k-word
inputs. Each H2 chunk is ~500-1500 words — LLM calls complete in ~30-60s.

Usage:
    chunk_and_rewrite.py <markdown> <narrative_out> [--prompt PATH] \\
        [--llm-model MODEL]

Output narrative.txt is the concatenation of chunk outputs, blank-line
separated. Each chunk naturally produces a [[CHAPTER]] marker for its
H2 under the chapter-focused prompt.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import time
from pathlib import Path


_SCRIPT_DIR = Path(__file__).resolve().parent
_BACKENDS_DIR = _SCRIPT_DIR.parent
DEFAULT_PROMPT = _BACKENDS_DIR / "prompts" / "narrative-chapter-focused.md"

H2_RE = re.compile(r"^##\s+.+$", re.MULTILINE)
SKIP_PREFIX_RE = re.compile(
    r"^##\s+(Sources|References|Appendix|Citations|Bibliography|Further Reading)\b",
    re.IGNORECASE,
)


def chunk_by_h2(md: str) -> list[str]:
    matches = list(H2_RE.finditer(md))
    if not matches:
        return [md]
    chunks: list[str] = []
    preamble = md[: matches[0].start()]
    if preamble.strip():
        chunks.append(preamble)
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        section = md[m.start():end]
        first_line = section.split("\n", 1)[0]
        if SKIP_PREFIX_RE.match(first_line):
            continue
        chunks.append(section)
    return chunks


def rewrite_chunk(chunk: str, prompt_text: str, model: str, idx: int, total: int) -> str:
    user_msg = (
        "Rewrite the following dossier section into spoken prose per the "
        "system prompt rules. Output ONLY the rewritten prose with chapter "
        "markers — no preamble, no explanation, no markdown fences.\n\n"
        "---SOURCE---\n"
        f"{chunk}"
    )
    t0 = time.perf_counter()
    result = subprocess.run(
        [
            "claude", "--print",
            "--model", model,
            "--system-prompt", prompt_text,
            user_msg,
        ],
        capture_output=True,
        text=True,
        timeout=300,
    )
    elapsed = time.perf_counter() - t0
    if result.returncode != 0:
        print(
            f"[chunk {idx + 1}/{total}] FAIL exit {result.returncode} after {elapsed:.1f}s",
            file=sys.stderr,
        )
        print(result.stderr, file=sys.stderr)
        raise SystemExit(1)
    out = result.stdout.strip()
    if out.lower().startswith("here is") or out.lower().startswith("here's"):
        first_nl = out.find("\n")
        if 0 < first_nl < 200:
            out = out[first_nl:].lstrip()
    print(
        f"[chunk {idx + 1}/{total}] in={len(chunk.split()):>5}w "
        f"out={len(out.split()):>5}w  elapsed={elapsed:>5.1f}s",
        flush=True,
    )
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("markdown")
    ap.add_argument("narrative_out")
    ap.add_argument("--prompt", default=str(DEFAULT_PROMPT))
    ap.add_argument("--llm-model", default="claude-sonnet-4-6")
    args = ap.parse_args()

    md = Path(args.markdown).read_text()
    prompt_text = Path(args.prompt).read_text()
    chunks = chunk_by_h2(md)
    print(
        f"[chunker] split {len(md.split())} words -> {len(chunks)} H2-chunks "
        f"(lens: {[len(c.split()) for c in chunks]})",
        flush=True,
    )

    out_parts: list[str] = []
    for i, chunk in enumerate(chunks):
        rewritten = rewrite_chunk(chunk, prompt_text, args.llm_model, i, len(chunks))
        out_parts.append(rewritten)

    joined = "\n\n".join(out_parts).strip() + "\n"
    out_path = Path(args.narrative_out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(joined)
    print(
        f"[chunker] wrote {out_path} ({len(joined.split())} words, "
        f"{joined.count('[[CHAPTER:')} chapter markers)",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
