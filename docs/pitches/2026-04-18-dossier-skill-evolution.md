# Pitch — `dossier` skill evolution

**Date:** 2026-04-18
**Author:** Claude Code (commissioned by Max Albrecht)
**Status:** Proposal — awaiting direction
**Basis:** ~4-hour, five-round dossier session for the `heading-outline-extension` Chrome Web Store publication, in `quatico-workspace` on 2026-04-17 / 2026-04-18.

---

## Executive summary

**Recommendation.** Ship **Path A** (status-quo-plus improvements to `dossier`) in the next 1–2 weeks. Then, after two more real-world uses of the improved skill validate the new conventions, split **`ballot` out as a standalone skill** (Path B). Leave the three-way split (Path C) out of scope — research and synthesis iterate too tightly to separate cleanly.

**Why this order.** The recent a11y-extension session exposed eleven concrete failure modes (framing mismatch, dated-claim drift, citation orphans, commercial-framing leaks, anti-option padding, DEC-008 time-horizon mixing, ballot-format iteration, misplaced reconciliation, cover-block archaeology, over-engineered intermediate templates, and glossary-and-key-facts placed at the back instead of the front). Seven of the eleven are addressable with small additions to the existing `dossier` skill — and six of those seven can be **gates** (hook-backed shell checks with exit codes) rather than rules the agent might rationalise away. The remaining failure modes are about the *ballot as an artefact*; they deserve a dedicated skill because the ballot is already used outside dossier contexts (Quatico sales-hub ballots, and natural fits for ADRs, architecture reviews, hiring panels, vendor selection, household decisions).

**What this pitch is not.** A commit-ready plan. It recommends a direction, quantifies effort, and lists the open questions that must be answered before implementation begins.

---

## Observed failure modes

Each entry: what happened, evidence in the real artefacts, hypothesis for why it happened, and whether the fix can be a **gate** (enforced) or only a **rule** (guidance).

Artefact paths used below (all in `quatico-workspace`):
- Dossier: `docs/stories/a11y-extension/DOSSIER-A11y-Extension-Chrome-Store-2026-04-17.md` (903 lines)
- Ballots: `docs/stories/a11y-extension/DOSSIER-A11y-Extension-Chrome-Store-BALLOT-Max.md` (324 lines) and `BALLOT-Patrick.md` (326 lines)
- Sessionlog: `docs/sessionlogs/2026-04-18-a11y-dossier-oss-overhaul.md` (250 lines)

### 1. Framing mismatch went undetected until round 1 review

**What.** The initial dossier came out with commercial framing (lead-gen arithmetic, Paddle/Stripe payment comparison, MoR/VAT compliance tables, brand-positioning of Quatico) for a project that was being published as a **free OSS Chrome extension**. Two full rounds (delegate overhaul, then manual economy pass) were required to expel the commercial frame.

**Evidence.** Commit `52cd929` ("strip commercial/monetisation framing from a11y dossier") plus `0502fa5` ("rewrite sections 1 and 9 in OSS frame; reframe sections 7, 8, 10") — a multi-section overhaul across §1, §5, §6, §7, §8, §9, §10, §11, §12. Sessionlog lines 10–32 document the framing-correction round.

**Why.** The `dossier` skill does not ask about decision model, commercial-vs-OSS context, or who the audience is before generating. It defaults to whatever framing the evidence corpus suggests, and evidence for a Chrome extension inevitably surfaces Chrome Web Store monetisation material.

**Gate-capable.** Partial. A framing-elicitation prompt ("OSS / commercial / hiring / vendor / personal / other") can be enforced as a checklist item the dossier must declare at the top; a hook can grep for that declaration and fail the commit if missing. The framing itself is judgement, not machine-checkable — but *declaring the framing* is.

### 2. Dated claims drifted from reality

**What.** The initial dossier stated "Accessibility Club Summit CFP closes 30 April 2026." The actual CFP closed 29 March 2026, three weeks before the session. The mistake was caught during the OSS-overhaul delegate's fact-check round — but only because the brief explicitly asked for date verification.

