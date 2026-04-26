---
framing-mode: personal
date: 2026-04-18
---

# Dossier: Example Research Topic

## Key Facts

| | |
|---|---|
| **Who decides** | Max |
| **Deadline** | No hard deadline |
| **Audience** | Max, reading async on iPad |

## Management Summary

The [evalite][ref-evalite] framework provides [Vitest][ref-vitest]-based evaluation infrastructure
suitable for this use case. The [Anthropic SDK][ref-anthropic] handles LLM-as-judge calls.

Based on the [evalite docs][ref-evalite-scorers], scorers return a 0–1 score.

## Sources

**S1** — [Matt Pocock: evalite][ref-evalite]: Primary framework documentation.
**S2** — [Vitest][ref-vitest]: Test runner underlying evalite.
**S3** — [Anthropic SDK][ref-anthropic]: SDK for LLM-as-judge calls.
**S4** — [evalite scorers][ref-evalite-scorers]: How scorers work.

[ref-evalite]: https://www.evalite.dev/
[ref-vitest]: https://vitest.dev/
[ref-anthropic]: https://github.com/anthropics/anthropic-sdk-typescript
[ref-evalite-scorers]: https://www.evalite.dev/docs/scorers
