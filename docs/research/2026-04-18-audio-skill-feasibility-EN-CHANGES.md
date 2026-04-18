# Changes: EN-only scope update

**Date:** 2026-04-18
**Scope:** Operator decision — English-only target language, effective immediately.
**Dossier updated:** [`2026-04-18-audio-skill-feasibility-EN.md`](./2026-04-18-audio-skill-feasibility-EN.md)
**Original (multilingual):** [`2026-04-18-audio-skill-feasibility.md`](./2026-04-18-audio-skill-feasibility.md)

---

## If you're reading only this

The original dossier recommended Piper as the primary TTS engine because it was the only OSS tool with German out-of-the-box. That single advantage is now irrelevant. In the English-only frame, the ranking reshuffles to quality-on-M4-Pro as the primary axis: Kokoro-82M moves from runner-up to primary (strongest English samples, documented MPS, Apache-2.0), Dia becomes a strong #2 if its 1.6B-param MPS speed passes a latency test (native MP3 output is a real pipeline win), and Piper drops to a reliable fallback. A targeted check of four previously-cut candidates found one ALSO-RAN (MeloTTS) and three CUTS. A HuggingFace scan surfaced one genuine new entrant (Qwen3-TTS, Apache-2.0, January 2026) as a "watch" candidate. The delivery mechanism, transformation conventions, and engagement sections are unchanged — none of them were language-dependent.

---

## Ranking change

| | Original (EN+DE scope) | Updated (EN-only scope) |
|-|------------------------|-------------------------|
| **#1** | Piper — only OSS tool with German out-of-box; ONNX CLI headless | **Kokoro-82M** — strongest EN samples; documented MPS; German penalty gone |
| **#2** | Kokoro-82M — stronger EN samples; no German | **Dia** — if 1.6B MPS speed passes R8; native MP3 output is pipeline win |
| **#3 fallback** | Wait/defer | **Piper** — ONNX native CLI; freshest fork (v1.4.2, 2026-04-02); safe fallback if Kokoro/Dia MPS underperforms |

---

## Requirements change

| Req | Original | Updated |
|-----|----------|---------|
| R7 | Multilingual (English + German) — **Medium** | **English only** — operator decision 2026-04-18 (DEC-6 resolved). No multilingual requirement. |

---

## Ballot DEC changes

| DEC | Original recommended answer | Updated |
|-----|-----------------------------|---------|
| **DEC-3** TTS primary | (A) Piper — only clean OSS with German | **(B) Kokoro-82M** — best EN quality, documented MPS; Piper as fallback if latency fails |
| **DEC-6** Language support | (B) EN + DE recommended | **✅ Resolved by operator: English only.** Question closed. |

DEC-1, DEC-2, DEC-4, DEC-5, DEC-7, DEC-8 are unchanged from the original ballot.

---

## New candidates — EN-only round verdicts

### Bark (suno-ai/bark) — CUT

| Attribute | Detail |
|-----------|--------|
| License | MIT |
| Last commit | 2024-08-19 — **20 months stale** (outside 18mo threshold) |
| Apple Silicon | Undocumented |
| Headless | CLI + Python API |
| Output | WAV only |
| EN quality | "Highly realistic" per README; 100+ voice presets; known ~13s output window limitation |

**Verdict: CUT.** Repository is effectively abandoned. The 18-month stale threshold exists because inference code bit-rots against evolving torch and CUDA/MPS APIs; a 20mo gap is a production risk.

---

### StyleTTS 2 (yl4579/StyleTTS2) — CUT

| Attribute | Detail |
|-----------|--------|
| License | MIT (note: some sources misidentify as Apache-2.0) |
| Last commit | 2024-08-10 — **20 months stale** |
| Apple Silicon | Undocumented |
| Headless | Ambiguous — GPL caveat on main inference path noted in repo docs |
| Output | WAV |
| EN quality | "Human-level synthesis" claimed; ICLR 2024 paper |

**Verdict: CUT.** Stale same as Bark. The headless story is additionally muddied by a GPL licensing caveat on the primary inference path in the repo's own documentation — requires further investigation before production use.

