---
"@eins78/agent-skills": minor
---

Add `ai-council-review` skill — convene a council of ~4 frontier models via
the OpenRouter API for independent parallel reviews of a PR, plan doc, or
files, with in-session synthesis of agreements and dissents (verified against
the actual repository before reporting). Ships zero-runtime-dependency
Node (>= 20) `.mjs` scripts (`// @ts-check` + JSDoc — first Node-based skill
scripts in this repo) with per-model retry/timeout handling, live-pricing
cost estimates, and a two-tier budget gate: expected cost above the
confirmation threshold requires an explicit `--yes`, and worst-case cost
(all members exhausting `max_tokens`) above the budget cap refuses outright —
nothing is sent in either case. Council
rosters are data (`references/presets.json`); the default council is
gpt-5.5, gemini-3.1-pro-preview, deepseek-v4-pro, and glm-5.2 (vendor-diverse,
Anthropic deliberately excluded — the synthesizer is Claude). Requires
`OPENROUTER_API_KEY`; SKILL.md carries an explicit consent note because
reviewed content leaves the machine for third-party model providers. Tests:
offline unit suite (JSON extraction, clustering, budget math) plus a mock
OpenRouter server covering retry, timeout, quorum, budget-blocks-before-HTTP,
and key-redaction paths via `node:test`, and an optional live smoke test
against `deepseek/deepseek-v4-flash` (< $0.01) that skips cleanly without a
key. Root conveniences: `pnpm run test:council`, `pnpm run typecheck:council`.

Ships effectively at v0.1.0 (frontmatter committed at 0.0.0; the minor bump
below lands the release at 0.1.0).

<!--
bumps:
  skills:
    ai-council-review: minor
-->
