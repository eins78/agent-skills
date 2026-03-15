# ai-review: Document paid API and capacity quota

**Date:** 2026-03-15
**Branch:** `docs/ai-review-paid-api` (merged via PR #22)
**Source:** Claude Code

## Summary

Investigated why the ai-review skill's Gemini free tier exhausts after just a few reviews, documented the capacity quota as the real bottleneck, and added paid API setup instructions validated with real-world usage data.

## Key Accomplishments

- Identified that Google's **capacity/throughput quota** (token-based, rolling multi-hour window) is the real bottleneck — not the documented RPM/RPD limits
- Researched Gemini 2.5 Pro API pricing: ~$0.02-0.04/review
- Added "Paid API" section to ai-review SKILL.md with setup, cost estimates, and usage tracking
- Validated end-to-end in slideshow-app session: 7 reviews, CHF 0.13 total (~CHF 0.019/review)

## Changes Made

- Modified: `skills/ai-review/SKILL.md` — rate limit clarifications + new "Paid API" section

## Decisions

- **Use standard `GEMINI_API_KEY`** (not a custom env var): The gemini CLI reads it natively from `process.env`, no script changes needed. A custom var would require wrapper code for no benefit.
- **Billing must be enabled**: An API key without billing still uses free-tier capacity limits — same bottleneck as OAuth.
- **Auth type must be switched**: The gemini CLI doesn't auto-detect the API key. User must run `/auth` in the gemini CLI and select "Gemini API Key".

## Research Findings

- `TerminalQuotaError` with multi-hour reset = capacity quota (token throughput), not RPM/RPD
- Google enforces two separate quota types: request-count (RPM/RPD) and capacity (tokens/time window)
- The gemini CLI source (`useAuth.js`, `auth.js`) confirms `GEMINI_API_KEY` is supported but requires `security.auth.selectedType: "gemini-api-key"` in `~/.gemini/settings.json`
- AI Studio dashboard provides full usage tracking (requests, tokens, costs) per API key
- Multiple keys can be created in the same GCP project for usage separation

## Next Steps

- [ ] Monitor actual monthly cost over a few weeks of real usage
- [ ] Consider adding `--model` flag support to review.sh for model selection with paid API

## Repository State

- Committed: `0eb079a` - ai-review: document paid API option and capacity quota limits
- Merged: PR #22 → main as `2e68c56`
- Branch: `main`
