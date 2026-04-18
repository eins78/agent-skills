# Framing Modes

Consult during FRAME (phase 0) to pick the framing that matches the decision model, audience, and artefact context. The canonical forbidden-word lists live in [`framing-modes.yaml`](./framing-modes.yaml) and are enforced by `.claude-plugin/hooks/dossier-forbidden-words.sh`. Edit the YAML; this file documents *when* to pick each mode and *what* the mode commits the dossier to.

A framing mode is **declared**, not guessed. Add it to the dossier frontmatter:

```yaml
---
framing-mode: oss    # one of: oss, commercial, hiring, vendor, personal
---
```

Declaration is enforced by `dossier-framing-declared.sh`. A dossier with no `framing-mode:` frontmatter (and no `<!-- dossier-framing-mode: ... -->` HTML-comment fallback) fails the declaration gate — this closes a silent-skip where a missing declaration bypassed all vocabulary enforcement.

## Meta-denial exception

When a forbidden word must appear (e.g. "this is *not* lead-gen"), append `<!-- allow-forbidden -->` to the same line. The gate then skips that line. Put the whole denial phrase on one line. If you need the word unmarked, you probably have the wrong mode.

## Template placeholder handling

Templates use `{curly-brace-or-pipe}` placeholders to signal fields to fill in. Example in `skills/dossier/templates/dossier.md`:

```yaml
---
framing-mode: {oss | commercial | hiring | vendor | personal}
---
```

`dossier-forbidden-words.sh` skips brace- or pipe-containing mode values (template not yet instantiated). Any new hook that reads `framing-mode:` from a template file must apply the same skip. The dispatcher also filters `*/templates/*` paths; most hooks inherit the skip for free, but direct invocation against a template file must handle the placeholder.

---

## Mode: `oss`

**When to use.** Free / libre / open-source artefact, published without a commercial lead-gen layer. Examples: Chrome extension to the Web Store, CLI tool on GitHub, Fediverse client, personal plugin.

**Canonical forbidden-word list:** [`framing-modes.yaml`](./framing-modes.yaml) → `modes.oss.forbidden`. Rationale per word lives there as inline comments; the sweep is case-insensitive.

**Typical section emphasis.** Community, reputation, contribution process, license choice, sustainability through maintainership (not revenue), adoption and discoverability.

**Example framing to emulate.** "Publishing a free OSS extension that solves a named friction; positioning as a reference implementation."

**Example framing to avoid.** "Paddle vs. Stripe vs. Merchant-of-Record for Chrome Web Store."

---

## Mode: `commercial`

**When to use.** Paid SaaS, one-time licence, freemium with a paid tier — anything where revenue and pricing are load-bearing.

**Canonical forbidden-word list:** [`framing-modes.yaml`](./framing-modes.yaml) → `modes.commercial.forbidden`.

**Typical section emphasis.** Revenue model, pricing tiers, target customer segment, cost of acquisition, payment-rail choice, MoR/VAT/compliance, refund policy.

**Example framing to emulate.** "Paid CI service with per-seat pricing, Paddle as MoR for EU VAT handling, 14-day trial."

---

## Mode: `hiring`

**When to use.** Hiring-panel decision, candidate comparison, role-scoping.

**Canonical forbidden-word list:** [`framing-modes.yaml`](./framing-modes.yaml) → `modes.hiring.forbidden`. Compensation specifics require explicit approval; add `<!-- allow-forbidden -->` on the relevant line after checking with the hiring lead.

**Typical section emphasis.** Role scope, must-have vs nice-to-have skills, team fit, interview-stage observations, references. Compensation lives in the offer letter, not the dossier body.

**Example framing to emulate.** "Senior frontend role, panel of four reviewers, decision by Friday."

---

## Mode: `vendor`

**When to use.** Evaluating outside vendors / services / providers for adoption.

**Canonical forbidden-word list:** [`framing-modes.yaml`](./framing-modes.yaml) → `modes.vendor.forbidden`. If the evaluation deliberately considers a free-tier as the adoption target, mark those lines `<!-- allow-forbidden -->` and justify in a §Pricing section.

**Typical section emphasis.** Terms of service, pricing at expected scale, support tier, SLA, exit strategy, data-portability, contract model.

**Example framing to emulate.** "Choosing an issue tracker for a 12-person team over 3 years; switching cost dominates."

---

## Mode: `personal`

**When to use.** Household decisions, personal health, personal finance, personal project where framing-mode enforcement would be noise.

**Forbidden words.** None (`modes.personal.forbidden: []`). The gate exits 0 for this mode.

**Typical section emphasis.** Personal preferences, time cost, reversibility, stakes. The Key Facts box still applies — who decides, by when, under what constraints.

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
