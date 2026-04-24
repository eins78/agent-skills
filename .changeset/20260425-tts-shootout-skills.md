---
"@eins78/agent-skills": minor
---

Add `text-to-audio` and `private-podcast-feed` skills from tts-shootout R4–R5

`text-to-audio`: wrapper script (`synth-audio.sh`) that takes a text document and
outputs MP3. Currently backed by Kokoro-82M; backend is config-swappable. Includes
Kokoro-specific prosody config (stress hints, phoneme dict, em-dash chunking, list
prosody). Bundled Python pipeline extracted from experiments/tts-shootout.

`private-podcast-feed`: private RSS+MP3 feed for self-subscription with
`itunes:block`, token-prefixed URLs, ID3 CHAP/CTOC chapters, and Overcast ping.
Covers the `podcast@2.0.1` named-export gotcha and `customElements` pattern for
`itunes:block` (typed `FeedITunes` interface omits this field).

Extracted from `eins78/home-workspace` experiments/tts-shootout (Rounds 4–5, 2026-04).

<!--
bumps:
  skills:
    text-to-audio: minor
    private-podcast-feed: minor
-->
