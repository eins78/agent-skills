#!/usr/bin/env python3
"""Round 5 TTS runner — am_puck only, speed-tunable, iteration-friendly.

Consumes pipeline outputs (kokoro.txt + chapters.json). Runs Kokoro-82M
with MPS enabled. Tracks cumulative audio duration as each [[CHAPTER: ...]]
marker is encountered — produces chapters.json with ms offsets per MP3.

Differences vs round4 runner:
  - `--speed` arg (default 0.95) — Round 5 slows down for breathing room
    per Max's "breathless" note. 0.92-0.95 seems the sweet spot.
  - `--stable-passage` mode: reads kokoro-formatted text DIRECTLY instead
    of splitting on chapter markers. Used for short iteration A/Bs where
    there's no chapter structure.
  - Single voice (am_puck) is the default target; other voices accepted
    for completeness but R5 scope is puck-only.

Usage (full dossier):
    kokoro_round5.py <out_dir> --voice am_puck --speed 0.95 \\
        <slug1>:<pipeline_dir1> [<slug2>:<pipeline_dir2> ...]

Usage (stable passage A/B):
    kokoro_round5.py <out_dir> --voice am_puck --stable-passage \\
        --speeds 0.92,0.95,1.0,1.05 \\
        iter1-req-passage:path/to/passage.kokoro.txt
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

from kokoro import KPipeline

sys.path.insert(0, str(Path(__file__).resolve().parent))
from inject_chapters import inject as inject_chapters  # noqa: E402


SAMPLE_RATE = 24000
MP3_BITRATE = "64k"

CHAPTER_MARKER_RE = re.compile(r"^\s*\[\[CHAPTER:\s*(.+?)\s*\]\]\s*$", re.MULTILINE)


def split_on_chapters(text: str, titles: list[str]) -> list[tuple[str | None, str]]:
    """Split kokoro.txt into (chapter_title_or_None, body_chunk) pairs.

    Titles are supplied externally (from chapters.json, built off the
    pre-transform narrative.txt). The Nth marker in text is paired with
    titles[N].
    """
    parts: list[tuple[str | None, str]] = []
    last_end = 0
    current_title: str | None = None
    chapter_idx = 0
    for m in CHAPTER_MARKER_RE.finditer(text):
        body = text[last_end:m.start()]
        if body.strip() or current_title is not None:
            parts.append((current_title, body))
        if chapter_idx >= len(titles):
            raise ValueError(
                f"more [[CHAPTER]] markers in kokoro.txt than titles provided "
                f"({chapter_idx + 1} > {len(titles)})"
            )
        current_title = titles[chapter_idx]
        chapter_idx += 1
        last_end = m.end()
    tail = text[last_end:]
    parts.append((current_title, tail))
    return parts


def wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(wav_path),
            "-codec:a", "libmp3lame",
            "-ar", str(SAMPLE_RATE),
            "-ac", "1",
            "-b:a", MP3_BITRATE,
            str(mp3_path),
        ],
        check=True,
    )


def synth_full(
    pipeline: KPipeline,
    kokoro_text: str,
    voice: str,
    speed: float,
    titles: list[str],
    wav_path: Path,
    mp3_path: Path,
    chapters_path: Path,
) -> dict:
    parts = split_on_chapters(kokoro_text, titles)
    print(f"[r5]   text split into {len(parts)} chunks with chapter markers")

    all_audio: list[np.ndarray] = []
    chapters_ms: list[dict] = []
    cumulative_samples = 0
    t0 = time.perf_counter()
    total_segments = 0

    for title, body in parts:
        if title is not None:
            start_ms = int(cumulative_samples / SAMPLE_RATE * 1000)
            chapters_ms.append({"start_ms": start_ms, "title": title})
        body = body.strip()
        if not body:
            continue
        for _, _, audio in pipeline(body, voice=voice, speed=speed):
            all_audio.append(audio)
            cumulative_samples += len(audio)
            total_segments += 1

    elapsed = time.perf_counter() - t0
    if not all_audio:
        raise RuntimeError("no audio produced")
    full = np.concatenate(all_audio)
    sf.write(wav_path, full, SAMPLE_RATE)
    wav_to_mp3(wav_path, mp3_path)

    duration_s = len(full) / SAMPLE_RATE
    rtf = elapsed / duration_s if duration_s else float("inf")
    chapters_path.write_text(json.dumps(chapters_ms, indent=2) + "\n")
    if chapters_ms:
        inject_chapters(mp3_path, chapters_ms)

    return {
        "voice": voice,
        "speed": speed,
        "elapsed_s": elapsed,
        "audio_s": duration_s,
        "rtf": rtf,
        "segments": total_segments,
        "chapters": len(chapters_ms),
    }


def synth_stable(
    pipeline: KPipeline,
    kokoro_text: str,
    voice: str,
    speed: float,
    wav_path: Path,
    mp3_path: Path,
) -> dict:
    """No chapter logic — just synth the text as one chunk."""
    all_audio: list[np.ndarray] = []
    cumulative_samples = 0
    t0 = time.perf_counter()
    total_segments = 0
    for _, _, audio in pipeline(kokoro_text, voice=voice, speed=speed):
        all_audio.append(audio)
        cumulative_samples += len(audio)
        total_segments += 1
    elapsed = time.perf_counter() - t0
    if not all_audio:
        raise RuntimeError("no audio produced")
    full = np.concatenate(all_audio)
    sf.write(wav_path, full, SAMPLE_RATE)
    wav_to_mp3(wav_path, mp3_path)
    duration_s = len(full) / SAMPLE_RATE
    rtf = elapsed / duration_s if duration_s else float("inf")
    return {
        "voice": voice,
        "speed": speed,
        "elapsed_s": elapsed,
        "audio_s": duration_s,
        "rtf": rtf,
        "segments": total_segments,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("out_dir")
    ap.add_argument("--voice", default="am_puck")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument(
        "--speeds",
        default=None,
        help="comma-separated speeds for stable-passage A/B (e.g. 0.92,0.95,1.0,1.05)",
    )
    ap.add_argument(
        "--stable-passage",
        action="store_true",
        help="each source arg is a raw kokoro.txt path (no chapter handling)",
    )
    ap.add_argument(
        "sources",
        nargs="+",
        help="<slug>:<path> — path is pipeline_dir (full mode) or kokoro.txt (stable mode)",
    )
    args = ap.parse_args()

    if shutil.which("ffmpeg") is None:
        print("error: ffmpeg not found on PATH", file=sys.stderr)
        return 1

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    speeds: list[float]
    if args.speeds:
        speeds = [float(s.strip()) for s in args.speeds.split(",")]
    else:
        speeds = [args.speed]

    try:
        import torch
        print(f"[r5] torch.backends.mps.is_available() = {torch.backends.mps.is_available()}")
        print(f"[r5] PYTORCH_ENABLE_MPS_FALLBACK = {os.environ.get('PYTORCH_ENABLE_MPS_FALLBACK', '(unset)')}")
    except ImportError:
        print("[r5] torch not importable")

    sources: list[tuple[str, Path]] = []
    for arg in args.sources:
        slug, _, p = arg.partition(":")
        sources.append((slug, Path(p)))

    print(f"[r5] voice={args.voice} speeds={speeds} sources={len(sources)} stable={args.stable_passage}")

    t_load = time.perf_counter()
    pipeline = KPipeline(lang_code="a")
    print(f"[r5] pipeline loaded in {time.perf_counter() - t_load:.2f}s")

    results: list[dict] = []
    for speed in speeds:
        for slug, src_path in sources:
            speed_tag = f"s{str(speed).replace('.', '_')}"
            stem = f"kokoro-{args.voice}-{slug}-{speed_tag}" if len(speeds) > 1 else f"kokoro-{args.voice}-{slug}"
            wav_path = out_dir / f"{stem}.wav"
            mp3_path = out_dir / f"{stem}.mp3"

            if mp3_path.exists():
                print(f"[r5] {stem} SKIP (mp3 exists)")
                continue

            if args.stable_passage:
                if not src_path.exists():
                    print(f"[r5] SKIP {slug} — {src_path} missing")
                    continue
                text = src_path.read_text()
                print(f"[r5] voice={args.voice} speed={speed} slug={slug} input_words={len(text.split())}")
                stats = synth_stable(pipeline, text, args.voice, speed, wav_path, mp3_path)
            else:
                kokoro_txt = src_path / "kokoro.txt"
                chapters_stub = src_path / "chapters.json"
                if not kokoro_txt.exists() or not chapters_stub.exists():
                    print(f"[r5] SKIP {slug} — kokoro.txt or chapters.json missing under {src_path}")
                    continue
                text = kokoro_txt.read_text()
                titles = [c["title"] for c in json.loads(chapters_stub.read_text())]
                chapters_path = out_dir / f"{stem}.mp3.chapters.json"
                print(f"[r5] voice={args.voice} speed={speed} slug={slug} input_words={len(text.split())} titles={len(titles)}")
                stats = synth_full(
                    pipeline, text, args.voice, speed, titles, wav_path, mp3_path, chapters_path
                )

            stats["slug"] = slug
            results.append(stats)
            print(
                f"[r5]   elapsed={stats['elapsed_s']:.1f}s audio={stats['audio_s']:.1f}s "
                f"rtf={stats['rtf']:.3f} segments={stats['segments']} -> {mp3_path.name}"
            )

    print("\n[r5] Summary:")
    print(f"  {'voice':<10} {'speed':>6} {'slug':<30} {'elapsed':>9} {'audio':>9} {'rtf':>6}")
    for r in results:
        print(
            f"  {r['voice']:<10} {r['speed']:>6.2f} {r['slug']:<30} "
            f"{r['elapsed_s']:>8.1f}s {r['audio_s']:>8.1f}s {r['rtf']:>6.3f}"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
