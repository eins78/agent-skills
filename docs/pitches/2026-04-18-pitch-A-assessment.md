# Critical self-assessment — Pitch A POC

**Date:** 2026-04-18
**Branch:** `dossier-a-poc` (off `dossier-skill-pitch` @ 8bec6a6)
**Status:** Learning reference — not a merge candidate
**Pitch under assessment:** `docs/pitches/2026-04-18-dossier-skill-evolution.md`

The companion implementation of Pitch A exists on this branch. The assessment below is the **real deliverable** of the POC — the implementation is scaffold for the evaluation.

---

## 1. What landed

Diff against `origin/dossier-skill-pitch`:

- **Modified (4 files, +145 / −20):** `skills/dossier/SKILL.md` (99 → 156 lines), `skills/dossier/README.md` (63 → 82), `skills/dossier/templates/dossier.md` (151 → 187), `.claude-plugin/plugin.json` (+`hooks` block).
- **Created (11 files, ~860 lines):** 6 shell scripts in `.claude-plugin/hooks/` (citation-audit, forbidden-words, section-order, ballot-filename, dated-claim-scan, hook-dispatcher), 2 references (`framing-modes.md` 122, `audit-checks.md` 91), 1 template (`ballot-per-reviewer.md` 116), 1 changeset file, this assessment.
- **Gates shipped:** 4 blocking in principle (citation / forbidden-words / section-order / ballot-filename); 1 listing-only (dated-claim-scan). Wiring: `plugin.json` → PostToolUse on `Write|Edit` → `dossier-hook-dispatcher.sh` → per-file-type sub-scripts.
- **Verification:** `pnpm test` and `pnpm run validate` pass. Each gate script tested against a seeded bad input and a clean input; all fail and pass as designed. Dispatcher tested with mock `tool_input.file_path` payloads — exits 2 on violation (PostToolUse stderr feedback) and 0 on clean.

Line target met: SKILL.md 156 ≈ pitch's ~160; inside the 75–197 house-style range. Total footprint: ~1195 lines including hooks and references.

---

## 2. Failure-mode scorecard

Against the pitch's 11 observed failure modes.

