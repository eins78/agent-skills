---
"@eins78/agent-skills": patch
---

**`ai-council-review`** — the `default`, `code`, `budget` and `max` presets now seat `deepseek/deepseek-v4-flash` and `z-ai/glm-5.3-flash` instead of `deepseek/deepseek-v4-pro` and `z-ai/glm-5.2`.

The pro model timed out and glm-5.2 returned an empty completion on a 30k-token code diff, degrading the council to 2 of 4. The flash slugs are verified live and cheaper; estimates drop accordingly. Override any preset in `~/.config/ai-council-review/config.json` if you want the previous roster.

<!--
bumps:
  skills:
    ai-council-review: patch
-->
