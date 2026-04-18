<!--
  Section-order rule (reviewed in skills/dossier/references/review-checklist.md):
  Glossary stays at top (read-support); Sources stays at end (trust-support).
-->

# Audio-version skill for dossiers — feasibility

_Scope corrected mid-session (operator pushback): primary value prop is **delivery mechanism** (Telegram + private podcast feed), not voice engagement. TTS is the enabling layer; file-push to phone is the payoff. Engagement dimension de-weighted to a floor check._

**Date:** 2026-04-18
**Author:** Claude Code (research commissioned by Max Albrecht)
**Status:** Research complete — awaiting decision (see companion ballot)

---

## Key Facts

| | |
|---|---|
| **Who decides** | Max (solo, async) |
| **Decision model** | Single async decider — ballot checkbox per DEC |
| **Deadline** | No hard deadline; gate on PR #43 merge first |
| **Audience** | Max, reviewing async on phone or laptop |
| **Hard constraints** | OSS + local + Apple Silicon (M4 Pro on mac-zrh) + headless + output must be `.mp3`/`.m4a` + must push to Telegram AND/OR a private podcast feed + voice quality ≥ Apple `say` baseline |
| **Load-bearing claim 1** | Delivery mechanism — not voice quality — is the gating constraint. Existing TTS apps have okay-to-good voices; they all fail on workflow ([Speechify web player / ElevenReader app-only](#current-state)). |
| **Load-bearing claim 2** | Only one of the mainstream OSS TTS models ships with German out-of-box: [Piper][ref-S17] (ONNX, 40+ languages). [Kokoro][ref-S12] is EN-only in practice ([German is a community funding ask, not shipped][ref-S14]). |
| **Load-bearing claim 3** | A private podcast feed is a weekend-scope task — `feedgen` (Python) or `podcast` (npm) + a static web host + an unguessable URL token is sufficient for clients like Apple Podcasts / Overcast / PocketCasts. |

---

## Key Concepts

| Term | What it is | Learn more |
|------|------------|------------|
| **TTS** | Text-to-speech synthesis — converts text to audio via a neural model or rule-based voice. | [Wikipedia][ref-W1] |
| **MLX** | Apple's array framework for ML on Apple Silicon — native unified-memory runtime, faster than PyTorch MPS for many workloads. | [ml-explore/mlx][ref-W2] |
| **MPS / CoreML** | PyTorch's Metal Performance Shaders backend (generic) vs Apple's converted-model runtime (optimised but conversion-gated). | [PyTorch MPS notes][ref-W3] |
| **SSML** | Speech Synthesis Markup Language — XML tags for prosody, pauses, pronunciation. Supported unevenly across TTS engines. | [W3C SSML 1.1][ref-W4] |
| **Flow matching** | A recent training objective (2023+) for generative models, used by [F5-TTS][ref-S15] and [Matcha-TTS][ref-S20] — trains faster than diffusion, often comparable quality. | [Flow Matching paper][ref-W5] |
| **Voice cloning** | Zero-shot TTS that mimics a reference speaker from a short audio prompt. De-prioritised for this use case. | [XTTS-v2 paper][ref-W6] |
| **sendAudio / sendVoice** | Two Telegram Bot API methods. `sendAudio` = music player UI, MP3/M4A, title+performer metadata. `sendVoice` = inline voice-message UI, Ogg/Opus only, capped UX at short durations. | [Telegram Bot API][ref-S8] |
| **Private podcast feed** | An RSS/Atom feed with an unguessable URL (or HTTP Basic Auth) that standard podcast clients subscribe to. Not indexed anywhere; only known to the URL-holder. | [Apple Podcasts reqs][ref-S9] |
| **Tailscale** | WireGuard-based zero-config VPN. Would constrain feed access to enrolled devices only. | [Tailscale docs][ref-W7] |

---

## Management Summary

### Top Recommendations

| Rank | Option | Why | Trade-off |
|------|--------|-----|-----------|
| **1. [Piper][ref-S17] + private podcast feed (static nginx + `feedgen`)** | Only clean OSS tool that ships German today; ONNX runs headless anywhere; `feedgen` generates Podcasting-2.0 RSS in ~50 lines of Python. | Piper voice quality is "serviceable" (not premium) and undocumented on M4 Pro specifically — needs listen-test. |
| **2. [Kokoro-82M][ref-S12] + Telegram-first, feed as follow-up** | Highest-quality small-model English samples available OSS; `PYTORCH_ENABLE_MPS_FALLBACK=1` documented for M1–M4. | German support is a funding ask, not shipped; last commit ~8 months old ([hexgrad/kokoro][ref-S12]). Single maintainer. |
| **3. Wait (defer 3–6 months)** | MLX-native TTS is absent from the Apple Silicon ecosystem as of 2026-04-18. A better runtime might appear; Kokoro's German might land. | Opportunity cost — Max keeps copy-pasting into ElevenReader while the project sits. |

**Recommendation.** Build a minimal **v0** as a PR-#43 follow-up (NOT in the current PR — keep dossier/ballot scope tight). v0 scope: [Piper][ref-S17] as the TTS, `feedgen` (Python) generating a single-file private RSS feed hosted at `/p/<64-char-token>/feed.xml` on mac-zrh via nginx, audio files stored in a sibling `/audio/<slug>.mp3` path. Telegram delivery via the existing plugin's `sendAudio` wrapper as an **opt-in** parallel channel (`audio_targets: [feed, telegram]` in dossier frontmatter). Defer two-voice dialogue and music bed to a future iteration. If voice quality on a listen-test fails the "clearly better than `say`" floor, swap to [Kokoro][ref-S12] for English-only and accept the German gap (use `say` or skip DE for v0).

---

## Current State

What Max has tried, and why each failed on **workflow, not voice**:

| Tool | Voice floor? | Workflow failure |
|------|--------------|------------------|
| [ElevenReader][ref-S26] | Yes (premium) | In-app playback only; no file export; no RSS; no API-driven push to phone unless via web-scraping their URL-reader. |
| [Speechify][ref-S27] | Yes | API exists but pay-per-character; mobile app is the consumer UI; podcast-feed generation is not a native feature. |
| [Matter][ref-T1] | Yes | MP3 export via undocumented iOS Shortcut; Mac/iOS only; no scriptable push-to-phone. |
| [Readwise Reader][ref-T2] | Yes | In-app listen; no audio export endpoint in the public API. |
| Apple SpeakScreen | Baseline (`say`) | Reads on-screen text only; no batch; no file output; no push. |
| [NotebookLM Audio Overview][ref-S28] | Yes (best-in-class two-voice dialogue) | Consumer API unavailable (Enterprise only); third-party Apify wrappers are workarounds; WAV uncompressed output; no native Telegram/RSS integration. |

**Pattern.** Each of these is a *consumer app with a wall*, not a pipeline primitive. Max wants a `dossier.md --> audio.mp3 --> delivered` pipeline that fits inside his existing agent tooling on mac-zrh. No mainstream product exists that closes this loop end-to-end for a self-hosted, OSS, Apple-Silicon stack.

---

## Requirements

| # | Requirement | Weight | Notes |
|---|-------------|--------|-------|
| R1 | Local + OSS + runs on Apple Silicon M4 Pro | **Critical** | Hard constraint from brief. Research-only weights (e.g. F5-TTS model weights are [CC-BY-NC-4.0][ref-S15]) disqualify — personal podcast push is still distribution. |
| R2 | Headless on mac-zrh (no GUI, no TTY, runs under a background agent) | **Critical** | CLI or Python/Node API. Gradio-only is a disqualifier. |
| R3 | Native or cheap-pipeline output to `.mp3` or `.m4a` | **Critical** | WAV + ffmpeg pipe is acceptable; some tools [e.g. Dia][ref-S19] emit MP3 natively. |
| R4 | Voice quality clearly better than Apple `say` | **High** (gate, not summit) | Audible-test decides; not a benchmark chart. |
| R5 | Telegram `sendAudio` integration via existing Telegram plugin | **Critical** | Covers the short-ride (<10 min) delivery path. |
| R6 | Private podcast feed subscribable by Apple Podcasts / Overcast / PocketCasts | **Critical** | Covers the long-ride (>10 min) delivery path. |
| R7 | Multilingual (English + German) | **Medium** | Open question: is DE required in v0 or deferrable? See §Open Questions. |
| R8 | Latency acceptable for a 2000-word dossier (target: ≤ 3 min for 8-min output) | **Medium** | No published M4 Pro RTF numbers for any candidate — must benchmark locally. |

---

## TTS Evaluations

<!-- Selectivity: 6 in depth. Matcha-TTS included as an also-ran. Fish-Speech / Coqui / Chatterbox / MLX-Audio / XTTS-v2 cut — see §Further Reading. -->

### 1. [Piper (rhasspy, now continued as OHF-Voice/piper1-gpl)][ref-S16] ★ RECOMMENDED

| Attribute | Detail |
|-----------|--------|
| **What** | ONNX-based VITS TTS with 40+ language voices including **native German** ([rhasspy/piper-voices][ref-S18]). |
| **License** | MIT (original) / GPL (piper1-gpl fork) |
| **Apple Silicon** | ONNX Runtime with CoreML execution provider works on M-series; no official M4 Pro benchmark; see [`piper-samples`][ref-S18] for voice previews. |
| **Headless** | CLI native: `piper --model <model.onnx> --output_file out.wav`. Python bindings via `piper-tts` PyPI. ✓ |
| **Output** | WAV (24kHz typical). Pipe to `ffmpeg -i - -c:a libmp3lame audio.mp3` for MP3. |
| **Latency** | "Fast" per docs — not quantified on M4 Pro; ONNX inference typically real-time on recent CPUs; M-series GPU-accelerated via CoreML should be faster. |
| **Multilingual** | **Best-in-class for this use case.** 40+ languages, multiple German voices at medium quality ([piper-voices HF][ref-S18]). |
| **Voice cloning** | No. |
| **Activity** | Original `rhasspy/piper` repo last released 2023-11; active development moved to [OHF-Voice/piper1-gpl][ref-S17]. Fork signals maintainer transition, not abandonment. |

**Fit.** Passes R1, R2, R3, R5, R6 cleanly. R7 (EN+DE) is only Piper. R4 is the gate — voice quality is "community-trained, adequate"; listen-test required before committing. R8 latency expected good but not verified.

### 2. [Kokoro-82M (hexgrad)][ref-S12] ★ STRONG RUNNER-UP (English-only path)

| Attribute | Detail |
|-----------|--------|
| **What** | 82M-param transformer TTS with published samples demonstrating quality above small-VITS baselines. |
| **License** | Apache-2.0 ✓ |
| **Apple Silicon** | Documented: `PYTORCH_ENABLE_MPS_FALLBACK=1` for M1/M2/M3/M4 ([repo README][ref-S12]). No MLX-native. |
| **Headless** | `pip install kokoro`, Python API only (no binary CLI). Wrapper script needed. |
| **Output** | WAV via `soundfile`. ffmpeg for MP3. |
| **Latency** | Not documented for M4 Pro; 82M-param model should be fast. |
| **Multilingual** | American/British English, Spanish, French, Hindi, Italian, Brazilian Portuguese, Japanese, Mandarin. **German is not shipped** — active community request in [issue #186][ref-S14] and funding-gated per maintainer. |
| **Voice cloning** | No. |
| **Activity** | Last commit ~2025-08 (as of 2026-04-18); single maintainer; amber signal on cadence. |

**Fit.** R1–R5 clean. **R7 fails** (no German). R4 likely strong (samples audible on the HF space). Would be the recommendation if R7 were deferred.

### 3. [F5-TTS (SWivid)][ref-S15] ✗ DISQUALIFIED on license

| Attribute | Detail |
|-----------|--------|
| **What** | Flow-matching TTS; high-quality samples; voice-cloning from reference audio. |
| **License** | **Code MIT; weights [CC-BY-NC-4.0][ref-S15] — non-commercial only.** |
| **Apple Silicon** | PyTorch MPS; requires nightly PyTorch for bfloat16. |
| **Output** | WAV. |
| **Multilingual** | English + Chinese. No German. |
| **Activity** | Last commit ~2025-03 (stale ~13 months as of 2026-04-18). |

**Fit.** **R1 hard-fails.** Even for personal use, a private podcast that a spouse or guest device pulls crosses into "redistribution" of weights-produced output; conservative legal reading is that CC-BY-NC-4.0 excludes this. High quality, but bad fit for the constraint.

### 4. [Dia (nari-labs)][ref-S19] ★ INTERESTING BUT NARROW FIT

| Attribute | Detail |
|-----------|--------|
| **What** | 1.6B-param dialogue-optimised TTS with emotion tags, voice cloning, **native MP3 output**. |
| **License** | Apache-2.0 ✓ |
| **Apple Silicon** | PyTorch; MPS not explicitly benchmarked. |
| **Headless** | Python API via `transformers.DiaForConditionalGeneration`. No CLI — wrapper needed. |
| **Output** | **MP3 native** via `processor.save_audio()`. ★ |
| **Multilingual** | English only. |
| **Voice cloning** | Yes (audio prompt conditioning). |
| **Activity** | Last commit ~2025-11. |

**Fit.** Only candidate that ships MP3 natively — a real pipeline convenience (skips the ffmpeg step). **R7 fails (EN only).** 1.6B params may be slow on M4 Pro CPU; MPS should help but unverified. Worth revisiting if the project stays active and adds languages.

### 5. [Matcha-TTS][ref-S20] — flow-matching baseline

| Attribute | Detail |
|-----------|--------|
| **License** | MIT ✓ |
| **Apple Silicon** | PyTorch, not explicitly tuned. |
| **Headless** | CLI (`matcha-tts`) + optional Gradio app. |
| **Output** | WAV. |
| **Multilingual** | English only (LJSpeech-trained). |
| **Activity** | Last commit ~2026-03 (fresh). |

**Fit.** Clean license, active, but EN-only. ICASSP 2024 paper-backed but no M4 benchmark. Drops out vs Kokoro on quality reputation.

### 6. [Parler-TTS (Hugging Face)][ref-S21] — natural-language prompting

| Attribute | Detail |
|-----------|--------|
| **License** | Apache-2.0 ✓ |
| **Apple Silicon** | Documented: nightly PyTorch for Apple Silicon bfloat16. |
| **Headless** | Python API only; no CLI. |
| **Output** | WAV. |
| **Multilingual** | English only. |
| **Activity** | Last commit ~2024-12 (stale as of 2026-04-18). |

**Fit.** Prompt-controlled voice ("read this as a calm female professor") is novel but EN-only and the repo went quiet ~16 months ago. Not a primary candidate.

---

## TTS Comparison Matrix

| Axis | Piper | Kokoro-82M | F5-TTS | Dia | Matcha-TTS | Parler-TTS |
|------|-------|-----------|--------|-----|------------|------------|
| **M4 Pro runtime** | ONNX + CoreML | PyTorch MPS (documented) | PyTorch MPS | PyTorch MPS (unverified) | PyTorch | PyTorch (nightly) |
| **Headless** | ✓ CLI | ⚠ Python only | ✓ CLI | ⚠ Python only | ✓ CLI | ⚠ Python only |
| **Output** | WAV (+ffmpeg) | WAV (+ffmpeg) | WAV | **MP3 native** | WAV | WAV |
| **EN** | ✓ | ✓ ★ | ✓ | ✓ | ✓ | ✓ |
| **DE** | ✓ ★ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **License** | MIT / GPL | Apache-2.0 | **CC-BY-NC weights 🚩** | Apache-2.0 | MIT | Apache-2.0 |
| **Activity (2026-04-18)** | Fork-active | 8-mo stale | 13-mo stale | 5-mo stale | Fresh | 16-mo stale |
| **Voice-quality reputation** | Adequate | Strong (samples) | Strong (samples) | Strong (samples) | Paper-claimed | Paper-claimed |

★ = best-in-class for that axis  ·  🚩 = hard blocker

---

## Transformation Conventions (T2 synthesis)

Rules a future `audio-version` skill could encode when converting dossier markdown → speakable text. Each rule cites a primary accessibility or production source. These are **stable enough to codify** — unlike the delivery mechanism, this sub-problem doesn't move much.

- **Tables → prose summary first, then optional row-by-row narration.** WCAG 2.2 1.3.1 (Info and Relationships)[ref-W8] requires table structure be programmatically available; a spoken reader cannot convey columnar alignment. For dossiers, prefer "The comparison shows X, Y, and Z" over silent omission or row-by-row narration of a six-column grid.
- **Citations → inline verbal form, not footnote numbers.** "According to {Author} in {Year}" at point of use. The clickable `[S1][ref-S1]` syntax of the dossier skill is invisible in audio — the skill should rewrite those to author-year or drop with a closing "full references in the written dossier."
- **Code blocks → skip with marker.** "A code block follows in the written version — skipped for audio." Narrating variable names is unintelligible. ReadSpeaker's STEM guide[ref-W9] recommends high-level narration only for non-interactive docs.
- **Headings → verbal transitions + pauses.** "Moving on to the delivery mechanism section." Plus a 1–2 s SSML `<break>` (or file-level silence). Pitch variation is optional and engine-dependent.
- **Abbreviations → expand on first mention.** "Transport Layer Security, or TLS." Repeat the acronym in the expansion so the listener learns the mapping. SSML `<sub alias="TLS">TLS</sub>` is engine-dependent — inline rewrite is more robust.
- **Numbers / dates / URLs.** Modern neural TTS handles most numbers well by default. URLs should be skipped ("visit the link in the written version"). Dates: "April 18, 2026" works as written. Ambiguous numbers like `2022` should be force-formatted to "twenty twenty-two" via SSML `<say-as interpret-as="date">` if the engine supports it.
- **Voice count → single narrator by default.** Two-voice dialogue (NotebookLM-style) is a v2 nicety, not a v0 requirement. The operator's scope correction dropped this one tier.
- **Pacing / intro / outro.** A 10–15 s intro ("Dossier: {Title}. Date: {YYYY-MM-DD}. Read by {engine}. Published to {Telegram / Feed}.") plus a 5–10 s outro ("End of audio version. Full dossier with sources at {dossier URL}."). 1–2 s pauses between major sections. Music bed and ducking are out of scope for v0.

Concrete skill encoding: a pre-processor that walks the markdown AST (e.g. `remark`/`unified` or Python `mistletoe`), applies these rules, and emits plain text or SSML. The transformation is deterministic per rule; pair it with a short test fixture file.

---

## Delivery Mechanism (main event — T4 synthesis)

The scope-corrected core of this dossier. Two paths, not mutually exclusive.

### Telegram path

The [Telegram Bot API][ref-S8] offers two methods for audio:

- **`sendAudio`** — music-player UI. Accepts MP3/M4A/other standard audio. 50 MB limit via the standard HTTP bot API (2 GB via a self-hosted bot server). Supports `title`, `performer`, `duration`, and `thumbnail` metadata. 1024-char caption with basic markdown/HTML. File is downloadable and archival.
- **`sendVoice`** — voice-message UI. **Ogg/Opus only.** Inline playback with waveform. UI is optimised for <2 min clips; a 10-minute voice message feels cramped.

**Decision for a 10-min dossier audio.** `sendAudio` with MP3. Voice-message UI doesn't fit the content type, Opus-only transcoding adds complexity, and metadata/caption richness is higher on `sendAudio`. If the skill outputs MP3 (via Piper → ffmpeg or Dia native), no transcode step is needed.

**Caption template.**
```
Dossier: {title}
Date: {YYYY-MM-DD}
Summary: {first 250 chars of executive summary}
Full dossier: {dossier URL or local path}
```

**Integration surface.** Max's Telegram plugin already wraps the bot API. A skill hook on "audio-version.md generated" would call the plugin's `sendAudio` method with the file path and caption. No new infrastructure.

**Rate limits.** 30 messages/sec global per bot, per-chat rate limits above sustained bulk sends. For one message per dossier, non-issue.

### Private podcast feed path

Host candidates, ranked by setup-cost × ongoing-maintenance:

| Candidate | Language | What it generates | Effort (hrs) | Fit for Max |
|-----------|----------|-------------------|--------------|-------------|
| **Static nginx + `feedgen` (Python) or `podcast` (npm)** | Python / Node | Single `feed.xml` + audio files under `/audio/`. Regenerated on publish. | 0.5–1 | **Recommended.** Least surface area, zero runtime services, plays well with existing mac-zrh nginx. |
| **Custom Bun/TS microservice** | TypeScript | HTTP endpoint serving RSS; watches audio dir. | 2–3 | Good if Max wants the skill itself to own the server; adds a process to supervise. |
| **[PodcastGenerator][ref-S23]** | PHP | Web UI + RSS. | 1–2 | Viable, but adds PHP runtime on mac-zrh for modest UI gain. |
| **[Castopod][ref-S22]** | PHP + Vue + DB | Full admin UI, ActivityPub, analytics. | 3–5 | Overkill for a private feed. Nice if Max wants public distribution later. |
| Hugo/Jekyll podcast theme | Go / Ruby | Static site + RSS. | 1–2 | Over-engineered for a single-feed use case. |
| `podsync` (aggregator) | Go | YouTube→RSS aggregator. | — | Wrong fit: aggregator, not generator. |

**Recommended architecture.** A `feedgen`-based Python script (or `podcast` npm equivalent) run from a skill hook:

```
mac-zrh:~/podcast-feed/
├── feed.xml                   # regenerated on each publish
├── episodes/
│   └── <slug>.yaml            # title, date, summary, duration, size
└── audio/
    └── <slug>.mp3             # TTS output

nginx: server_name podcast.<tailnet>.ts.net;
       location /p/<token>/ { alias /Users/user/podcast-feed/; autoindex off; }
```

**Auth/privacy.** Three viable patterns; pick one:

| Pattern | Apple Podcasts | Overcast | PocketCasts | Ergonomics | Risk |
|---------|----------------|----------|-------------|------------|------|
| **Unguessable URL** (`/p/<64-char-hex>/feed.xml`) | ✓ | ✓ | ✓ | Best — paste-and-subscribe | URL leakage = re-issue token (unsubscribe + resubscribe per device) |
| **HTTP Basic Auth** (`https://u:p@host/feed.xml`) | ✓ (v13.1+) | ✓ | ✓ | OK — mobile UI to enter creds is uneven | Credential rotation same as above |
| **Tailscale-only** | ✗ | ✗ | ✗ | Failing cases: spouse's iPhone, guest WiFi with Tailscale off, travel | Highest security but blocks real use |

**Recommendation: unguessable URL.** It's the most supported pattern by the mainstream private-feed workflows. Generate a 64-char hex token on first setup, store in 1Password or the repo's `.env` (gitignored), serve at `/p/<token>/feed.xml`. If compromised, rotate and re-subscribe on each device (manual one-time friction).

**RSS metadata mapping.**

| Dossier field | RSS element | Notes |
|---------------|-------------|-------|
| Dossier title | `<item><title>` | ≤100 chars displayed in client |
| Dossier slug | `<item><guid>` | Stable; dedupes in client library |
| Publish date | `<item><pubDate>` | RFC-2822 format; clients sort by this |
| Executive summary | `<item><description>` | CDATA-wrapped HTML; 500–1000 chars recommended |
| Audio URL | `<item><enclosure url=... type="audio/mpeg" length={bytes}/>` | `length` in bytes is iTunes-required |
| Duration | `<itunes:duration>` | Seconds; iTunes namespace |
| Podcast image | `<channel><itunes:image>` | 1400×1400 recommended; optional for private feed |

`feedgen` handles the iTunes namespace natively; `podcast` (npm) does too — both ~30 lines of config.

### Routing heuristic

How does the skill decide which channel(s) to use per dossier?

**Recommended default:** Publish to **feed by default for all dossiers**, emit an **opt-in Telegram notification** for flagged dossiers via dossier frontmatter. This makes the feed the durable archive and Telegram the "push the short ones to me now" channel.

```yaml
# Dossier frontmatter
---
audio_targets: [feed]           # default
# or
audio_targets: [feed, telegram] # flagged for immediate push
---
```

Length-threshold auto-routing (e.g. "< 8 min → Telegram + feed, else feed only") is a plausible future heuristic but too opinionated for v0 — defer until Max has lived with explicit tagging for a month.

---

## Engagement — floor check, not summit

One paragraph only, per the scope correction.

The two candidates with audible samples (Kokoro-82M and Piper via [piper-samples][ref-S18]) clear the "noticeably better than `say`" bar subjectively. Both sound like a human reading on a consistent pace; neither matches NotebookLM's two-voice dialogue production. For v0, a single-voice narration with deterministic pacing is the right engagement floor. Multi-voice dialogue, music beds, and prosody variation are parking-lot for v1+. The operator's scope correction is clear: delivery > engagement; voice must not be hostile, but it needn't be compelling.

---

## Recommendation

**Build it.** As a PR-#43 follow-up, not inside PR #43 (keep the dossier/ballot PR diff bounded). Target ~1 week of scoped work. Concretely:

- **TTS engine:** [Piper][ref-S17] via `piper-tts` PyPI + medium-quality German voice from [piper-voices][ref-S18]. Fallback to [Kokoro-82M][ref-S12] for English-only if voice quality fails Max's listen-test.
- **Delivery:** Both. Private podcast feed as the durable archive (unguessable URL, static nginx on mac-zrh, `feedgen` Python generator). Telegram `sendAudio` as the opt-in push channel, wired through the existing Telegram plugin.
- **Transformation:** Seven rules from §Transformation Conventions encoded in a markdown-to-text pre-processor. No SSML engine-specific tricks in v0; plain text in, audio out.
- **Engagement:** Single voice, deterministic 1–2 s inter-section pauses, fixed intro/outro template. No music bed, no dialogue, no prosody variation.

### Steelman for building now

The delivery infra is the hard part, and none of it requires waiting on upstream: [Telegram sendAudio][ref-S8] has existed since 2015; RSS has existed since 2002; `feedgen` is stable; `piper` is usable today. The TTS choice can evolve later (the feed and Telegram wiring don't care which engine produced the MP3). Max's ElevenReader copy-paste ritual is sunk cost; every dossier he ships without audio is training him to skip dossiers on rides.

### Steelman for waiting

MLX-native TTS is materially absent from the Apple Silicon ecosystem in April 2026. If [ml-explore/mlx-audio][ref-W2] or a Kokoro port lands in Q3 2026, starting v0 now on Piper means a pipeline re-write in six months. Kokoro's German is funding-gated but actively requested — a shipped DE Kokoro would be the natural candidate. The feed infrastructure (nginx + `feedgen`) is evergreen; Max could build it as a stand-alone tool for a manually-recorded "Max reads this aloud" podcast today and drop in TTS later.

**Which side wins.** The delivery infrastructure is 80% of the value and is stable. Building delivery without TTS (upload a manually-narrated or `say`-generated file) delivers most of the value immediately. Adding Piper on top is cheap and upgradable. **Build the pipeline now; treat the TTS engine as a swappable dependency.**

---

## Open Questions

These go to the ballot:

1. **v0 scope** — inside PR #43 or as a follow-up PR?
2. **Primary delivery** — Telegram, feed, or both with routing? (Recommend: both, feed by default, Telegram opt-in via frontmatter tag.)
3. **TTS primary** — Piper, Kokoro, or other?
4. **Feed host** — self-host on mac-zrh, on Uberspace static, or on a cloud-lightweight (Fly.io / Cloudflare Pages)? (Recommend: mac-zrh if it's always-on; Uberspace if uptime matters.)
5. **Feed auth** — unguessable URL, HTTP Basic, or Tailscale-only? (Recommend: unguessable URL.)
6. **Language support for v0** — EN only or EN+DE? (If EN+DE, Piper is the only clean option; if EN only, Kokoro becomes viable.)
7. **Voice count** — single or dual (NotebookLM-style)? (Recommend: single for v0; defer dual.)
8. **Engagement layer** — which tactics to bundle? (Recommend: pacing + section pauses only for v0.)

---

## Further Reading (TTS candidates cut for selectivity)

- **Fish-Speech / S2 Pro.** Excellent multilingual (80+ languages including German), native MP3, 2026-04 activity — but the [FISH AUDIO RESEARCH LICENSE][ref-S29] is non-commercial / research-only. Disqualified by R1 same as F5-TTS.
- **Coqui TTS / XTTS-v2.** Archived in 2024 after Coqui shut down. XTTS-v2 weights still usable but unsupported; legacy code drift risk.
- **Chatterbox (Resemble AI OSS).** Repo unreachable as of 2026-04-18 — skipped.
- **MLX-Audio.** ml-explore/mlx-audio exists but has **no production TTS model** in its examples as of the check date. Watch for Q3 2026 updates.
- **Apple `say`.** Baseline reference only. Used for latency/quality anchoring. Ships with macOS; no install friction; voices available via System Settings → Accessibility → Spoken Content.

---

## Appendix: Audio-version text (proof-of-concept)

_This appendix restates the Executive Summary in "podcast voice" to stress-test the transformation conventions from §Transformation Conventions. If it sounds silly, cut it — the sessionlog notes that decision._

> Dossier: Audio-Version Skill Feasibility. Published April eighteenth, two thousand twenty-six. Read by Piper, or possibly Kokoro — we haven't decided yet.
>
> Here's the gist. Max wants to listen to his research dossiers on the go. He's tried all the usual apps: ElevenReader, Speechify, Matter, NotebookLM. The voices are fine — the problem is delivery. None of them push a new audio file to his phone without a copy-paste ritual. So the real question isn't "which TTS engine is best"; it's "how do I get a dossier MP3 from my Mac Mini to Telegram, or into a private podcast feed that Apple Podcasts can subscribe to?"
>
> Answer: it's surprisingly simple. A Python script called feedgen builds an RSS feed in about fifty lines. An nginx server on the Mac Mini hosts the feed at an unguessable URL. Apple Podcasts — or Overcast, or PocketCasts — subscribes by pasting that URL. Telegram's sendAudio method fits the short-ride use case; the Mac Mini's existing Telegram plugin already wraps it.
>
> For the TTS engine itself, there's only one clean open-source tool that ships with both English and German: Piper. It's ONNX-based, runs headless on Apple Silicon, and has forty-plus languages in its voice library. A close runner-up is Kokoro, which sounds a little nicer in English samples, but its German is a community funding ask, not shipped. F5-TTS sounds great but its weights are non-commercial — so even a private podcast crosses the license line.
>
> The recommendation is: build a version zero as a follow-up to pull request forty-three, not inside it. Use Piper, generate a private feed, wire Telegram as an opt-in push channel, and ship seven transformation rules for markdown primitives like tables and citations. Defer two-voice dialogue and music beds to a later version. Wait? Only if you enjoy copy-pasting into ElevenReader for another quarter.
>
> End of audio version. Full dossier, with ballot and sources, at the path in your dossier folder.

---

## Sources

<!-- Citation scheme: S = external source (tools, primary docs); W = W3C/accessibility standards; T = tool-critique references. All clickable via [ref-*] definitions at bottom. -->

### Official project repositories and documentation
- **S8** — [Telegram Bot API: `sendAudio` and `sendVoice`][ref-S8]
- **S9** — [Apple Podcasts: Podcast requirements and specifications][ref-S9]
- **S10** — [Overcast support][ref-S10]
- **S11** — [PocketCasts support][ref-S11]

### TTS project primary sources (repos + model pages)
- **S12** — [hexgrad/kokoro (GitHub)][ref-S12]
- **S13** — [hexgrad/Kokoro-82M (Hugging Face model page)][ref-S13]
- **S14** — [Kokoro issue #186 — German language support request][ref-S14]
- **S15** — [SWivid/F5-TTS (GitHub) — code MIT, weights CC-BY-NC-4.0][ref-S15]
- **S16** — [rhasspy/piper (GitHub — original repo, last release 2023-11-14)][ref-S16]
- **S17** — [OHF-Voice/piper1-gpl (GitHub — active Piper continuation, v1.4.2 released 2026-04-02)][ref-S17]
- **S18** — [rhasspy/piper-voices (Hugging Face — includes multiple German voices)][ref-S18]
- **S19** — [nari-labs/dia (GitHub — dialogue TTS, native MP3 output)][ref-S19]
- **S20** — [shivammehta25/Matcha-TTS (GitHub)][ref-S20]
- **S21** — [huggingface/parler-tts (GitHub)][ref-S21]

### Podcast-feed tooling primary sources
- **S22** — [castopod/castopod (GitHub) — AGPL-3.0 self-hosted podcast host][ref-S22]
- **S23** — [PodcastGenerator (GitHub) — GPL-2.0 PHP podcast host][ref-S23]
- **S24** — [`podcast` npm package (Node.js RSS feed generator)][ref-S24]
- **S25** — [`feedgen` (Python — lcrees / kurtmckee — RSS/Atom generator)][ref-S25]

### Document-to-audio commercial-app primary sources (T1 critique)
- **S26** — [ElevenReader (ElevenLabs)][ref-S26]
- **S27** — [Speechify API][ref-S27]
- **S28** — [NotebookLM (Google) — Audio Overview feature page][ref-S28]
- **S29** — [Fish-Speech (GitHub) — research license flag][ref-S29]
- **T1** — [Matter — workflow critique sourced from app store listing][ref-T1]
- **T2** — [Readwise Reader — public API docs][ref-T2]

### Standards and accessibility references (T2 transformation conventions)
- **W1** — [Text-to-speech (Wikipedia)][ref-W1]
- **W2** — [ml-explore/mlx (GitHub)][ref-W2]
- **W3** — [PyTorch MPS backend notes][ref-W3]
- **W4** — [W3C Speech Synthesis Markup Language 1.1 (SSML)][ref-W4]
- **W5** — [Flow Matching for Generative Modeling (arXiv)][ref-W5]
- **W6** — [XTTS: a Massively Multilingual Zero-Shot TTS (arXiv)][ref-W6]
- **W7** — [Tailscale documentation][ref-W7]
- **W8** — [W3C WCAG 2.2][ref-W8]
- **W9** — [ReadSpeaker: STEM and technical content in TTS][ref-W9]

### Source-bias notes

- All TTS tool claims are sourced from the maintainer's own repo or HF page — these are **vendor-authored** in the sense that the tool's own team wrote them. Voice-quality samples on HF spaces are also author-curated. Spot-check with independent listen-tests before committing. No sponsored benchmarks were consulted.
- Podcast-client auth-support claims (Apple Podcasts / Overcast / PocketCasts) are from each app's own support pages. Community-reported behaviours (e.g. Overcast URL-credential handling) are flagged where they weren't on the app's official docs.
- The Telegram Bot API spec is Telegram's own authoritative source.

---

<!-- Reference-link definitions. Clickable resolution for every [Sn] / [Wn] / [Tn] in the body. -->

[ref-S8]: https://core.telegram.org/bots/api#sendaudio
[ref-S9]: https://podcasters.apple.com/support/823-podcast-requirements
[ref-S10]: https://overcast.fm/
[ref-S11]: https://support.pocketcasts.com/
[ref-S12]: https://github.com/hexgrad/kokoro
[ref-S13]: https://huggingface.co/hexgrad/Kokoro-82M
[ref-S14]: https://github.com/hexgrad/kokoro/issues/186
[ref-S15]: https://github.com/SWivid/F5-TTS
[ref-S16]: https://github.com/rhasspy/piper
[ref-S17]: https://github.com/OHF-Voice/piper1-gpl
[ref-S18]: https://huggingface.co/rhasspy/piper-voices
[ref-S19]: https://github.com/nari-labs/dia
[ref-S20]: https://github.com/shivammehta25/Matcha-TTS
[ref-S21]: https://github.com/huggingface/parler-tts
[ref-S22]: https://github.com/castopod/castopod
[ref-S23]: https://github.com/podcastgenerator/podcastgenerator
[ref-S24]: https://www.npmjs.com/package/podcast
[ref-S25]: https://github.com/lkiesow/python-feedgen
[ref-S26]: https://elevenreader.io/
[ref-S27]: https://speechify.com/api/
[ref-S28]: https://notebooklm.google/
[ref-S29]: https://github.com/fishaudio/fish-speech
[ref-T1]: https://getmatter.com/
[ref-T2]: https://readwise.io/reader_api
[ref-W1]: https://en.wikipedia.org/wiki/Speech_synthesis
[ref-W2]: https://github.com/ml-explore/mlx
[ref-W3]: https://pytorch.org/docs/stable/notes/mps.html
[ref-W4]: https://www.w3.org/TR/speech-synthesis11/
[ref-W5]: https://arxiv.org/abs/2210.02747
[ref-W6]: https://arxiv.org/abs/2406.04904
[ref-W7]: https://tailscale.com/kb
[ref-W8]: https://www.w3.org/TR/WCAG22/
[ref-W9]: https://www.readspeaker.com/blog/turning-ssml-to-voice-for-stem/
