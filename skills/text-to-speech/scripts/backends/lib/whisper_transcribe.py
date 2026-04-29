#!/usr/bin/env python3
"""Whisper transcribe via mlx-whisper (Apple MLX).

Emits both a timestamped transcript (SRT-ish) and plain-text variant.

Usage:
    whisper_transcribe.py <audio.mp3> <out_prefix> [--model <hf-model-id>]

Produces:
    <out_prefix>.txt          # [HH:MM:SS.mmm --> HH:MM:SS.mmm] segment text
    <out_prefix>-plain.txt    # plain text, segments joined with spaces

Default model: mlx-community/whisper-large-v3-turbo (fast + accurate on M4).
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import mlx_whisper


def fmt_ts(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    s = int(seconds) % 60
    m = (int(seconds) // 60) % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out_prefix")
    ap.add_argument(
        "--model",
        default="mlx-community/whisper-large-v3-turbo",
        help="HF Hub model id (mlx-community/*)",
    )
    ap.add_argument("--language", default="en")
    args = ap.parse_args()

    audio = Path(args.audio)
    prefix = Path(args.out_prefix)
    prefix.parent.mkdir(parents=True, exist_ok=True)

    if not audio.exists():
        print(f"error: audio not found: {audio}", file=sys.stderr)
        return 1

    print(f"[whisper] model={args.model}")
    print(f"[whisper] audio={audio} ({audio.stat().st_size / (1024 * 1024):.1f} MB)")
    t0 = time.perf_counter()
    result = mlx_whisper.transcribe(
        str(audio),
        path_or_hf_repo=args.model,
        language=args.language,
        verbose=False,
    )
    elapsed = time.perf_counter() - t0
    print(f"[whisper] transcribed in {elapsed:.1f}s")

    segments = result.get("segments", [])
    timestamped = prefix.with_suffix(prefix.suffix + ".txt") if prefix.suffix else prefix.with_suffix(".txt")
    plain_path = prefix.parent / f"{prefix.name}-plain.txt"

    with timestamped.open("w") as f:
        f.write(f"# Model: {args.model}\n")
        f.write(f"# Audio: {audio}\n")
        f.write(f"# Elapsed: {elapsed:.1f}s\n")
        f.write(f"# Language: {result.get('language', '?')}\n\n")
        for seg in segments:
            t_start = fmt_ts(seg["start"])
            t_end = fmt_ts(seg["end"])
            text = seg["text"].strip()
            f.write(f"[{t_start} --> {t_end}] {text}\n")

    plain_text = " ".join(seg["text"].strip() for seg in segments)
    plain_path.write_text(plain_text + "\n")

    print(f"[whisper] wrote {timestamped} ({len(segments)} segments)")
    print(f"[whisper] wrote {plain_path} ({len(plain_text.split())} words)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