---

### OpenVoice (myshell-ai/OpenVoice) — CUT

| Attribute | Detail |
|-----------|--------|
| License | MIT |
| Last commit | 2025-04-19 — 12 months (active) |
| Apple Silicon | Undocumented (PyTorch CPU implied) |
| Headless | **Jupyter-primary**: demo_part1-3.ipynb; no documented CLI or importable headless API |
| Output | WAV (implied) |
| EN quality | Zero-shot voice cloning; MIT/Tsinghua backing |

**Verdict: CUT.** Active repo and interesting voice-cloning capabilities, but fails R2 (headless requirement) — the primary documented usage pattern is Jupyter notebooks, and there is no CLI or documented Python import for server-side headless use. Worth re-checking in 6 months if the community produces a wrapper.

---

### MeloTTS (myshell-ai/MeloTTS) — ALSO-RAN

| Attribute | Detail |
|-----------|--------|
| License | MIT |
| Last commit | 2024-12-24 — 15.8 months (barely active) |
| Apple Silicon | **Undocumented** — Docker recommended for "some macOS users"; CPU real-time claimed |
| Headless | `melo`/`melotts` CLI + Python API — confirmed ✓ |
| Output | WAV (+ffmpeg for MP3) |
| EN | 4 accents: US, British, Indian, Australian |
| Voice quality | Limited comparative evidence |

**Verdict: ALSO-RAN.** Passes license and headless requirements. Apple Silicon path is the open question — the Docker recommendation for macOS suggests native M4 Pro MPS support may not work cleanly. Worth a quick benchmark if Kokoro, Dia, and Piper all fail MPS or latency tests.

---

## HuggingFace scan

**Scope:** TTS models sorted by recent activity / downloads; search for "text-to-speech apple silicon"; HF trending TTS spaces; coverage check against the full already-evaluated list.

**New finds:**

- **Qwen3-TTS** (Qwen Team, Apache-2.0, January 2026): 3.4M downloads across variants; 16 languages; community MLX + ONNX ports available for Apple Silicon. Not enough production track record for a top-3 recommendation today — the MLX port maturity is unverified. **Listed in Further Reading as a Watch candidate.**

- **VoxCPM2** (OpenBMB, Apache-2.0, April 2026): Most-trending TTS at time of scan; diffusion-based; 34+ languages. Too new for any evaluation. **Listed in Further Reading.**

**Confirmed coverage:** Top downloaded/trending HF TTS models are derivatives or ports of already-evaluated models (Kokoro fine-tunes, Piper voice packs, F5-TTS variants), or carry non-commercial licenses (Voxtral CC-BY-NC-4.0, disqualified on R1). No hidden gems that would displace the top-3.

**Non-TTS models found (out of scope for this dossier):** Several speech-understanding / ASR models appeared in search results (Whisper variants, Wav2Vec2 fine-tunes) — out of scope (STT, not TTS). Noted here for completeness.

---

## Apple Notes "AI Tools" folder cross-reference

**Negative finding.** The "AI Tools" folder referenced by the operator was not found in the current Apple Notes structure. Full enumeration of all iCloud Notes folders (top-level: Archive/Cold Storage, Clothing, Collections, Food, Fun, GIdeas, Ideas, Logs, Notes, NTS178, Quatico, Quick Notes, Recently Deleted, Research, Tech, Velo, WohnungF16, ZHdK; nested: Collections/Clothing, Collections/Tech, Collections/Velo) confirmed no "AI Tools" folder exists. Manual inspection of note titles in Tech, Research, and Ideas folders found no TTS-relevant bookmarks. **No candidates added from this source.**

---

## Unchanged sections

The following sections of the dossier are identical to the original (no language dependency):

- §Key Concepts (glossary)
- §Current State (workflow critique of existing tools)
- §Transformation Conventions (7 markdown→audio rules)
- §Delivery Mechanism (Telegram path, podcast feed path, routing heuristic)
- §Engagement (floor check paragraph)
- §Podcast-client auth table
- §RSS metadata mapping

These sections are copy-stable and do not need re-review.
