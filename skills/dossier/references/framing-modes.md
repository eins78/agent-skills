# Framing Modes

Consult during SCOPE-AND-FRAME (phase 0) to pick the framing that matches the decision model, audience, and the artefact's real-world context. The forbidden-word lists are enforced by `.claude-plugin/hooks/dossier-forbidden-words.sh`; keep them in sync.

A framing mode is **declared**, not guessed. Add it to the dossier frontmatter:

```yaml
---
framing-mode: oss    # one of: oss, commercial, hiring, vendor, personal
---
```

If no mode is declared, the forbidden-word gate skips. The SCOPE step in SKILL.md makes declaration mandatory; this file defines what the declaration commits you to.

## Meta-denial exception

When a forbidden word must appear (e.g. "this is *not* lead-gen"), append `<!-- allow-forbidden -->` to the same line. The gate then skips that line. Put the whole denial phrase on one line. If you need the word unmarked, you probably have the wrong mode.

---

## Mode: `oss`

**When to use.** Free / libre / open-source artefact, published without a commercial lead-gen layer. Examples: Chrome extension to the Web Store, CLI tool on GitHub, Fediverse client, personal plugin.

**Forbidden words** (lowercase grep patterns, case-insensitive match):

- `lead-gen` — OSS isn't a funnel
- `paddle`, `stripe`, `mor` — payment providers belong in commercial framings
- `compliance officer`, `vat` — VAT/compliance tables are commercial apparatus
- `pricing` — an OSS tool has no pricing table; competitor-pricing citations in a §Competitive Landscape section are legitimate context, but mark those lines `<!-- allow-forbidden -->`
- `monetiz` — matches `monetize`, `monetization`, `monetised`
- `revenue` — free OSS doesn't have a revenue thesis
- `donation` — asking for donations turns an OSS extension into a different artefact; if you mean it, change the mode

**Typical section emphasis.** Community, reputation, contribution process, license choice, sustainability through maintainership (not revenue), adoption and discoverability.

**Example framings to emulate.** "Publishing a free OSS extension that solves a named friction; positioning as a reference implementation for Quatico's accessibility practice." The a11y-extension a11y-extension dossier post-OSS-overhaul is the in-repo reference.

**Example framings to avoid.** "How many leads does this bring per week." "Paddle vs. Stripe vs. Merchant-of-Record for Chrome Web Store."

---

## Mode: `commercial`

**When to use.** Paid SaaS, one-time licence, freemium with a paid tier — anything where revenue and pricing are load-bearing.

**Forbidden words** (case-insensitive):

- `charity`, `pro bono` — if the work is charitable, it is not commercial
- `donation` — commercial does not ask for donations
- `volunteer basis`
- `freemium-forever` — a framing red flag; either free forever (then OSS) or has a paid tier (then pricing-model section)

**Typical section emphasis.** Revenue model, pricing tiers, target customer segment, cost of acquisition, payment-rail choice, MoR/VAT/compliance, refund policy.

**Example framings to emulate.** "Paid CI service with per-seat pricing, Paddle as MoR for EU VAT handling, 14-day trial." "Enterprise add-on priced per project, sold only via direct contract."

**Example framings to avoid.** "Donation-supported commercial product."

---

## Mode: `hiring`

**When to use.** Hiring-panel decision dossier, candidate comparison, role-scoping.

**Forbidden words** (case-insensitive):

- `salary`, `compensation`, `equity`, `bonus`

These require explicit approval per the hiring process. If the dossier legitimately needs to include compensation ranges, the author adds `<!-- allow-forbidden -->` on each line AFTER checking with the hiring lead.

**Typical section emphasis.** Role scope, must-have vs nice-to-have skills, team fit, interview-stage observations, references. Keep compensation out of the dossier body; put it in the offer letter.

**Example framings to emulate.** "Senior frontend role, panel of four reviewers, decision by Friday." "Internal promotion case, evidence from last six months."

**Example framings to avoid.** "Candidate X is cheaper than Y, ship offer."

---

## Mode: `vendor`

**When to use.** Evaluating outside vendors / services / providers for adoption.

**Forbidden words** (case-insensitive):

- `free tier`, `community edition`, `open core` — these phrases tend to smuggle "we'll use the free version" into a vendor evaluation that should price the real cost at the expected usage tier

If the evaluation deliberately considers a free-tier as the adoption target, mark those lines `<!-- allow-forbidden -->` and justify in a §Pricing section.

**Typical section emphasis.** Terms of service, pricing at expected scale, support tier, SLA, exit strategy, data-portability, contract model.

**Example framings to emulate.** "Choosing an issue tracker for a 12-person team over 3 years; switching cost dominates." "Picking an auth provider for a regulated environment."

**Example framings to avoid.** "The free tier covers us forever."

---

## Mode: `personal`

**When to use.** Household decisions, personal health, personal finance, personal project where framing-mode enforcement would be noise.

**Forbidden words.** None. The gate exits 0 for this mode.

**Typical section emphasis.** Personal preferences, time cost, reversibility, stakes. The Key Facts box still applies — who decides, by when, under what constraints.

**Example framings to emulate.** "Which Italian region for two weeks of holiday — sea vs mountains vs city." "Kitchen knife replacement, € 100 budget."

---

## Choosing a mode when unsure

A decision matrix:

| Situation | Mode |
|-----------|------|
| Publishing software under an OSI-approved licence without a paid tier | `oss` |
| Selling software or a service, even with a free trial | `commercial` |
| Comparing people for a role, contract, or promotion | `hiring` |
| Choosing an outside supplier for ongoing use | `vendor` |
| Private decision affecting the author / household | `personal` |

If two modes seem to apply (e.g. an OSS tool with an optional paid support contract), declare the dominant mode and use `<!-- allow-forbidden -->` on the lines where the secondary mode's vocabulary legitimately appears. If the cross-over is large, write two dossiers.