**Evidence.** Cited in the session memory, fixed during commit `b328091` ("add OSS research — CONTRIBUTING / CLA vs DCO / release strategy") which re-audited all dated claims.

**Why.** Dates in source material become stale. The dossier workflow has no step that says "every date, deadline, CFP, release-window claim must be re-verified against a primary source with today's date."

**Gate-capable.** Partial. A hook can grep for date patterns (`\d{4}-\d{2}-\d{2}`, "closes X 2026", etc.) and flag each for a citation-with-access-date. Full verification still requires the agent to actually check — but surfacing every dated claim is mechanical.

### 3. Citation integrity broke silently

**What.** The initial dossier used `[G6]` inline in §3 but §12 Sources had no entry for `[G6]`. The orphan was not caught until the OSS-overhaul delegate ran a post-pass citation audit.

**Evidence.** Commit `bfee937` ("fix citation [G6] in a11y dossier + citation integrity audit"). Sessionlog lines 95–110 document the full audit trail: 118 citation definitions, zero remaining orphans after the fix.

**Why.** No built-in post-pass that cross-checks every `[Xn]` in body against §sources definitions.

**Gate-capable.** **Yes — fully.** A shell script (`grep -oE '\[[A-Z]+[0-9]+\]'` on body vs definitions, diff, exit 1 on mismatch) can be a PreCommit or post-synthesis hook. This is the clearest gate candidate of the ten.

### 4. Commercial-framing leak was detectable by word sweep

