# ai-council-review — flagship skill: plan, build, dogfood, PR (#62)

**Date:** 2026-07-11 (wrapped 2026-07-12)
**Source:** Claude Code (Fable 5)
**Session:** No compactions · plan-mode design (2 parallel Plan agents, reconciled) → approved → full build → PR #62

## Summary

Designed and built `ai-council-review`: a council of ~4 vendor-diverse frontier models reviews a PR/plan/files in parallel via OpenRouter; Claude synthesizes in-session (dissent-preserving, agreement counted /M) and verifies top findings against the actual repo. Zero-dep typesafe Node CLI with a two-tier in-code budget gate. Built with writing-skills TDD (RED baselines → GREEN pressure scenarios) and dogfooded with two real council runs on the plan itself. PR **#62** opened, CI green, 5 Copilot review rounds converged; **not merged — Max reviews personally**.

## Key Accomplishments

- `skills/ai-council-review/`: SKILL.md, README, `scripts/council.mjs` + 7 lib modules (`// @ts-check` strict, node>=20, zero npm deps), 3 rubric prompts, synthesis protocol + report template, presets-as-data, 46 tests (unit + mock OpenRouter server + live smoke)
- Live verification: `models`/`--dry-run` against real catalog; live smoke vs `deepseek-v4-flash` (<$0.01); two 4-model dogfood councils on the plan doc ($0.36) — total session spend ~$0.44 via `openrouter-evals` keychain key
- Copilot loop: 5 substantive rounds, 17 findings → 16 fixed with regression tests, 1 intentional (version `0.0.0`, see Decisions); round 6 ended on the requester's Copilot quota after findings had dwindled to nits
- Root wiring: README table row, `test:council`/`typecheck:council` scripts, `typescript`+`@types/node` devDeps, changeset with `bumps:` block (lands 0.1.0)

## Decisions

- **Anthropic excluded from default council** — synthesizer is Claude; excluding its vendor maximizes independent signal. Opus lives in `max` preset with a "discount same-vendor pairwise agreement" synthesis rule.
- **Grok removed from `default` mid-plan (Max)** — backfilled with `z-ai/glm-5.2` to keep 4 members (graded agreement + failure slack); quorum unchanged at 2; grok stays in `budget` (grok-4.3).
- **Identical rubric per member, no personas** — agreement counting is only valid with identical assignments; `--personas` is experimental and flips synthesis to coverage mode.
- **In-session synthesis over a synthesis API call** — repo verification is the hallucination kill-switch an API-side synthesizer can't do.
- **Two-tier gate (added from dogfood finding)** — confirm-threshold vs *expected* cost, hard cap vs *worst case* (all members exhausting `max_tokens`); an expected-cost "cap" is not a cap. Unpriced (`:free`/missing-pricing) members also require `--yes` (Copilot round-4 catch).
- **Version committed as `0.0.0` + minor changeset → releases at 0.1.0** — avoids the pdf-zine double-bump; verified `increment_semver 0.0.0 minor → 0.1.0`. Copilot flagged it every round; explained on the PR, intentionally unchanged.
- **Run artifacts in XDG state** (`~/.local/state/ai-council-review/<repo>/<run-id>/`), not repo/tmp — records of money spent.

## Plan-vs-reality deltas

- **spawnSync deadlock in dispatch tests**: the in-process mock server can't answer while `spawnSync` blocks the event loop — every dispatch test timed out. Root-caused via a standalone repro (CLI was provably fine); fixed by async `spawn`. The test harness, not the product, was the bug.
- **Live dogfood caught 4 bugs mocks couldn't**: OpenAI strict-schema 400 (all properties must be in `required`, optionals nullable); DeepSeek truncation at 8k `max_tokens` (raised to 24k, `finish_reason` surfaced); auto-context duplicating the reviewed plan file (payload ×2 — a *minority 1/3 council finding*, verified live); expected-vs-worst-case cap flaw.
- **Copilot round 2 caught a real dispatch bug**: `fitPayload` trimming applied to estimate/`input.txt` but not to what was sent — fixed via `assembleUserPayload` so estimate ≡ wire bytes, with a body-capture mock test.
- **RED baselines stronger than expected**: the B2 agent found the keychain key unaided and spent $0.078 real money without asking — the exact self-authorization the skill's gates exist to stop. B3 skipped (independence failure mode never manifested).

## Pending / follow-ups for Max

- [ ] Review + merge PR #62 (deliberately left unmerged)
- [ ] PreToolUse hook intercepting `council.mjs .* --yes` — converts the last prose rule into a gate (council's unanimous recommendation)
- [ ] Optional `ai-review` description cross-pointer (separate `ai-review: patch` changeset)
- [ ] Dedicated OpenRouter key with per-key spend limit
- [ ] Bonus: B2's council unanimously flagged real CLAUDE.md contradictions (frontmatter example omits `metadata.version`; "increment its version" vs "do not manually edit"; `/writing-skills` underspecified) — worth an issue

## Verification

- `pnpm run test:council` — 46 tests, 45 pass, 1 intentional live-skip; `pnpm run typecheck:council`, `pnpm test`, `pnpm run validate` all green; CI `validate` pass on PR head `8008cbc`
- Dogfood synthesis report (full protocol walk incl. refuted findings): `~/.local/state/ai-council-review/ai-council-review/2026-07-11-21-09-03/report.md`
