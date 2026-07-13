# ai-council-review — gated delivery (#62 → v3.2.0) + first real dogfood

**Date:** 2026-07-12 (wrapped 2026-07-13)
**Source:** Claude Code (Fable 5)
**Session:** Same session as the research/implementation/dossier rounds (no compactions). Max-approved "deliver with dogfood twist": review-convergence gate → merge → release → local install → council runs on meteoswiss PRs.

## Summary

Shipped `ai-council-review` 0.1.0: passed a two-lens self-review gate (12
confirmed findings, all fixed and folded into their original commits),
merged PR #62 with a merge commit, released `@eins78/agent-skills` v3.2.0
via the changesets flow, installed the skill on mac-zrh, and ran the first
two real council reviews (meteoswiss-llm-tools #118 and #130 — review
coverage only, neither merged). Total dogfood spend $2.73 on Max's
dedicated `openrouter-homebot` key.

## Review gate (decisions + what was found)

- **Copilot quota was still exhausted** from the build session's 5-round
  loop (responds in seconds with the quota message — waiting is useless
  within a session). Substituted two lenses: `pr-review-toolkit`
  code-reviewer agent + workflow-backed `/code-review` at high effort.
  Gate treated as passed on their convergence; substitution disclosed to
  Max rather than silently downgrading the gate.
- **12 confirmed findings, all fixed with TDD** (suite 55 → 62 tests). The
  dominant theme: P1's anonymization blind leaked through four independent
  side channels — verbatim `raw/` responses (provider echoes `model`),
  roster-ordered `clusters.json` member lists, per-label `costUsd`
  correlatable with the per-model estimate, and roster-indexed persona
  assignment. All closed structurally; the mock server now echoes
  `model`/`provider` so tests cover the leak class.
- Operational fixes: quorum>roster preflight, zero `context_length`
  handling, `--out` overwrite guard, 401→exit 4, outcomes archive
  corrupt-line tolerance + path-normalized dedupe + newline-safe append.

## Merge hygiene mechanics (non-obvious, reusable)

- Fix commits folded via `git commit --fixup` + scripted
  `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash`.
- A fixup whose diff depends on later commits **cannot fold into an early
  commit** (conflicts) — the ops fixes folded into the *P1* commit instead
  of the original skill commit, using `--fixup=amend:` to rewrite that
  commit's message honestly ("anonymize … ; harden dispatch").
- Correctness check for any fold: the post-rebase tree hash must equal the
  pre-fold tree hash (`git rev-parse <sha>^{tree}`). It did.

## Dogfood results (runs archived in XDG state on mac-zrh)

- **#118** ($0.23, 3/4 delivered — deepseek timeout): approve. glm-5.2's
  lone major **refuted by repo verification** (misread the PR body; counts
  were already consistent — the exact failure mode the in-session
  verification step exists for). One verified minor (stale
  `meteoswissWeatherReport` refs) + a nit survive.
- **#130** ($2.50, 3/4 delivered — gpt-5.3-codex provider-rejected on
  context): unanimous approve, no blockers. Two verified minors: untested
  redirect-follow loop (the PR's own SSRF defense), and UTF-8-always
  decode in the body-cap fix — settled empirically as zero current impact
  (live endpoints declare no charset; Latin1 CSVs use the binary path).
- Budget gate honored end-to-end: #130's real estimate ($1.31) exceeded
  Max's ~$0.90 pre-scope → asked, got explicit approval, only then `--yes`.
- Outcomes archive now has its first data: glm-5.2 six findings at 0.83
  precision; gemini/deepseek 1.00 on tiny samples.

## Skill improvement backlog from the dogfood (not yet filed)

1. **Estimate calibration**: reasoning-token output blew past the estimate
   (+91%) and even the printed "worst case" ($2.50 > $1.90) — worst-case
   math must model reasoning billing, not just `max_tokens`.
2. **Provider-context mismatch**: catalog `context_length` passed preflight
   but the provider rejected 271k input for gpt-5.3-codex — preflight
   should discount catalog windows or catch the 502 with a clearer message.
3. **Untitled-findings over-merge**: glm-5.2 returned findings without
   `title`; the lenient validator coerces to "(untitled finding)" and the
   clusterer then merges distinct location-less findings on identical
   placeholder tokens. Exclude coerced titles from title-similarity.
4. Deepseek timed out at 240s on a moderate payload — consider per-model
   timeout scaling or a docs note.

## Decisions

- Dogfood key: Max provisioned `openrouter-homebot` (ZDR, budget-capped)
  and authorized keychain access by name — compatible with the skill's
  no-self-provisioning rule because the human supplied the credential
  path; the key value never printed (command substitution inline).
- #118 used `--rubric code` per the classify table despite being
  docs-dominant (it touches `server.ts`); worked fine.
- Council findings NOT posted to the meteoswiss PRs (skill default: post
  only on explicit request); they were relayed in the session report.

## Pending

- [ ] meteoswiss #118/#130: merge decisions are Max's; council coverage
      delivered (run dirs: `~/.local/state/ai-council-review/mcp-server-meteoswiss/2026-07-12-16-34-38` and `…17-02-31`)
- [ ] File the four dogfood improvement items as issues/changesets against
      `ai-council-review`
- [ ] Copilot review of the post-fold #62 never happened (quota) — if Max
      wants a Copilot pass on the shipped code, re-request next quota cycle
