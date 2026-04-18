# Sessionlog — Audio-version skill feasibility research

**Date:** 2026-04-18
**Session owner:** Max Albrecht (orchestrated via fresh Opus 4.7 Claude Code session)
**Branch:** `worktree-audio-skill-research` (worktree off main)
**Deliverable:** dossier + ballot at `docs/research/2026-04-18-audio-skill-feasibility*.md`

## Session objective (preflight restatement)

Recommend whether to build an `audio-version` companion skill for the `dossier` skill, pick a primary local TTS tool and a primary delivery mechanism (Telegram / private podcast feed / both), and define which transformation rules to encode. Constraints: OSS + local + Apple Silicon (M4 Pro) + headless + mp3/m4a output + voice quality ≥ Apple `say` baseline. Research-only; do NOT implement. Output lands on main as `D:` commits per repo convention.

## Scope correction (mid-plan turn)

Orchestrator sent a clarification after the plan was written but before execution. The operator pushed back on the original framing that the problem was "boring voices in existing apps." Real pain is **UX/workflow**: file import, cross-device sync, zero automation. ElevenReader et al. have okay-to-good voices; they all fail on delivery. Three concrete changes:

1. **Thread 4 rotated** from "engagement tactics" to **"delivery mechanism"** (Telegram + private podcast feed).
2. **Thread 3 (TTS stack)** re-weighted — headless on mac-zrh, mp3/m4a output, pipeline fit first; voice quality a gate, not the summit.
3. **Engagement** shrank to a single floor-check paragraph.
4. **Ballot gained three DECs** (primary delivery, feed host, feed auth) and dropped "voice count" one tier to Could.
5. **Dossier opens with a one-line acknowledgment** that the scope rotated.

Plan file updated in place at `/Users/user/.claude/plans/session-brief-humble-truffle.md` before execution. ExitPlanMode approved; auto mode then active.

## Approach

Three parallel Explore agents dispatched in one message:

| Agent | Threads | Focus |
|-------|---------|-------|
| A | T1 + T2 | Existing document→audio tools (workflow critique); markdown→spoken-text transformation conventions with W3C/WCAG citations. |
| B | T3 | OSS TTS stack re-weighted for pipeline fit (6 in depth: Kokoro, F5-TTS, Piper, Dia, Matcha-TTS, Parler-TTS). |
| C | T4 | Telegram `sendAudio` vs `sendVoice` + private podcast feed host candidates + auth patterns + RSS metadata mapping + routing heuristic. |

Dev dossier skill files pulled from `origin/dossier-skill-pitch` (PR #43) to `/tmp/dev-*.md` as the working rulebook — kept the commit branch on main-based `worktree-audio-skill-research` to avoid polluting PR #43's diff.

## What shipped

- `docs/research/2026-04-18-audio-skill-feasibility.md` — 475 lines; preflight-compliant; 33 clickable `[Sn]` citations (all matched); §Sources last; §Appendix (podcast-voice proof-of-concept) kept before Sources.
- `docs/research/2026-04-18-audio-skill-feasibility-ballot.md` — 122 lines; 8 DECs (3 Must / 3 Should / 2 Could); 25 empty checkboxes; zero pre-ticked; cover block clean.
- This sessionlog.

## Key findings

1. **Delivery mechanism is the hard part that is actually easy.** Telegram `sendAudio` wraps into Max's existing Telegram plugin in ~10 lines. A private podcast feed is `feedgen` (Python) or `podcast` (npm) generating `feed.xml` at an unguessable URL served by nginx. ~50 lines of glue. 0.5–1 hour of setup.
2. **Only Piper ships with German out-of-box.** ([OHF-Voice/piper1-gpl][ref-a], v1.4.2 released 2026-04-02; German voices on [piper-voices HF][ref-b]). Kokoro's German is a community funding ask, not shipped. F5-TTS is research-only weights. Dia, Matcha-TTS, Parler-TTS are English-only.
3. **Voice quality gate is probably cleared on either Piper or Kokoro.** Samples on HF spaces are audibly above `say`. Real confirmation needs a listen-test on a Max-representative dossier text.

## Trade-offs noted

- **Vendor bias in Thread 3** — all TTS claims are sourced from the maintainers' own repos / HF pages. Voice-quality samples are author-curated. Flagged in the dossier's §Source-bias notes and called out in §Evaluations with "listen-test required" for the lead candidates.
- **Unverified dated-claims for some TTS tools.** F5-TTS last commit (~2025-03-12) and Piper1-gpl (v1.4.2 @ 2026-04-02) were verified against their repo pages on 2026-04-18. Kokoro, Dia, Matcha-TTS, Parler-TTS dates come from Agent B's initial sweep; not independently re-verified. Not load-bearing for the recommendation (Piper wins on license + German).
- **Agent B mis-claimed Kokoro German support.** Original report asserted "German support merged 2026-04-17." WebFetch of the Kokoro repo did not confirm any German merge; Kokoro's language list excludes German. Corrected in the dossier to "German is a community funding ask, not shipped" with a citation to [issue #186][ref-c].
- **Agent B mis-dated F5-TTS.** Claimed last commit 2026-04-17; verified actual is 2025-03-12. Corrected.
- **Orphan citation caught in self-audit.** An example `[S1][ref-S1]` inside an inline code span flagged as orphan on first pass; false positive once the regex was updated to ignore backtick-fenced content. Retained in §Transformation Conventions as a literal demonstration of the dossier skill's citation syntax.

## Audio-version-text appendix — decision

**Included.** Reads cleanly once; demonstrates the transformation conventions in §Transformation Conventions applied end-to-end (no URLs, spelled-out dates, "fifty" instead of "50," skipped table description). If Max thinks it's silly when he reads it, cut in a follow-up — the structural rules section is the load-bearing part of that work.

## Self-audit results (review checklists)

**Dossier — `skills/dossier/references/review-checklist.md`** (8 items): all pass. §Source-bias notes added for Thread 3 vendor-authored sources. §Sources is the last H2 after the Appendix move.

**Ballot — `skills/ballot/references/review-checklist.md`** (8 items): all pass except filename — deliberate deviation from `DOSSIER-<slug>-BALLOT-<Reviewer>.md`. Documented in the ballot's header comment; `ballot-filename.sh` gate does not fire (filename doesn't match the filter pattern). Justification: parent dossier follows the flat `docs/research/<date>-<slug>.md` pattern Max specified in the brief for personal-repo docs artifacts.

## Open questions forwarded to Max

The ballot carries these; this sessionlog notes them for future session continuity:

1. PR #43 inclusion vs follow-up (DEC-1)
2. Delivery mechanism split (DEC-2)
3. TTS primary (DEC-3)
4. Feed host location (DEC-4)
5. Feed auth pattern (DEC-5)
6. German in v0 or follow-up (DEC-6)
7. Voice count (DEC-7)
8. Engagement tactic multi-select (DEC-8)

## Next actions

- Max reviews dossier + ballot async.
- Reconciliation of ballot ticks happens in the next session (or in-place amendments here).
- If ballot clears, implementation becomes its own session scoped to `audio-version` skill authoring.

[ref-a]: https://github.com/OHF-Voice/piper1-gpl
[ref-b]: https://huggingface.co/rhasspy/piper-voices
[ref-c]: https://github.com/hexgrad/kokoro/issues/186
