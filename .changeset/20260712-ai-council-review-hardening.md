---
"@eins78/agent-skills": minor
---

`ai-council-review`: prior-art hardening round (research-backed, PR #62 —
see `research/council-prior-art.md` for evidence and citations). Member
identities are now anonymized during synthesis: reviews, clusters, and the
manifest carry shuffled `member-A`… labels, with the label→model mapping in
`roster-key.json` read only at report time (counters LLM brand/self-
preference bias; failed members stay named). The synthesis protocol gains
correlated-error guardrails (unanimity grants no verification exemption;
minority-new-evidence triage for contested items) and position-bias
adjudication hygiene (repo-evidence view first, order-swap check on close
calls). Clusters carry a stable `fingerprint` for re-review comparison with
a documented stuck rule (same blocking fingerprints two runs running →
recommend human judgment). New offline `outcomes record|show` subcommand
archives per-member verified/refuted/uncertain tallies per run to XDG state
for evidence-based roster tuning. `--personas` graduates from experimental
to a documented coverage mode; an optional two-stage budget→default triage
pattern is documented (suggestion only, not enforced); and the README
records "no debate round" as an explicit non-goal plus the corrected
diversity rationale (bias control, not recall booster).

<!--
bumps:
  skills:
    ai-council-review: minor
-->