| # | Failure mode | Status | Evidence (file:line) | Justification |
|---|-----|-----|-----|-----|
| 1 | Framing mismatch | **PARTIAL** (gate on consequences, rule on declaration) | `skills/dossier/SKILL.md:24-32` (FRAME phase); `.claude-plugin/hooks/dossier-forbidden-words.sh:31-48` (mode resolution) | Declaration itself is a rule: if the agent skips §0, no `framing-mode:` exists and the forbidden-words gate silently exits 0. The *consequences* of mis-declaration are gated (wrong-mode vocabulary). The declaration step is not. |
| 2 | Dated claims drifted | **PARTIAL** (as the pitch promised) | `skills/dossier/SKILL.md:50-51`; `.claude-plugin/hooks/dossier-dated-claim-scan.sh` | Script lists dates but does not verify. Exit 0 always. Matches the pitch's "rule + partial gate" positioning exactly. |
| 3 | Citation integrity | **SOLVED (alerting gate)** | `.claude-plugin/hooks/dossier-citation-audit.sh:1-48`; `.claude-plugin/plugin.json:21-32` | Script correctly detects orphan `[Xn]` refs. Wired as PostToolUse — fires *after* the file is written. Exit 2 sends stderr to Claude but the bad file is already on disk. Blocking would require PreToolUse with content inspection (not shipped). |
| 4 | Commercial framing leak | **SOLVED (alerting gate)** | `.claude-plugin/hooks/dossier-forbidden-words.sh:1-98`; `skills/dossier/references/framing-modes.md:21-33` | Same architecture as #3 — detects and reports, does not block. OSS wordlist from the pitch is in place, meta-denial handled via `<!-- allow-forbidden -->` line marker. |
| 5 | Anti-options | **SOLVED (rule)** | `skills/dossier/SKILL.md:90`; `skills/dossier/templates/ballot-per-reviewer.md:19-22` | Rule in SKILL.md body, rule in ballot template header comment, rule in Common Mistakes table. No grep-for-phrase gate shipped; the pitch said a gate could exist — I did not build it. |
| 6 | DEC-008 time-horizon mixing | **SOLVED (rule)** | `skills/dossier/SKILL.md:91`; `skills/dossier/templates/ballot-per-reviewer.md:24-25` | Rule expressed. Pitch: "No. Semantic, can't be machine-checked." Matches. |
| 7 | Ballot format iteration | **SOLVED (gate + template)** | `skills/dossier/templates/ballot-per-reviewer.md` (116 lines); `.claude-plugin/hooks/dossier-ballot-filename.sh` (exit 1 on single-file `DOSSIER-*-BALLOT.md`) | Strongest result in the batch. Per-reviewer template exists and the filename gate fires on the single-file format. A dossier produced under the new skill will not drift here unless the agent actively ignores both the template and the gate's stderr. |
| 8 | Reconciliation placement | **SOLVED (rule)** | `skills/dossier/SKILL.md:93`; `skills/dossier/templates/ballot-per-reviewer.md:27-28` | Convention spelled out in prose in both places. Pitch: "Rule in the ballot skill's documentation." Matches. |
| 9 | Cover-block archaeology | **PARTIAL** (rule only; gate not shipped) | `skills/dossier/templates/ballot-per-reviewer.md:9-12` | Template explicitly forbids a "ballot updated" paragraph in its header comment. No grep gate for `updated [0-9]{4}-[0-9]{2}-[0-9]{2}` or `changes since`. Pitch called this partial-gate-capable; I shipped rule only. |
| 10 | Delegate worked well given brief | **N/A** | — | Not a failure. The implication ("any evolution must preserve delegate-friendliness") is a check on the evolution, not a row to score. See §6 below. |
| 11 | Glossary at back | **SOLVED (gate + preservation comment)** | `.claude-plugin/hooks/dossier-section-order.sh`; `skills/dossier/templates/dossier.md:5-15` | Script fails when Glossary appears after Executive/Management Summary, and when Sources is not the last H2. Template has a prominent comment block at the top documenting the read-support/trust-support asymmetry. The clearest win in the POC — hard to violate by accident. |

### Scorecard roll-up

