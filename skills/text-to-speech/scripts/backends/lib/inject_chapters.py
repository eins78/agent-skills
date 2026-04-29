#!/usr/bin/env python3
"""Inject ID3v2 CHAP + CTOC chapter frames into an MP3.

Reads <mp3>.chapters.json (sibling file), writes ID3 chapter metadata
so podcast clients (Overcast, Apple Podcasts) can show skippable chapters.

Usage:
    inject_chapters.py <mp3_path> [--chapters <path>]

chapters.json schema:
    [
      {"start_ms": 0, "title": "Introduction"},
      {"start_ms": 125000, "title": "Kokoro overview"},
      ...
    ]

Chapters must be strictly increasing by start_ms. End time of chapter N
is set to start time of chapter N+1; the last chapter ends at the MP3's
total duration (read via mutagen).

Self-test: run with `--self-test` to write + read-back a synthetic MP3.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from mutagen.id3 import ID3, CHAP, CTOC, CTOCFlags, TIT2, Encoding
from mutagen.id3 import ID3NoHeaderError
from mutagen.mp3 import MP3


def load_chapters(chapters_path: Path) -> list[dict]:
    data = json.loads(chapters_path.read_text())
    if not isinstance(data, list):
        raise ValueError(f"chapters.json must be a JSON array, got {type(data).__name__}")
    for i, ch in enumerate(data):
        if "start_ms" not in ch or "title" not in ch:
            raise ValueError(f"chapter {i} missing start_ms or title: {ch!r}")
        if not isinstance(ch["start_ms"], int):
            raise ValueError(f"chapter {i} start_ms must be int ms, got {type(ch['start_ms']).__name__}")
    # Validate strictly increasing.
    for i in range(1, len(data)):
        if data[i]["start_ms"] <= data[i - 1]["start_ms"]:
            raise ValueError(
                f"chapter {i} ({data[i]['title']!r}) start_ms "
                f"{data[i]['start_ms']} not > previous {data[i - 1]['start_ms']}"
            )
    return data


def inject(mp3_path: Path, chapters: list[dict]) -> None:
    """Write CHAP + CTOC frames to the MP3 in place."""
    mp3 = MP3(str(mp3_path))
    total_ms = int(mp3.info.length * 1000)

    try:
        id3 = ID3(str(mp3_path))
    except ID3NoHeaderError:
        id3 = ID3()

    # Clear existing CHAP / CTOC frames — we don't want duplicates when
    # called idempotently. mutagen lets us drop by key.
    for key in list(id3.keys()):
        if key.startswith("CHAP:") or key.startswith("CTOC:"):
            del id3[key]

    element_ids: list[str] = []
    for i, ch in enumerate(chapters):
        eid = f"chp{i}"
        element_ids.append(eid)
        start = ch["start_ms"]
        end = chapters[i + 1]["start_ms"] if i + 1 < len(chapters) else total_ms
        if end <= start:
            raise ValueError(f"chapter {i} has non-positive duration: {start}..{end}")
        id3.add(
            CHAP(
                element_id=eid,
                start_time=start,
                end_time=end,
                start_offset=0xFFFFFFFF,
                end_offset=0xFFFFFFFF,
                sub_frames=[TIT2(encoding=Encoding.UTF8, text=[ch["title"]])],
            )
        )

    id3.add(
        CTOC(
            element_id="toc",
            flags=CTOCFlags.TOP_LEVEL | CTOCFlags.ORDERED,
            child_element_ids=element_ids,
            sub_frames=[TIT2(encoding=Encoding.UTF8, text=["Chapters"])],
        )
    )

    id3.save(str(mp3_path), v2_version=3)


def read_back(mp3_path: Path) -> list[tuple[int, int, str]]:
    """Return [(start_ms, end_ms, title), ...] for verification."""
    id3 = ID3(str(mp3_path))
    out: list[tuple[int, int, str]] = []
    for key, frame in id3.items():
        if not key.startswith("CHAP:"):
            continue
        title = ""
        for sub in frame.sub_frames.values():
            if isinstance(sub, TIT2):
                title = str(sub.text[0])
                break
        out.append((frame.start_time, frame.end_time, title))
    out.sort(key=lambda t: t[0])
    return out


def self_test() -> int:
    """Write a 3-chapter MP3, read it back, verify."""
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        mp3 = tmp / "test.mp3"
        # Generate 10s of silent MP3 via ffmpeg.
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
                "-t", "10",
                "-codec:a", "libmp3lame", "-b:a", "64k",
                str(mp3),
            ],
            check=True,
        )
        chapters = [
            {"start_ms": 0, "title": "Intro"},
            {"start_ms": 3000, "title": "Middle bit"},
            {"start_ms": 7000, "title": "Conclusion"},
        ]
        (mp3.with_suffix(mp3.suffix + ".chapters.json")).write_text(json.dumps(chapters))
        inject(mp3, chapters)
        got = read_back(mp3)
        print(f"[self-test] wrote + read back {len(got)} chapters:")
        for start_ms, end_ms, title in got:
            print(f"  {start_ms:>7} ms → {end_ms:>7} ms  {title!r}")
        expected_titles = [c["title"] for c in chapters]
        got_titles = [t for _, _, t in got]
        if expected_titles != got_titles:
            print(f"FAIL: titles mismatch: {expected_titles!r} vs {got_titles!r}", file=sys.stderr)
            return 1
        # Idempotency check: inject twice, count frames.
        inject(mp3, chapters)
        got2 = read_back(mp3)
        if len(got2) != len(chapters):
            print(f"FAIL: idempotency broken — got {len(got2)} frames after 2nd inject", file=sys.stderr)
            return 1
        print("[self-test] OK")
        return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("mp3", nargs="?")
    ap.add_argument("--chapters", help="path to chapters.json (default: <mp3>.chapters.json)")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    if not args.mp3:
        ap.error("mp3 path required (or --self-test)")

    mp3_path = Path(args.mp3)
    chapters_path = Path(args.chapters) if args.chapters else mp3_path.with_suffix(
        mp3_path.suffix + ".chapters.json"
    )

    if not mp3_path.exists():
        print(f"error: mp3 not found: {mp3_path}", file=sys.stderr)
        return 1
    if not chapters_path.exists():
        print(f"error: chapters.json not found: {chapters_path}", file=sys.stderr)
        return 1

    chapters = load_chapters(chapters_path)
    inject(mp3_path, chapters)
    got = read_back(mp3_path)
    print(f"[chapters] wrote {len(got)} chapter frames to {mp3_path}")
    for start_ms, end_ms, title in got:
        mm_ss = f"{start_ms // 60000:02d}:{(start_ms // 1000) % 60:02d}"
        print(f"  {mm_ss}  {title}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
