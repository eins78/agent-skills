# Framing Modes

Consult during FRAME (phase 0) to pick the framing that matches the decision model, audience, and artefact context. This file documents *when* to pick each mode and *what* the mode commits the dossier to. Coherence between declared mode and dossier tone is reviewed via [`review-checklist.md`](./review-checklist.md) (framing-coherence item).

A framing mode is **declared**, not guessed. Add it to the dossier frontmatter:

```yaml
---
framing-mode: oss    # one of: oss, commercial, hiring, vendor, personal
---
```

Declaration is enforced by `dossier-framing-declared.sh`. A dossier with no `framing-mode:` frontmatter (and no `<!-- dossier-framing-mode: ... -->` HTML-comment fallback) fails the declaration gate.

---

## Mode: `oss`

**When to use.** Free / libre / open-source artefact, published without a commercial lead-gen layer. Examples: Chrome extension to the Web Store, CLI tool on GitHub, Fediverse client, personal plugin.

**Vocabulary to avoid.** Commercial-payment terms (`lead-gen`, `Paddle`, `Stripe`, `MoR`, `VAT`, `compliance officer`), revenue framing (`pricing`, `monetize`, `revenue`, `donation` as a revenue line). A reviewer reading an OSS dossier should not encounter these as load-bearing concerns.

**Typical section emphasis.** Community, reputation, contribution process, license choice, sustainability through maintainership (not revenue), adoption and discoverability.

**Example framing to emulate.** "Publishing a free OSS extension that solves a named friction; positioning as a reference implementation."

**Example framing to avoid.** "Paddle vs. Stripe vs. Merchant-of-Record for Chrome Web Store."

---

## Mode: `commercial`

**When to use.** Paid SaaS, one-time licence, freemium with a paid tier — anything where revenue and pricing are load-bearing.

**Vocabulary to avoid.** OSS framing (`charity`, `pro bono`, `donation`, `volunteer basis`, `freemium-forever`). A commercial dossier treating revenue as optional reads as tone-deaf to the business context.

**Typical section emphasis.** Revenue model, pricing tiers, target customer segment, cost of acquisition, payment-rail choice, MoR/VAT/compliance, refund policy.

**Example framing to emulate.** "Paid CI service with per-seat pricing, Paddle as MoR for EU VAT handling, 14-day trial."

---

## Mode: `hiring`

**When to use.** Hiring-panel decision, candidate comparison, role-scoping.

**Vocabulary to avoid.** Compensation specifics (`salary`, `compensation`, `equity`, `bonus`) in the dossier body. Compensation lives in the offer letter. If a compensation reference is load-bearing for the decision, flag it and get hiring-lead approval before including.

**Typical section emphasis.** Role scope, must-have vs nice-to-have skills, team fit, interview-stage observations, references. Compensation lives in the offer letter, not the dossier body.

**Example framing to emulate.** "Senior frontend role, panel of four reviewers, decision by Friday."

---

## Mode: `vendor`

**When to use.** Evaluating outside vendors / services / providers for adoption.

**Vocabulary to watch.** `free tier`, `community edition`, `open core`. A vendor evaluation assuming the free tier is the long-term target may be misaligned with the decision model — if the free tier is genuinely the adoption target, justify it in a §Pricing section so the reviewer can challenge.

**Typical section emphasis.** Terms of service, pricing at expected scale, support tier, SLA, exit strategy, data-portability, contract model.

**Example framing to emulate.** "Choosing an issue tracker for a 12-person team over 3 years; switching cost dominates."

---

## Mode: `personal`

**When to use.** Household decisions, personal health, personal finance, personal project where framing-mode enforcement would be noise.

**Vocabulary.** No special constraints. Use natural language; the Key Facts box still applies (who decides, by when, under what constraints).

**Typical section emphasis.** Personal preferences, time cost, reversibility, stakes.

**Example framing to emulate.** "Which Italian region for two weeks of holiday — sea vs mountains vs city."

---

## Choosing a mode when unsure

| Situation | Mode |
|-----------|------|
| Publishing software under an OSI-approved licence without a paid tier | `oss` |
| Selling software or a service, even with a free trial | `commercial` |
| Comparing people for a role, contract, or promotion | `hiring` |
| Choosing an outside supplier for ongoing use | `vendor` |
| Private decision affecting the author / household | `personal` |

If two modes seem to apply (e.g. an OSS tool with an optional paid support contract), declare the dominant mode and use `<!-- allow-forbidden -->` on the lines where the secondary mode's vocabulary legitimately appears. If the cross-over is large, write two dossiers.