- SOLVED (gate): 3 (#3, #4, #7-filename, #11) — caveat: alerting, not blocking, for #3 and #4.
- SOLVED (rule): 4 (#5, #6, #7-template, #8)
- PARTIAL: 3 (#1, #2, #9)
- UNADDRESSED: 0
- N/A: 1 (#10)

The pitch claimed Path A addresses #1, #2, #3, #4, #5, #9; partial on #6; under-serves #7 and #8. **Ground truth differs**: the per-reviewer template made #7 fully solved, #6/#8 are rule-addressed, but #9 regressed from "partial-gate-capable" to "rule only" because I did not ship the cover-block grep. Net: **more solved than pitched for ballot-scoped items (#6, #7, #8); weaker than pitched for #9**.

---

## 3. What's weaker than the pitch claimed

The pitch said "gates" repeatedly. The implementation has **five distinct rigor levels** masquerading under that single label. Being explicit:

### 3.1 Gates-that-are-really-alerts

**Claude Code hook architecture bites.** PostToolUse fires *after* the file is written. Exit 2 feeds stderr back to Claude but the file is on disk. A motivated agent can write `DOSSIER-X.md`, see the error, and proceed anyway — or fix-by-rewriting, which fires the hook again in a feedback loop.

For a truly blocking gate we would need **PreToolUse** hooks that:

- Inspect `.tool_input.content` for Write events
- Reconstruct the post-edit state for Edit events (apply the diff)
- Parse the proposed content, run the check, return `permissionDecision: "deny"` on violation

That's roughly 3× the implementation complexity and requires per-check input-parsing logic. The pitch did not anticipate this distinction. I took the ergonomic path (PostToolUse alerting) and called it a gate. It isn't, strictly.

**Affected failure modes.** #3 (citation integrity) and #4 (forbidden words) are marked SOLVED (gate) but are alerting-only. #7 (ballot filename) is likewise alerting — Claude can write `DOSSIER-X-BALLOT.md` and the file will exist after the stderr message arrives.

### 3.2 Declaration-vs-consequence split

The framing-mode gate only gates the *consequences* of a wrong declaration. A missing declaration itself causes the gate to silently exit 0. A deliberate or accidental "no framing-mode frontmatter" bypasses all of #4's vocabulary enforcement.

**Fix (not shipped).** Add a sixth check: `dossier-framing-declared.sh` that fails on `DOSSIER-*.md` (non-template, non-ballot) without a `framing-mode:` frontmatter field. One-liner. I chose not to add it during this POC and am flagging it here instead of quietly doing so — this is the kind of silent-skip the pitch meant to prevent.

### 3.3 Wordlist duplication

The OSS/commercial/hiring/vendor/personal vocabulary lives in **two files** with no single source of truth:

- `skills/dossier/references/framing-modes.md` (documentation for agents)
- `.claude-plugin/hooks/dossier-forbidden-words.sh` (runtime for the gate)

Drift is inevitable. A cleaner design: one wordlist file (e.g. `skills/dossier/references/framing-modes.yaml`), consumed by the script via `yq` and rendered into the markdown by a small generator. Did not ship. Noted in README known-gaps.

### 3.4 Shipped-rules that the pitch promised as partial-gate

- **#9 Cover-block archaeology.** Pitch: "Partial. A hook could flag ballot cover blocks containing `updated YYYY-MM-DD`, `changes since`, `previous version`." I shipped rule only. A ~15-line grep hook would have closed this. Decision-time pressure (end of session looming) — not a principled choice.
- **#5 Anti-options.** Pitch: "A hook can grep for ballot options containing `not recommended`, `for completeness`..." Rule only shipped. Same situation.

### 3.5 Fragile paths in SKILL.md

The skill instructs agents to run:

```
bash ${CLAUDE_SKILL_DIR}/../../.claude-plugin/hooks/dossier-citation-audit.sh <dossier.md>
```

This assumes the skill directory is `<repo>/skills/dossier/` with `.claude-plugin/hooks/` two levels up. When `postinstall` copies the skill to `~/.claude/skills/dossier/`, the hooks are no longer `../../.claude-plugin/hooks/` away — they live with the original plugin under `~/.claude/plugins/`. The command in SKILL.md will fail in a globally-installed skill context.

**The hook WIRING works** (`${CLAUDE_PLUGIN_ROOT}/.claude-plugin/hooks/...` in `plugin.json` resolves correctly) so the automatic firing is fine. It's the **manual invocation** in SKILL.md that is broken for globally-installed users. I did not notice this until writing this assessment. A skill-local wrapper (`skills/dossier/scripts/audit.sh` that calls the real hook via the correct env var) would fix it; not shipped.

### 3.6 Template placeholder almost broke the hook

First iteration of `dossier-forbidden-words.sh` exited 2 "unknown mode" on the template's `{oss | commercial | hiring | vendor | personal}` placeholder. Had to patch the mode-resolver to treat `{` and `|` as "no mode declared → skip". Future extensions will rediscover this. The placeholder-as-sentinel pattern should be documented alongside the wordlists.

---

## 4. What's stronger than the pitch claimed

Three genuine wins beyond the pitch:

### 4.1 Dispatcher pattern

`dossier-hook-dispatcher.sh` parses the PostToolUse JSON, filters to `DOSSIER-*.md` paths, skips template files, and routes to the right per-file-type check (ballot files get only the filename check; dossier files get the other three). Single hook entry in `plugin.json`, extensible for new checks. The pitch treated hooks as "optional Phase 1 scope" — shipping the wiring surfaced the PostToolUse alerting-not-blocking gap, which is itself a useful discovery.

### 4.2 Conventions embedded in the template

The ballot-per-reviewer template's header HTML comment spells out — with rationale — the per-reviewer-file rule, no-archaeology rule, recommended-but-not-pre-ticked rule, time-horizon rule, anti-option rule, and reconciliation-in-sessionlog rule. A user working only from the template (not reading SKILL.md) still sees every convention. The pitch described the template as a structure; it actually landed as a convention carrier.

### 4.3 Dated-claim scan covers more patterns than sketched

Pitch sketched ISO dates and "closes X Month YYYY". I added "Month DD, YYYY" and "released/launched/shipped/published in YYYY" (case-insensitive, after the first pass missed "Released in 2022" — bug fixed). Broader coverage at no complexity cost.

---

## 5. Recommendation for Path B (Session 2)

Two things Session 2 should do differently given what A taught:

### 5.1 Decide the hook rigor level up front

Path A's alerting-not-blocking ambiguity will recur in Path B if the `ballot` skill ships with hooks under the same architecture. Decide before writing code:

- **Option (a)**: Keep PostToolUse alerting (matches A, simpler, not true gate).
- **Option (b)**: Invest in PreToolUse content-inspection hooks for the load-bearing checks (citation integrity, forbidden words, filename). Non-trivial implementation but earns "gate" label honestly.
- **Option (c)**: Accept that "gate" in this repo means "alerting" and adjust docs. Cheapest.

I recommend (c) — honest — with (b) reserved for the single most important check (filename enforcement on new ballots — easy to implement as PreToolUse because filename is in `tool_input.file_path` before write).

### 5.2 Reconsider the ballot-skill split scope

The pitch described Path B as "extract `skills/ballot/`" with its own `SKILL.md`, README, template, and conventions reference. After building A:

- The **template** (`templates/ballot-per-reviewer.md`) is done. Moving it wholesale to a `skills/ballot/templates/` requires no rewriting.
- The **conventions** (anti-options, time-horizon, reconciliation, cover-block, pre-ticked) are fully captured in the template's header comment and in `SKILL.md` text. Moving them to `skills/ballot/references/ballot-conventions.md` is mostly cut-and-paste.
- The **gates** (filename check, and unshipped-but-easy anti-option and cover-block greps) belong with the ballot skill.

So a lighter Path B is plausible: a ~100-line `skills/ballot/SKILL.md` that references the template and two small additional hooks. This is less than the ~140 lines the pitch estimated, and less work than the 3–4 days sketched.

**Inherited weakness to fix in Path B.** The wordlist-duplication issue (§3.3) will reappear if `ballot` introduces any mode-specific vocabulary (e.g. hiring mode forbidding salary specifics — which Path A already has). Fix the single-source-of-truth pattern in Path B so both skills adopt it.

### 5.3 Add the two gates Path A skipped

Path B's natural home: add `.claude-plugin/hooks/dossier-anti-option.sh` (grep `not recommended\|for completeness\|maintenance trap\|obviously wrong` inside ballot files) and `dossier-cover-archaeology.sh` (grep `updated [0-9]{4}-[0-9]{2}-[0-9]{2}\|changes since\|previous version` inside ballot cover block). Together: ~30 lines of bash. Closes the #5 and #9 PARTIAL/rule-only gaps.

### 5.4 Answer the declaration-gate question

Add `dossier-framing-declared.sh` in Path B — or accept that framing-declaration is a rule-not-gate and stop calling it a gate. Either is defensible. Silently-skipping-on-missing-declaration is not.

---

## 6. Delegate-friendliness check

Re-reading `skills/dossier/SKILL.md` as a delegate without pitch or a11y-session context. Concrete ambiguities:

1. **Line 24 "Decision model. Who decides, by when, and how."** "How" is vague. Is it the voting method (majority / consensus / single-decider)? A template with examples per row would help.
2. **Line 28 "frontmatter `framing-mode:` field"** vs **line 32 "Emit these as the first three lines of the dossier proper"**. The template has `framing-mode:` in YAML frontmatter AND would need the three prose lines after the title. Duplication, unclear whether one or both are required.
3. **Line 60-61 manual invocation command uses `${CLAUDE_SKILL_DIR}/../../.claude-plugin/hooks/`.** A delegate who ran `echo $CLAUDE_SKILL_DIR` in a fresh shell gets empty. The command is agent-context only. Not stated.
4. **§0 FRAME "Audience"**. Form unspecified. Prose line? Frontmatter field? Bullet in a box? Delegate will guess.
5. **Ballot "Must-tier blocks delivery"**. By what mechanism? No gate shipped. It's a rule.
6. **Citation gate passes silently on dossiers with no `[Xn]` refs at all**. A dossier relying only on inline `[Text](url)` hyperlinks — entirely legitimate — is unaudited. Nothing warns the user that the audit is a no-op for their dossier.

Six concrete delegate ambiguities in a 156-line skill. Tolerable but not polished. A round of delegate-testing on a new dossier would catch each.

---

## 7. Decision-maker reading time

Rough estimates for a first-pass read:

| Artefact | Lines | Scan (min) | Read (min) |
|---|---|---|---|
| `skills/dossier/SKILL.md` | 156 | 4 | 10 |
| `references/framing-modes.md` | 122 | 3 | 6 |
| `references/audit-checks.md` | 91 | 2 | 4 |
| `templates/dossier.md` | 187 (with comments) | 3 | 6 |
| `templates/ballot-per-reviewer.md` | 116 | 2 | 4 |
| **Total** | 672 | **14** | **30** |

**Scan time: ~14 min. Read time: ~30 min.** Target was <10 min. **Miss.**

Trimming levers:
- SKILL.md Common Mistakes table has 15 rows; ~6 of those duplicate prose elsewhere in SKILL.md. Cut to ~9 rows: save ~15 lines.
- `references/framing-modes.md` has both wordlist and example framings per mode. Examples can move to the pitch or a tutorial; references should be reference. Save ~30 lines.
- `templates/dossier.md` comment block explaining the section-order rule is ~14 lines. Can become 4 lines with a pointer. Save ~10 lines.

Post-trim estimate: ~10 min scan, ~22 min read. Closer to target, still not under 10 min careful read.

Realistic claim: **under 10 min for a second read after first exposure; ~30 min for first full engagement**. The pitch's "delegate-friendly, not dialogue" goal is met (no interactive steps), but the total bulk has grown.

---

## 8. Net verdict

Pitch A's five-failure-mode promise (#1, #2, #3, #4, #9) is **met for #1 and #2 partially, #3 and #4 as alerting-gates, #9 as rule-only** — one mode weaker than pitched. Path A's bonus coverage of #6, #7, #8 via the per-reviewer template is real and **better than pitched**. The net fails to cleanly justify the pitch's repeated use of "gate-capable YES" for items that landed as alerting-only in Claude Code's architecture.

For Session 2: Path B is worth doing, but **scope it smaller** than the pitch sketched (~1–2 days not 3–4), **reuse the template** from Path A, **add the two skipped gates** (anti-option, cover archaeology), and **resolve the alerting-vs-blocking question up front**. The `ballot` skill gets maybe 50% of the value from a 30% footprint relative to the pitch's estimate.

A worse POC would have shipped only the easy gates and called it done. This one shipped the wiring too, and the wiring is what revealed the PostToolUse architecture constraint — the single most useful finding of the session. That finding reshapes Path B's scope. That is exactly what the POC was meant to produce.
