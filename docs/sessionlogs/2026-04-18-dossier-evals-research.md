# Sessionlog — 2026-04-18 · dossier-evals-research

**Model:** Claude Opus 4.7 (1M context)
**Worktree:** `.claude/worktrees/dossier-evals-research/`
**Branch created:** `dossier-evals-research` from `origin/main`
**Scope:** research-only; no code or skill edits

## Brief

Orchestrator handoff asking whether [eins78/agent-skills PR #43](https://github.com/eins78/agent-skills/pull/43) (dossier + ballot skill evolution) should ship with an eval harness — and if so, whether [Quatico PR #12](https://github.com/quatico-solutions/agent-skills/pull/12)'s stack is the right fit, or a TS-native alternative like evalite. Output: a dossier + a ballot for Max's async decision.

## What was done

1. **Phase 1 — parallel Explore agents (3).** One each for:
   - Quatico PR #12's eval harness (found: bespoke scenario + subagent pattern, Max is the author, no framework)
   - PR #43's current eval surface (found: 2 live hooks + 2 reviewer checklists replacing 6 deleted overfit hooks)
   - Eval framework landscape (found: evalite best fit; "nom.im/evalite" is not a real product; promptfoo overkill)
2. **Phase 2/3 — plan file.** Wrote `/Users/user/.claude/plans/session-brief-tidy-clover.md` with the verdict preview and deliverable structure. ExitPlanMode approved.
3. **Phase 4 — deliverables.** Switched to fresh `dossier-evals-research` branch from `origin/main` (per brief). Wrote:
   - `docs/research/2026-04-18-dossier-evals-applicability/DOSSIER-Dossier-Evals-Applicability-2026-04-18.md` — full dossier
   - `docs/research/2026-04-18-dossier-evals-applicability/DOSSIER-Dossier-Evals-Applicability-BALLOT-Max.md` — ballot with 5 DECs across Must/Should/Could tiers
   - This sessionlog

## Key finding

The "Quatico stack vs personal stack" framing in the orchestrator's brief was misleading: Quatico PR #12 is Max's own prior art on his Quatico-repo. So the real decision is "replicate my own bespoke pattern" vs "adopt evalite" vs "do nothing". The dossier reframes accordingly.

## Recommendation (from dossier)

**DEC-1: (b) Yes, in a follow-up PR.** Ship PR #43 as-is; open a separate eval-harness PR.
**DEC-2: (b) evalite.** TS-native, Vitest-based, matches repo's pnpm + TypeScript toolchain; LLM-as-judge is first-class.
**DEC-3: (b) Mechanical + 3 LLM-as-judge metrics.** Three mechanical (framing-mode, citation-integrity, Key-Facts presence) + three judge (Executive-Summary crispness, source-bias flagging, ballot async-readability). Seed with 3 golden dossiers.

Full recommendation and steelman of the "no evals" side in the dossier's "Applicability verdict — both sides" section.

## Filename-convention note

Task brief specified `docs/research/2026-04-18-dossier-evals-applicability.md` (flat, no DOSSIER- prefix). Corrected to honor the dossier + ballot skills' filename conventions (dossier = `DOSSIER-*.md`; ballot = `DOSSIER-*-BALLOT-<Reviewer>.md`). Using a subfolder `docs/research/2026-04-18-dossier-evals-applicability/` keeps both files co-located per the dossier skill's "multiple dossiers per folder" convention.

## Gaps / open questions surfaced (but not blocking)

- Whether the `dossier-preflight` branch's work should land before the eval harness — surfaced in the dossier's §Open Questions.
- Whether Quatico's `run-scenarios.md` runbook should be ported — also in §Open Questions.
- Main branch has no hooks yet; PR #43 introduces them. Writing the dossier on `dossier-evals-research` (branched from main) meant no PostToolUse gate fired during Write. Manual verification of `framing-mode:` frontmatter and `-BALLOT-<Reviewer>.md` filename was done by hand against the PR #43 branch's checklists.

## Next step

`git add` + `D: add dossier-evals-applicability research + ballot` + push. Max reviews on iPad, ticks the ballot, and either directly opens the follow-up or adjusts scope.

## Deliverables

| Path | Purpose |
|------|---------|
| `docs/research/2026-04-18-dossier-evals-applicability/DOSSIER-Dossier-Evals-Applicability-2026-04-18.md` | The dossier |
| `docs/research/2026-04-18-dossier-evals-applicability/DOSSIER-Dossier-Evals-Applicability-BALLOT-Max.md` | The ballot |
| `docs/sessionlogs/2026-04-18-dossier-evals-research.md` | This sessionlog |
