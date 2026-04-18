<!--
  Async-decision ballot for the audio-version skill feasibility dossier.
  Conventions: skills/ballot/SKILL.md; review: skills/ballot/references/review-checklist.md.
  Filename deviates from DOSSIER-<slug>-BALLOT-<Reviewer>.md convention because the
  parent dossier follows the flat docs/research/ pattern Max specified in the brief.
  ballot-filename.sh filter `DOSSIER-*BALLOT*.md` does not match — the gate is a no-op here.
-->

# Ballot — Audio-version skill feasibility

**Reviewer:** Max Albrecht
**Role:** Solo async decider (personal-repo owner)
**Full dossier:** [2026-04-18-audio-skill-feasibility.md](./2026-04-18-audio-skill-feasibility.md)

---

## How to use this ballot

- Tick the checkbox you choose. Boxes are **empty by default** — your tick is the decision.
- **Must** items block implementation. **Should** items steer v0 design. **Could** items are informational — tick to signal interest, leave blank to defer.
- If you want to change an already-ticked box, strike through and re-tick — a diff is cleaner than a rewrite.
- Reconciliation (walking each DEC and recording the outcome) happens in the sessionlog, not here.

---

## Must — before starting implementation

### DEC-1 — Where does v0 ship?

*Recommended: (B) Follow-up PR — keep the PR #43 dossier/ballot skill-evolution diff bounded; `audio-version` is a separate skill with its own scope.*

- [ ] (A) Ship v0 as a companion skill inside PR #43
- [ ] (B) Ship v0 as a follow-up PR after PR #43 merges
- [ ] (C) Not yet — defer 3+ months until MLX-native TTS matures

### DEC-2 — Primary delivery mechanism for v0

*Recommended: (C) Both, feed by default and Telegram opt-in per dossier — the feed is the durable archive; Telegram is the "push the short ones now" channel. Routing via `audio_targets: [feed, telegram]` in dossier frontmatter.*

- [ ] (A) Telegram only — covers short rides, skip the feed infrastructure
- [ ] (B) Private podcast feed only — durable archive, long rides covered
- [ ] (C) Both, with routing logic (feed default, Telegram opt-in via dossier frontmatter)

### DEC-3 — Primary TTS engine

*Recommended: (A) Piper — only clean OSS option that ships German, headless CLI, ONNX runs on Apple Silicon. If listen-test fails the "clearly better than `say`" floor, fall back to (B) Kokoro for English-only and accept the German gap in v0.*

- [ ] (A) Piper (via OHF-Voice/piper1-gpl) — best multilingual, voice quality adequate
- [ ] (B) Kokoro-82M — stronger English samples; no German today (community funding ask)
- [ ] (C) Dia — native MP3 output; English-only and heavyweight model
- [ ] (D) Other (specify in Free-text): _________________

---

## Should — for v0 design

### DEC-4 — Feed host

*Recommended: (A) Self-host on mac-zrh — matches the "local + OSS" constraint hierarchy; mac-zrh is already serving other local services; nginx + static file is zero-ops.*

- [ ] (A) Self-host on mac-zrh (nginx + static files from `feedgen`/`podcast` script)
- [ ] (B) Self-host on Uberspace (static hosting already paid for; better uptime than a Mac Mini)
- [ ] (C) Cloud-lightweight (Fly.io / Cloudflare Pages / similar)

### DEC-5 — Feed auth pattern

*Recommended: (A) Unguessable URL — best-supported pattern across Apple Podcasts, Overcast, PocketCasts; minimal infra; rotation story is manual but cheap (re-subscribe per device if compromised).*

- [ ] (A) Unguessable URL (`/p/<64-char-hex>/feed.xml`)
- [ ] (B) HTTP Basic Auth
- [ ] (C) Tailscale-only (blocks spouse/guest devices and travel hotspots)

### DEC-6 — Language support in v0

*Recommended: (B) EN + DE — matches Max's reading patterns and the scope constraint in the Key Facts box. Determines DEC-3 (Piper is the only option that ships both).*

- [ ] (A) English only in v0; defer German to a follow-up
- [ ] (B) English + German in v0

---

## Could — informational / deferrable

### DEC-7 — Voice count for v0

*Recommended: (A) Single voice — operator's scope correction explicitly de-weighted engagement; single narration is lower cost and meets the "better than `say`" floor.*

- [ ] (A) Single-voice narration
- [ ] (B) Two-voice dialogue (NotebookLM style — higher quality perception, much higher implementation cost)

### DEC-8 — Engagement tactics to bundle in v0

*Recommended: pacing variation + deliberate section pauses — low implementation cost, big readability win, deterministic. Intro/outro template is cheap. Music bed and conversational restatement are parking-lot for v1.*

Tick all that apply:

- [ ] Pacing variation (faster over lists, slower over key claims)
- [ ] Deliberate section pauses (1–2 s SSML `<break>` or silence file)
- [ ] Intro/outro signature text (`"Dossier: {title}..."`)
- [ ] Music bed under intro/outro
- [ ] Conversational restatement of key claims (rewrite written prose into spoken paraphrase)

---

## Free-text

<!-- Reviewer-only notes. Not a reconciliation surface — that's the sessionlog. -->

_(Max can add notes here — e.g. "try Piper first, benchmark latency on a 2000-word dossier, report back before writing the `feedgen` script.")_

---

<!--
  Delivery checklist (skills/ballot/references/review-checklist.md):
  1. Cover block clean — reviewer, role, dossier link. ✓
  2. No anti-options (all three TTS candidates and all three feed-host candidates are genuinely viable).
  3. Each DEC = one decision surface, one time-horizon.
  4. No pre-ticked checkboxes.
  5. DEC questions are full sentences; options self-contained without the dossier.
  6. Reconciliation location = sessionlog, not here.
  7. Tier discipline — Must items block impl; Should items steer design; Could items are signals.
-->
