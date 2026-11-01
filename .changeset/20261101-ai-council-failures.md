---
"@eins78/agent-skills": minor
---

**`ai-council-review`** — failed members now leave their full responses in the run directory, and an empty answer is retried once.

When a member fails (empty answer, HTTP error, malformed body, timeout), needs a retry, or hits the output limit, every attempt is saved to `failures/<member>.json` with provider, generation id, `finish_reason` and usage, so a flaky model can be diagnosed after the run. An empty completion gets one retry when the budget cap has room for a second full request, and every billed attempt counts toward the actual cost. README prices and the DeepSeek/GLM failure notes are updated.

<!--
bumps:
  skills:
    ai-council-review: minor
-->
