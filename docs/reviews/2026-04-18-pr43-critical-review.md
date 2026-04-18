# PR #43 Critical Self-Review — 2026-04-18

**Branch:** `dossier-skill-pitch` → `main`
**Scope:** 28 commits, 23 files, +2051/−39. Introduces `ballot` skill (v1.0.0) and evolves `dossier` across four phases: Path A POC → Path B extraction → Polish (6 hooks deleted) → Preflight-gate refactor (7th hook deleted, `framing-mode` convention removed).
**Reviewer:** Claude Code (self-review, pre-merge)
**Method:** Apply `skills/dossier/references/review-checklist.md` and `skills/ballot/references/review-checklist.md` to the shipped files as an integration test; then targeted residue audit for deleted features (`framing-mode`, six removed hooks, `audit-checks.md`, `framing-modes.yaml`).

---

## Summary

The PR is in good shape. The core evolution — preflight gate at step 0, clickable citations, Must/Should/Could ballot tiers, reviewer checklists replacing overfit grep hooks — lands coherently. The rollback arc (hooks added then removed) is documented in each README's Provenance narrative and is honest about the repudiation.

**Three real issues** need fixing before merge. All three are version-metadata or doc-residue issues, not skill-logic problems.

**Five items deferred** with explicit rationale — none block merge.

**AI review pass** is queued for step 3 of the session plan.

---

## Real issues (fix before merge)

### R1. `marketplace.json` dossier version stale at `1.0.3`

**Where.** `.claude-plugin/marketplace.json` line 82 shows `"version": "1.0.3"` for the `dossier` entry. `skills/dossier/SKILL.md` line 13 shows `metadata.version: "1.1.0"`.

**Why it matters.** These files must agree. `sync-versions.sh` normally reconciles them from SKILL.md after `changeset version` runs, so the mismatch will resolve itself during the automated release flow — but only if step 4 (changeset squash) drives a real version bump that causes `sync-versions.sh` to re-read SKILL.md. A zero-bump release would leave the mismatch.

**Fix.** Runs as a no-op if the changeset squash (step 4) produces any dossier version bump. If step 4 decides to omit dossier from the bumps block (see R2 Option B below), `marketplace.json` must be manually aligned to `1.1.0`.

---

### R2. Dossier SKILL.md at `1.1.0` + 4 pending `dossier: minor` changesets = double-bump

**Where.**
- `skills/dossier/SKILL.md` line 13: `metadata.version: "1.1.0"` (set manually during the Path-B merge-conflict resolution at `c706e7a`).
- Four pending changesets — `20260418-124646-dossier-path-a.md`, `20260418-130906-polish-pass.md`, `20260418-181406-preflight-gate.md`, `20260418-pitch-b-ballot-extraction.md` — each carry `bumps: skills: dossier: minor`.

**Why it matters.** `pnpm run version` runs `bump-skill-versions.sh && changeset version && sync-versions.sh`. The bump script will read SKILL.md's current `1.1.0`, take the highest bump from the collected `bumps:` blocks (minor), and produce `1.2.0`. But the operator's intent during the merge conflict was to set the post-release version — i.e. the 4 changesets' *net effect* was supposed to be `1.1.0`, not `1.2.0`.

**Fix options.**

- **Option A (recommended): revert SKILL.md to `1.0.1`**, let the squashed changeset's `bumps: dossier: minor` drive the bump to `1.1.0` normally. Honest — the `bumps:` block describes intent, and the normal bump-script path runs. No new MEMORY.md exceptions needed. This matches the "let the pipeline do its job" default.
- **Option B: omit dossier from the squashed changeset's bumps block**, leave SKILL.md at `1.1.0`. This reuses the ballot pattern (direct-set at `1.0.0`, omit from bumps — see `memory/project_increment_semver_gap.md`). But that memory entry is specifically about pre-release graduation (e.g. `1.0.0-beta.1 → 1.0.0` — can't be produced by a standard bump). Not the situation here. Using Option B stretches the pattern.

Decision: **Option A.** Revert `skills/dossier/SKILL.md` `metadata.version` to `1.0.1` as a fix commit, then the squashed changeset's minor bump produces `1.1.0` cleanly.

---

### R3. `skills/dossier/README.md` line 70: "Alerting-level gates" — plural

**Where.** `skills/dossier/README.md` line 70:

> **Alerting-level gates.** PostToolUse fires *after* file write; exit 2 feeds stderr back to Claude but a motivated agent can ignore. PreToolUse rigor is documented future work; `ballot-filename.sh` is the cheapest upgrade candidate [...]

**Why it matters.** Only one gate remains (`ballot-filename.sh`). The plural "gates" is a residue from the pre-polish state when four audit hooks shipped. Minor but misleading — a reader expects multiple gates described here.

**Fix.** Change "Alerting-level gates" to "Alerting-level gate". Singular throughout the bullet.

---