**What.** The OSS-overhaul delegate ran a forbidden-word sweep (lead-gen, Paddle, Stripe, MoR, compliance officer, VAT, pricing, monetiz, revenue, donation) and confirmed zero hits in the final dossier. Verified independently for this pitch: the final file contains `lead-gen` once (line 71, intentional meta-denial: "This is *not* lead-gen; it is honest public work"), `revenue` once (line 444, intentional meta-denial: "A free OSS extension does not need a revenue thesis"), and `pricing` three times (lines 827, 828, 840 — all competitor-pricing citations in §5 competitive landscape, which is legitimate context for an OSS tool's positioning). Everything else: zero.

**Evidence.** Sessionlog lines 112–125.

**Why.** Forbidden-word sweeps are generalisable: for any given framing mode, certain words should not appear. OSS mode forbids commerce vocabulary; commercial mode flags "charity" / "donation" as framing risks; hiring mode forbids salary specifics without explicit approval.

**Gate-capable.** **Yes — fully.** Per-framing-mode wordlists + `grep -i -c` + exit code. Cleanest gate in the bag.

### 5. Anti-options created friction without adding rigor

**What.** The economy pass cut four ballot options explicitly labelled "not recommended" or "for completeness": `DEC-001 Individual account` (partially — kept as contrast), `DEC-003 All four browsers`, `DEC-004 Per-browser forks`, `DEC-009 Proprietary / All rights reserved`, `DEC-015 Quatico-org-level template set`. These had been included to demonstrate thoroughness but forced reviewers to read, consider, and reject each one — adding tick-time and scanning load without changing outcomes.

**Evidence.** Commit `24159cb` ("ballot economy pass — cut anti-options and mis-scoped DEC-008 items"). Reduced per-reviewer ballot from 367 to 324 lines (−43 lines, −11.7%). Note: the session brief said "cut 6 items" but the actual economy-pass decomposed into four anti-option deletions + three DEC-008 re-scopes; the pitch cites four anti-options specifically.

**Why.** "Show your work" instinct: list the options considered and rejected. Appropriate in an evaluation narrative; inappropriate in a decision ballot whose purpose is to save reviewer time.

**Gate-capable.** Partial. A hook can grep for ballot options containing `not recommended`, `for completeness`, `maintenance trap`, `obviously wrong` — and require a justification comment if present. Harder to catch without anti-option phrasing; mostly a rule.

### 6. DEC-008 mixed two time-horizons in one decision

**What.** The initial ballot DEC-008 ("launch channels") multi-select contained both launch-day channels (Show HN, Product Hunt, Hacker News, r/accessibility) and follow-up conference commitments (axe-con 2027 CFP, CSUN ATC 2027, Accessibility Club Summit Day-1 demo — 6–12 months out). Reviewers ticking this DEC had to context-switch between "what do we do next week" and "what do we commit to for a conference next year."

**Evidence.** Commit `24159cb` moved the three conference-followup items out of DEC-008 into §9 "Could-tier" of the dossier proper, leaving DEC-008 as launch-day channels only.

**Why.** No guidance in the skill that says "one DEC = one decision surface = one time-horizon."

**Gate-capable.** No. Detecting time-horizon mixing is semantic — can't be machine-checked without NLP. Rule only.

### 7. Ballot format iterated three times before landing

**What.** Round 1 shipped a single ballot file with two checkboxes per line (`- [ ] Max [ ] Patrick — option`), cramped on iPad. Round 2 split into per-reviewer files matching the Quatico sales-hub convention. Round 3 (the template pushback, see #4 below) kept a separate template file alongside the two reviewer files — Max challenged, and it was cut.

**Evidence.** Commit `c12d484` ("split ballot into per-reviewer files; single Reviewer column per row") and `a721019` ("drop ballot template; reconciliation moves to sessionlog"). The ballot template lives *nowhere* in the final state — and that's correct, because the structure is identical across the two reviewer files; duplicating it into a template adds a third file to maintain.

**Why.** No ballot template exists in `skills/dossier/templates/` today. The skill's only reference to ballots (line 58 of SKILL.md) says "checkboxes for iPad/phone editing" — a hint, not a specification.

**Gate-capable.** Partial. A template file would make the per-reviewer structure the default. A hook could check that ballots live at `DOSSIER-*-BALLOT-*.md` (reviewer in filename) rather than `DOSSIER-*-BALLOT.md` (single-file).

### 8. Reconciliation wants to live with the session, not as its own file

**What.** The round-3 over-engineering put reconciliation (Agreement Summary table, DEC-by-DEC Max/Patrick/Agreed? grid) into a standalone "template" file. Max pushed back: sales-hub precedent has per-reviewer files only; reconciliation belongs in the sessionlog where the discussion context lives.

**Evidence.** Commit `a721019`. Sessionlog lines 222–241 contain the skeleton reconciliation table, awaiting population when the ballots return. One file, one place — not a separate artefact.

**Why.** Agreement/reconciliation is a *session output*, not a durable artefact. The ballots are the durable artefact; the sessionlog captures what happened when they were reconciled.

**Gate-capable.** No. Purely convention. Rule in the ballot skill's documentation.

### 9. Cover-block archaeology wasted reviewer attention

**What.** An intermediate ballot version had a "Ballot updated 2026-04-18" paragraph in the cover block, explaining what had changed since the previous version. Reviewers ticking decisions don't care about a changelog — they care about the current state of the decisions.

**Evidence.** Commit `a721019` removed the update-log paragraph. Final ballots have a clean cover block: reviewer designation (Max / Patrick), their role ("publication sponsor" / "extension author, product owner, co-developer"), cross-reference to the peer ballot, link to the full dossier. That's it.

**Why.** Natural instinct during iteration: "the reviewer needs to know I changed things." Wrong audience; the commit log and sessionlog are the right place.

**Gate-capable.** Partial. A hook could flag ballot cover blocks containing `updated YYYY-MM-DD`, `changes since`, `previous version`.

### 10. The delegate worked well given a good brief

**What.** Given the five-round brief, the OSS-overhaul delegate completed the §1/§5/§6/§7/§8/§9/§10/§11/§12 rewrite in ~42 minutes with three interview-stage questions and auto-approval. Commits 0502fa5 through 46d629a span 20 minutes of the 42.

**Evidence.** Sessionlog lines 126–140 list the seven commits from the overhaul run, each with clear scope.

**Why — what worked.** (a) Explicit framing correction up front. (b) Named concrete artefacts to audit. (c) Enumerated the commercial vocabulary to eliminate. (d) Pointed at the Quatico sales-hub precedent for ballot format.

**Implication.** Any evolution of the skill must preserve delegate-friendliness. This rules out heavy interactive elicitation — the improvements must read as structured checklists a delegate can follow, not multi-turn dialogues.

**Gate-capable.** N/A (not a failure).

### 11. Glossary and key facts landed at the back, not the top

**What.** The quatico dossier's reader hits §1 Executive Summary on line 32, then §2 through §10 across lines 116–704, and only reaches the Glossary at §11 (line 735) and Sources at §12 (line 755). By the time the reader reaches §11 they have already encountered CDP, AX tree, `chrome.debugger`, EAA, BehiG, MoR, trader verification, Established Publisher, Group publisher, CLA, DCO, MV3 — each for the first time, without context. There is no "key facts" box at the top summarising who decides, the decision model, hard constraints, deadline, or the 3–5 most load-bearing claims.

**Evidence.** Quatico dossier `DOSSIER-A11y-Extension-Chrome-Store-2026-04-17.md` lines 14–28 (How-To-Read block — correctly at top), line 32 (§1 Executive Summary — starts using jargon before glossary), line 735 (§11 Glossary — first definition appears after 703 lines of content), line 755 (§12 Sources — correctly at end).

**Why.** The current template at `skills/dossier/templates/dossier.md` actually has **Key Concepts at line 9**, right after metadata — correctly placed. The a11y session moved it to the back, likely by analogy with the sources convention (both are "reference material"). That analogy is wrong: glossary is *read-support* (needed **before** encountering terms in content); sources are *trust-support* (checked **after** content, when a specific claim is questioned). Conflating them places both at the back and breaks read-support.

The template also has **no key-facts box** — a quick-reference one-screen summary of who/what/when/constraints. Readers with five minutes currently get routed to "read §1 Executive Summary" (per the How-To-Read block), but §1 is prose, not a key-facts box.

**Gate-capable.** **Yes — partial.** A hook can check section ordering: if a section titled Glossary / Key Concepts / Terminology appears after the Executive Summary or Management Summary section, fail. Key-facts box can be enforced by grep for a known heading or frontmatter field.

**Template implication (specific).** The default dossier structure should be:

1. Title + date + authors + status
2. **How to read this document** (5 / 15 / 60-minute paths — quatico dossier already has this)
3. **Key facts** (one-screen box: who decides, decision model, hard constraints, deadline, 3–5 load-bearing claims) — **new**
4. **Glossary** (terms needed to read the rest — skim or skip, but present so terms are loaded before they appear) — **moved from back to front**
5. Executive summary
6. …rest of sections (current state, requirements, evaluations, recommendations, ballot)
7. Sources (stays at end — trust-support, consulted after content)

The asymmetry (glossary-first + sources-last) is deliberate: different reader needs, different placements.

---

## Pitch directions

Three evolution paths, each with one-line description, scope, pros/cons, effort estimate, and which failure modes it addresses.

### Path A — Status Quo+ (recommended first phase)

**One-line.** Keep `dossier` as a single skill; add the five conventions that the a11y session hand-rolled (framing elicitation, citation-integrity audit, dated-claim verification, forbidden-word sweep, anti-option guidance) as explicit steps in SKILL.md, with hook-backed gates where possible.

**Scope.**
- Extend `skills/dossier/SKILL.md`: add a §0 SCOPE-AND-FRAME step (declare decision model + framing mode + audience); add citation-integrity audit to §4 SYNTHESIZE; add dated-claim verification to §2 GATHER.
- New reference: `skills/dossier/references/framing-modes.md` — OSS / commercial / hiring / vendor / personal, with per-mode forbidden-word lists.
- New reference: `skills/dossier/references/audit-checks.md` — citation-integrity script, dated-claim grep, forbidden-word sweep.
- New template: `skills/dossier/templates/ballot-per-reviewer.md` (replaces the implicit single-file ballot).
- Optional hooks in `.claude-plugin/hooks/` (citation audit, forbidden-word sweep) — these are real gates, not rules.

**Pros.**
- Lowest risk; no split, no skill-listing churn, existing users unaffected.
- The gates (citation audit, forbidden-word sweep) land as hooks — enforced, not rationalised around.
- Delegate-friendly: checklists, not dialogue.

**Cons.**
- The ballot artefact and its conventions stay buried inside `dossier`. Users who want a ballot *without* a full research dossier (architecture review, hiring panel, household decision, vendor selection) still have to adopt the whole dossier pipeline or copy-paste from the template.
- SKILL.md grows from 99 to ~150 lines. Still well inside house-style range (75–197 lines across `tracer-bullets` and `lab-notes`), but adding mass to a single skill.

**Effort.** Moderate. One SKILL.md rewrite, two new references, one new template, two hook scripts. 1–2 focused days of work.

**Failure modes addressed.** #1 (framing), #2 (dated claims), #3 (citation integrity), #4 (forbidden words), #5 (anti-options), #9 (cover archaeology). Partial on #6 (time-horizon — rule only). Leaves #7 (ballot format iteration — template helps but the single-skill-for-all-ballots gap remains) and #8 (reconciliation placement) under-addressed.

### Path B — Split `dossier` + `ballot` (recommended second phase)

**One-line.** Extract ballot conventions into a standalone `skills/ballot/` skill, callable from `dossier` when contested decisions need extracting, *and* callable standalone for non-dossier contexts.

**Scope.**
- New skill: `skills/ballot/` with `SKILL.md`, `README.md`, `templates/ballot-per-reviewer.md`, `references/ballot-conventions.md`.
- The ballot skill specifies: per-reviewer file format (sales-hub convention), cover block template (no archaeology), anti-option warning, time-horizon-per-DEC rule, reconciliation-in-sessionlog convention, tiered Must/Should/Could structure, recommended-but-not-pre-ticked pattern.
- Trim `dossier` SKILL.md's ballot section to a cross-reference: "for decision ballots, see the `ballot` skill."
- Update root `README.md` skills table to list both.
- Update `.claude-plugin/marketplace.json` if per-skill entries are added (currently one entry for the whole plugin; check before splitting).

**Pros.**
- Ballot becomes reusable for ADR-like architecture reviews, hiring panel decisions, vendor selection, even household decisions with Naomi. The sales-hub precedent Max already uses outside dossier contexts is a proven reuse case.
- Each skill stays focused. `dossier` becomes "research + synthesis + optional ballot cross-reference"; `ballot` becomes "multi-reviewer decision instrument."
- The ballot skill can be adopted without adopting the dossier workflow — important for lightweight architecture-call votes.

**Cons.**
- Two skills to maintain. But each is smaller and more focused than one mega-skill; the net complexity is not obviously higher.
- Cross-reference protocol needs specification: when `dossier` invokes `ballot`, how is the handoff shaped? (Likely: `dossier` SCOPE step outputs a "contested decisions" list; `ballot` consumes it. This is in-conversation, not a formal API.)
- The split changes the skill listing, which is a user-visible change. Must be done via a single PR that lands both skills and the cross-references simultaneously.

**Effort.** Moderate-high. ~3–4 days: new skill with full SKILL.md/README/template/reference, dossier SKILL.md trim, root README update, cross-reference testing.

**Failure modes addressed.** All ten, including the three that Path A under-serves (#6 time-horizon rule, #7 ballot format default, #8 reconciliation placement) — because the ballot skill owns these conventions explicitly.

### Path C — Three-way split: `research` + `dossier` + `ballot` (not recommended)

**One-line.** Extract research (evidence gathering, citation hygiene, primary-source preference, dated-claim verification, forbidden-word sweep) into its own skill, feeding both `dossier` and other artefacts (lab-notes, framing-doc, kickoff-doc, ADRs). `dossier` becomes synthesis-only.

**Scope.** Same as Path B but with an additional `skills/research/` skill.

**Pros.**
- Maximally expressive: each primitive reusable.
- Research hygiene (citation integrity, forbidden words, dated-claim verification) becomes a named primitive applicable to any artefact.

**Cons.**
- **The research/synthesis split is artificial.** The a11y session showed zero clean "research done, now synthesise" boundary. The OSS-reframe delegate iterated between new research (O-series citations on CLA-vs-DCO, OSS release conventions) and rewriting sections as the new evidence landed. A research-only skill would either (a) ship research findings as a static report that the dossier skill can't add to, forcing a rerun, or (b) be so bi-directionally coupled with dossier that the split adds complexity without benefit.
- Three skills triples maintenance burden. If research hygiene is the reusable part, it can live in a shared `references/` file the other skills link into — no full skill split needed for that.
- No precedent in this repo for a three-way skill split; current skills are designed complementary, not nested.

**Effort.** High. ~5–7 days: three skills, defined handoff protocols, cross-skill testing.

**Failure modes addressed.** Same as Path B. Additional reuse of the research primitive, but at higher cost than the benefit justifies based on the evidence.

### Other ideas (orthogonal to A/B/C)

- **`dossier-audit` quality-gate skill.** A separate skill that runs the post-pass checks (citation integrity, forbidden-word sweep, anti-option detection, ballot ticking-time estimate). Could be invoked mid-production or as a final gate. Orthogonal to A/B/C — adopting any of them, this can still be a separate quality-gate surface. Skipping for now; Path A's hook-backed gates cover the core needs.
- **Framing-mode templates.** OSS dossier / commercial dossier / hiring dossier / vendor-selection dossier as separate `templates/dossier-{mode}.md` files. Alternative: one parameterised template with mode-specific sections commented out. Decision deferred — see Open Questions.
- **Ballot-only lightweight skill.** If `ballot` splits out (Path B), also offer a minimal "decisions-for-reviewers" sub-workflow without the full dossier pipeline — e.g. an architecture call where the decisions are known upfront and no research is required. This is likely just `ballot` skill's default usage when invoked standalone; no separate skill needed.
- **Rename `dossier` to `research-dossier`.** Clarifies that it's research + synthesis, not decoration. But `dossier` is short, memorable, and already has trigger keywords listed. Rename adds syllables for marginal clarity benefit. Decision deferred — see Open Questions.

---

## Recommended path

**Phase 1 (next 1–2 weeks): Path A improvements land in `dossier`.**

What goes into `skills/dossier/`:
- SKILL.md: new §0 SCOPE-AND-FRAME step (framing declaration + audience + decision model), new citation-integrity step in §4 SYNTHESIZE, new dated-claim verification step in §2 GATHER, new "anti-options are friction" warning near the ballot reference, new forbidden-word sweep step before DELIVER, explicit **"glossary and key-facts go first, sources go last"** template rule (addresses failure mode #11).
- `templates/dossier.md`: restructure to lead with (1) metadata, (2) How-to-read block, (3) **Key facts box** (new), (4) Glossary (currently named "Key Concepts" — stays at top, relabel optional), (5) Executive/Management Summary, then rest, with Sources always last. Preserve the existing REQUIRED/OPTIONAL comment markers; add a sharp comment at the top of Glossary saying *"stay at top; do not move to appendix — asymmetric to Sources on purpose."*
- `references/framing-modes.md`: OSS / commercial / hiring / vendor / personal with per-mode forbidden-word lists and typical section structures.
- `references/audit-checks.md`: citation-integrity shell snippet, dated-claim grep pattern, forbidden-word sweep script, ballot format check, section-order check (Glossary position before Executive Summary).
- `templates/ballot-per-reviewer.md`: the sales-hub per-reviewer ballot template with Must/Should/Could tiers, clean cover block, no anti-options by default.
- Optional: `.claude-plugin/hooks/dossier-audit.sh` as a PostToolUse hook (or `pnpm run dossier:audit` — see Open Questions) that runs the four automatable checks (citation integrity, forbidden-words, ballot filename, section-order).
- Root `README.md`: no change (no new skill, no rename).
- CHANGESET: minor bump (new sections, expanded coverage — semver `1.0.1` → `1.1.0`).

**What becomes a gate vs a rule:**

| Improvement | Type | Enforcement |
|-------------|------|-------------|
| Citation-integrity audit | **Gate** | `grep` body `[Xn]` vs §sources, exit 1 on mismatch |
| Forbidden-word sweep | **Gate** | `grep -i -c` per-mode wordlist, exit 1 on hit |
| Ballot filename pattern (`*-BALLOT-<reviewer>.md`) | **Gate** | path check in hook |
| Framing declaration present | **Gate** | grep for framing frontmatter or declaration line |
| Section-order (Glossary before Executive, Sources at end) | **Gate** | parse H2 order, fail if Glossary appears after Executive Summary |
| Key-facts box present | **Gate** | grep for the Key-facts heading within first N sections |
| Dated-claim verification | Rule + partial gate | gate flags dates, agent must verify |
| Anti-option discouragement | Rule + partial gate | gate flags phrase patterns, agent justifies or removes |
| Time-horizon-per-DEC | Rule | semantic, can't auto-check |
| Cover-block archaeology removal | Rule + partial gate | gate flags "updated YYYY-MM-DD" in ballot covers |
| Reconciliation in sessionlog | Rule | convention |
| One decision surface per DEC | Rule | semantic |

**Phase 2 (after two more real-world uses of Phase-1 dossier): Path B split.**

Criteria for Phase 2 go:
- Phase 1 shipped, at least two additional dossiers produced under the new conventions.
- No regressions: citation audit gate catches every orphan attempted; forbidden-word sweep gate passes on all shipped dossiers.
- At least one confirmed non-dossier ballot use case actively wanted (ADR, architecture review, hiring panel, vendor selection, or household decision), to validate that `ballot` has real reuse value.

If criteria met, extract `skills/ballot/` per Path B scope above. If not, stay on Path A and revisit.

**Out of scope for both phases:**
- Path C (three-way research split). Revisit only if research hygiene turns out to be wanted by multiple non-dossier skills (lab-notes, framing-doc, kickoff-doc) in practice — revisit after lab-notes adopts research hygiene organically, if ever.

---

## Open questions for Max

These are the decisions I can't make alone. Each is a 30-second answer; pick one:

**Q1. Gate implementation: hooks or pnpm script?**
- Option (a): bash hooks in `.claude-plugin/hooks/` triggered on tool events. Enforced at agent runtime. Matches the repo's gates-over-rules philosophy.
- Option (b): `pnpm run dossier:audit` script invoked manually and by CI. Lower-friction to author; easier for humans to run; but not a gate — just a script.
- Recommendation: (a) for citation integrity and forbidden-word sweep; (b) for dated-claim flagging where the agent still has to verify.

**Q2. Framing-mode templates: separate files or parameterised single template?**
- Option (a): `templates/dossier-oss.md`, `dossier-commercial.md`, `dossier-hiring.md`, `dossier-vendor.md` — four files, each focused.
- Option (b): one `templates/dossier.md` with mode-specific sections in `<!-- MODE: oss -->` comments, and a mode declaration at the top.
- Recommendation: (b) — keeps template maintenance in one place, matches the existing template's REQUIRED/OPTIONAL comment style.

**Q3. Rename `dossier` → `research-dossier`?**
- Option (a): Keep `dossier`. Short, memorable, trigger keywords already bound.
- Option (b): Rename to `research-dossier`. Clearer about scope; more searchable; but adds syllables and requires skill-listing update.
- Recommendation: (a). "Dossier" is a weird word in English but the trigger-keyword list in the current description already covers the discoverability gap.

**Q4. If Path B ships, is "ballot" the right name?**
- Option (a): `ballot`. Matches Quatico sales-hub convention; precise.
- Option (b): `decision-ballot`. More explicit about purpose.
- Option (c): `review-decision` or `decision-review`. Emphasises the multi-reviewer aspect.
- Recommendation: (a). Short. Matches existing Quatico terminology Max already uses.

**Q5. Is `docs/pitches/` now a repo convention, or one-off?**
- Option (a): One-off — this pitch doc lives here, future pitches use whatever format fits.
- Option (b): Convention — future skill evolutions land first as `docs/pitches/YYYY-MM-DD-<slug>.md`, then implementation.
- Recommendation: (b) if the repo sees more than one non-trivial skill evolution in the next 3 months; (a) otherwise. Cheap to defer; no commitment needed in this PR.

**Q6. Phase-1 changeset type — patch, minor, or major?**
- Path A adds new sections and new templates to an existing skill — that's minor by the repo's own semver rules (`.claude-plugin/plugin.json` / `CHANGELOG` convention in CLAUDE.md).
- Recommendation: **minor** (`1.0.1` → `1.1.0`). Not major unless a workflow is breaking (e.g. removing the single-file ballot pattern from template) — and even then, since no explicit ballot template exists today, there's nothing to break.

---

## Rollout sketch

Not an implementation plan — a sketch of what each phase touches. The actual implementation plan gets written in a separate doc once Open Questions are answered.

### Phase 1 — Path A improvements (Week 1–2 after approval)

**Files touched:**
- `skills/dossier/SKILL.md` — rewrite, ~99 → ~160 lines
- `skills/dossier/README.md` — update known-gaps and provenance sections
- `skills/dossier/templates/dossier.md` — **restructure**: insert Key-facts box between How-to-read and Glossary; affix top-of-file comment *"Glossary stays at top; Sources stay at end; this asymmetry is deliberate — glossary is read-support, sources are trust-support."*
- `skills/dossier/references/framing-modes.md` — **new**, ~80 lines
- `skills/dossier/references/audit-checks.md` — **new**, ~60 lines (includes section-order check script)
- `skills/dossier/templates/ballot-per-reviewer.md` — **new**, ~120 lines (per-reviewer template with Must/Should/Could tiers, clean cover, anti-option warnings inline)
- `.changeset/<timestamp>.md` — **new**, minor bump per Q6

**Optional in Phase 1 (can defer to Phase 1.5 if time-boxed):**
- `.claude-plugin/hooks/dossier-citation-audit.sh` — grep-based orphan detector
- `.claude-plugin/hooks/dossier-forbidden-words.sh` — per-mode wordlist check
- Hook wiring in `.claude-plugin/plugin.json` or equivalent

**Verification:**
- `pnpm test` — skills CLI lists all skills without errors
- `pnpm run validate` — frontmatter validation passes
- Hand-run: produce one test dossier using the new template, verify citation-audit hook catches an intentionally-orphaned citation
- Hand-run: produce an OSS dossier with commercial vocabulary intentionally seeded; verify forbidden-word sweep catches it

### Phase 2 — Path B split (1–2 weeks after Phase 1 validates)

**Files touched:**
- `skills/ballot/SKILL.md` — **new**, ~140 lines
- `skills/ballot/README.md` — **new**
- `skills/ballot/templates/ballot-per-reviewer.md` — **moved** from `skills/dossier/templates/` (if Phase 1 landed it there)
- `skills/ballot/references/ballot-conventions.md` — **new** (time-horizon rule, anti-option rule, cover-block cleanness, reconciliation-in-sessionlog)
- `skills/dossier/SKILL.md` — trim ballot section to a cross-reference
- Root `README.md` — add `ballot` row to skills table
- `.claude-plugin/marketplace.json` — update if per-skill entries used (verify current format before editing)
- `.changeset/<timestamp>.md` — minor bump (new skill) or major bump on `dossier` (ballot content migrates out)

**Verification:**
- `pnpm test` — both skills listed
- Hand-run: invoke `ballot` standalone for a non-dossier decision (e.g. a local ADR); verify workflow is coherent without dossier context
- Hand-run: invoke `dossier` → cross-ref to `ballot`; verify the handoff flows

### What this pitch does not commit to

- **No SKILL.md drafting.** The new `dossier` SKILL.md text isn't written here; that's a Phase 1 implementation concern.
- **No hook scripts.** The actual grep patterns and exit codes are Phase 1 work.
- **No `ballot` SKILL.md.** Phase 2 work only.
- **No `docs/pitches/` convention commitment.** Q5 above.

---

## Closing

The a11y-extension session shipped. The dossier is OSS-framed, citations are clean, ballots are in reviewers' hands. The gap between "it shipped" and "it shipped smoothly" is the gap this pitch closes.

Phase 1 lands the five automatable improvements as gates (where possible) in the existing skill — low risk, high leverage, delegate-friendly. Phase 2 splits the ballot primitive out so it can earn its keep outside dossier contexts, after Phase 1 validates the conventions.

Max: pick Path A + B, or reject and counter. Open Questions 1–6 are the only decisions that block implementation.