## Deferred issues (explicit, with rationale)

### D1. Dossier README `Provenance` narrative mentions deleted features

**Where.** `skills/dossier/README.md` line 18 (Path A extension block):

> Extended per Pitch A [...] with FRAME phase, Key Facts box, four enforcement hooks, per-reviewer ballot template, and framing-mode wordlists.

FRAME phase, four hooks, framing-mode wordlists, and the ballot template under `skills/dossier/` all no longer exist in this skill (ballot moved out; the rest deleted in later phases).

**Why deferred.** The very next paragraph (line 22) documents the post-review polish pass — hooks deleted, `framing-modes.yaml` / `audit-checks.md` removed. And the following paragraph (line 24) documents the preflight-gate refactor removing the remaining FRAME / framing-mode apparatus. The narrative is chronological and honest about the repudiation. Trimming it would lose the journey. This is explicitly the Provenance section, not the "what's in the skill now" section — which is §File Structure (accurate).

**What would change the decision.** If a user reading the README came away thinking the FRAME phase still exists, rewrite. Current mitigation: the File Structure block at line 32–49 shows the actual state.

### D2. `.delegate-status.md` at repo root is cruft

**Where.** `.delegate-status.md` — a delegate handoff artefact checked in at `8bec6a6`.

**Why deferred.** User-facing impact is zero (not shipped with the plugin; not referenced anywhere; would be ignored by anyone browsing the repo). Cleaning it requires its own commit. Out of scope for this session — can be handled in a follow-up "housekeeping" pass.

### D3. Commit-message-style inconsistency

**Where.** The 28 commits mix Conventional Commits (`feat(dossier):`) with repo-style (`dossier:`). CLAUDE.md specifies the repo convention.

**Why deferred.** Fixing requires rewriting history across 28 commits. The PR is merged with `--merge` (not `--squash`) per the session brief, so the commit narrative is preserved — the deviation is visible but harmless. Out of scope; would be a separate grooming PR.

### D4. Pitch & sessionlog residue

**Where.** `docs/pitches/2026-04-18-dossier-skill-evolution.md`, `docs/pitches/2026-04-18-pitch-A-assessment.md`, `docs/sessionlogs/2026-04-18-dossier-a-poc.md`, `docs/sessionlogs/2026-04-18-pitch-b-impl.md` all reference the deleted hooks, FRAME phase, and framing-mode convention.

**Why deferred.** These are historical records — they document what the thinking *was* at the time of writing. The repo convention treats pitches and sessionlogs as immutable intellectual history (per `skills/bye` patterns). Rewriting them would be a lie about the past. Future readers encountering the docs arrive via git log or cross-references, not as "current state of the skill" documents.

### D5. Preflight-gate refactor sessionlog coverage — ~~gap~~ retracted

**Retraction (self-review finding).** The preflight-gate refactor *does* have sessionlog coverage — `docs/sessionlogs/2026-04-18-pitch-b-impl.md` lines 272–308 contain a "Post-review Preflight Gate (2026-04-18, same-day)" section documenting the design, files deleted/modified, and retroactive policy. The original finding was incorrect. No fix commit needed.

### D6. Template placeholder `{url}` URLs in `templates/dossier.md`

**Where.** `skills/dossier/templates/dossier.md` lines 188–197:

```
[ref-S1]: {url}
[ref-S2]: {url}
...
```

A user filling in the template without pruning unused placeholders ships a dossier with literal `{url}` strings.

**Why deferred.** The template comment at line 186 says "Add one per source actually cited; delete the unused placeholders." And review-checklist item 2 (citation-integrity red flag: *"§Sources entries or reference definitions whose URLs don't appear in the body"*) catches it at review time. Two layers of mitigation. Adding a third (e.g. making them into comments that render only when uncommented) complicates the template. Kept as-is.

---

## AI review pass

*To be filled in at step 3 of the session plan.*

The `/ai-review` slash command will run serial (free-tier Gemini quota). Findings will be folded into either an additional fix commit (`ai-review: address <finding>`) or annotated as "dispute" in this section. If `/ai-review` errors, the error is recorded here and the session proceeds.

---

## What's solid

Honest calibration — the PR has meaningful strengths that should be preserved rather than touched:

- **Preflight gate at step 0 is well-designed.** `skills/dossier/SKILL.md` lines 22–32 frame the three-check gate (Specific / Unambiguous / Well-understood) and include a balance rule — *"the bar is 'the answer isn't obvious from context,' not 'I want to be extra sure.'"* That balance rule pre-empts over-interrogation, which was a real failure mode in the a11y-extension session.
- **Dispatcher is cleanly simplified.** `.claude-plugin/hooks/dossier-hook-dispatcher.sh` is 60 lines, calls `ballot-filename.sh` unconditionally, and its header comment documents the deletion history of the six removed hooks. A future reader understands what was removed and why without needing the commit log.
- **Review-checklists are well-structured.** Both `skills/dossier/references/review-checklist.md` and `skills/ballot/references/review-checklist.md` use a consistent four-part rubric (what-to-check / why / good / red-flags). Each has an 8-item cap which keeps them scannable. The `dossier` checklist closes with a "Why this replaced the old grep hooks" section that explains the generalization leap — useful for anyone tempted to re-introduce pattern-matching gates.
- **Ballot skill is truly standalone.** `skills/ballot/SKILL.md` §When to Use, §Use Cases, §Standalone-vs-Dossier-invoked collectively establish that ballot works for ADRs, hiring panels, vendor selection, household decisions — not just dossier follow-ups. The `DOSSIER-` filename prefix is acknowledged as an intentional exception (line 41) with justification.
- **Async framing over reviewer-count framing.** Ballot's `When to Use` (line 26) leads with "Decider(s) look at the decision outside the agent session" — the trigger is async, not "multiple reviewers". This reframe unlocks the single-async-decider case cleanly.
- **Commercial-bias flagging integrated.** `skills/dossier/references/review-checklist.md` item 5 (source bias flagging) codifies the `@young.mete` Threads contribution without over-specifying it. The pattern — "if vendor sources dominate, call it out in the §Executive Summary" — is concrete enough to act on.
- **No `framing-mode` residue in SKILL.md.** Grepped — `framing-mode`, `framing-modes.yaml`, `framing-modes.md`, `audit-checks.md`, `dossier-framing-declared` all absent from `skills/dossier/SKILL.md`, `skills/dossier/README.md` File Structure, and `skills/ballot/`. Only survives in pitch/sessionlog history (D4) and README Provenance chronology (D1) — both deliberate.
- **Cross-references are intact.** `skills/dossier/SKILL.md` §SYNTHESIZE line 77 correctly points to `skills/ballot/templates/ballot-per-reviewer.md` and `skills/ballot/SKILL.md` §Common Mistakes. The ballot skill's §Related Skills row points back. No dangling references to the old in-dossier template path.

---

## Checklist-as-integration-test findings

Running each skill's review-checklist against the PR's shipped docs (treating each SKILL.md and README as the artefact under review):

**Dossier checklist applied to `skills/dossier/SKILL.md`:**
- Item 1 (preflight evidence): ✓ — step 0 gate exists and is load-bearing.
- Item 2 (citation integrity): N/A — instruction docs don't carry `[Sn][ref-Sn]` claims.
- Item 3 (dated-claim freshness): ✓ — dates inline (2026-04-18) and anchored.
- Item 4 (section ordering): ✓ — workflow is linear, no glossary-vs-sources issue.
- Item 5 (source bias flagging): ✓ — integrated as checklist item 5 in `review-checklist.md`.
- Item 6 (hyperlink density): ✓ — links are sparse and on first mentions.
- Item 7 (selectivity): ✓ — 4 subagent-complexity rows, not a laundry list.
- Item 8 (Key Facts box): N/A — this is a skill, not a dossier.

**Ballot checklist applied to `skills/ballot/SKILL.md` + `skills/ballot/templates/ballot-per-reviewer.md`:**
- Item 1 (filename pattern): ✓ — `DOSSIER-<slug>-BALLOT-<Reviewer>.md` enforced by `ballot-filename.sh`.
- Item 2 (cover-block cleanliness): ✓ — template shows reviewer/role/peer/dossier only; no changelog paragraph.
- Item 3 (anti-options): ✓ — convention called out in SKILL.md line 56.
- Item 4 (time-horizon-per-DEC): ✓ — SKILL.md line 57.
- Item 5 (recommended-not-pre-ticked): ✓ — SKILL.md line 54.
- Item 6 (Must/Should/Could tier discipline): ✓ — SKILL.md line 57.
- Item 7 (async-readability): ✓ — stated as a design axis in SKILL.md §When to Use and §Conventions.
- Item 8 (reconciliation location): ✓ — SKILL.md line 58, §Workflow step 5.

Both checklists pass against their own shipping artefacts, which is the meta-check the session brief asked for.

---

## Proposed fix commits (step 2)

In order:

1. `dossier: restore version baseline to 1.0.1` — revert SKILL.md `metadata.version` to `1.0.1`; let the squashed changeset drive the minor bump cleanly. Addresses R2.
2. `dossier: singularize "gates" in README known-gaps` — one-word edit to line 70. Addresses R3.
3. *(No separate fix for R1 — resolves automatically when `sync-versions.sh` runs during the release flow, conditional on R2's changeset squash producing a real bump. Verified post-fix via `pnpm run version --dry-run`.)*
4. *(No fix for D5 — retracted: sessionlog coverage already exists at `docs/sessionlogs/2026-04-18-pitch-b-impl.md` lines 272–308.)*

Deferred items (D1–D4, D6) are not fixed in this session — documented here for anyone auditing post-merge.
