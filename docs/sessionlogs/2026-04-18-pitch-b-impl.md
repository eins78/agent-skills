# Sessionlog — Pitch B implementation (ballot skill extraction)

**Date:** 2026-04-18
**Branch:** `worktree-dossier-b-impl` off `origin/dossier-skill-pitch`
**Scope:** PR #43 — add Path B on top of existing pitch + A + assessment
**Mode:** Autonomous implementation after plan approval

## Summary

Extracted `ballot` as a standalone skill, moved the per-reviewer ballot template, added two ballot audit hooks (anti-option, cover-archaeology), added `dossier-framing-declared` gate, consolidated forbidden-word lists into `framing-modes.yaml` consumed via `yq`, and fixed the six delegate ambiguities identified in the Pitch A assessment §6. 7 logical commits; validation passes; all hooks tested with seeded-bad and seeded-clean inputs.

## Decisions made

| # | Decision | Rationale |
|---|---|---|
| D1 | Skill name = `ballot` | Matches Quatico sales-hub precedent; short; Max already uses it. |
| D2 | Rename `dossier-ballot-filename.sh` → `ballot-filename.sh` | Ballot is standalone; dossier-prefix was misleading. Honest naming. |
| D3 | Keep single dispatcher, route by filename pattern | Existing `dossier-hook-dispatcher.sh` already branches on `*BALLOT*`; extending was one-line change vs. a separate dispatcher. No `plugin.json` wiring change needed. |
| D4 | Wordlist SSOT via YAML + `yq` | Two-location duplication (assessment §3.3) was inevitable drift. `yq v4` is on the house toolchain (homebrew). |
| D5 | Ship `dossier-framing-declared.sh` | One-liner bash; closes §3.2 declaration-vs-consequence split. |
| D6 | Drop manual-invocation commands from SKILL.md | Fixes §3.5 fragile paths. PostToolUse auto-fire covers the audit; docs now point to §Gates section only. |
| D7 | Citation no-op → stderr warning, exit 0 | Soft signal; cheapest disambiguation of assessment §6 ambiguity #6. |
| D8 | Must-tier "blocks delivery" → prose rule, not gate | Parsing ballot state (final vs. draft) to detect unticked Musts is too fragile; requires reconstructing reviewer intent. Deferred; flag in sessionlog if blocked. |
| D9 | Use cases inline in ballot SKILL.md | 5 scenarios × 2-3 lines each = 14 lines. Fits under 130-line target. |
| D10 | Template-placeholder handling documented in `framing-modes.md` | Wordlist-adjacent; lowest-cost home. Also added an explicit callout in `skills/ballot/references/ballot-conventions.md` §Template placeholder handling. |
| D11 | 6 logical commits (+ 1 for sessionlog) — no squash | Max's recommendation; easier to review piecewise. Commits: rename → extract → hooks → YAML SSOT → trim+fix → plumbing → sessionlog. |
| D12 | Push worktree branch → FF-merge into `dossier-skill-pitch` → push | Brief's git strategy; PR #43 picks up automatically; no new PR, no merge to main. |
| D13 | Drop "three prose lines" frontmatter duplication | One source of truth. Prose lines (decision model, audience) live in the Key Facts box where readers already look; frontmatter serves the gate only. |
| D14 | "Audience" as prose line in Key Facts, not frontmatter field | Aligns with reader-facing purpose; not a machine-readable field. Template has an Audience row added to the Key Facts table. |
| D15 | Initial ballot version `1.0.0` set directly; omit ballot from changeset `bumps:` block | Per memory note — `bump-skill-versions.sh` cannot produce an exact base version from nothing. |

## Deviations from the plan

- **framing-modes.md trim** — plan estimated ~30 lines saved; actual ~17 lines (122 → 105). Kept per-mode `When to use` + `Typical section emphasis` + one example framing per mode as human-readable documentation. Dropping more would have made the file a thin pointer to the YAML; current balance is better.
- **SKILL.md line count** — plan target was ~120 lines; dossier SKILL.md lands at 139 lines. The difference is in the Gates table and Common Mistakes table — both grew slightly when fixing ambiguities (new rows for framing-declared, citation no-op). Trade-off felt right.
- **No standalone `references/use-cases.md`** — plan left this optional. Use cases are 5 × 2-3 lines; inlined in SKILL.md under a `## Use Cases` section.

## Hook test matrix

All tests run against `/tmp/hook-test/DOSSIER-*.md` seed files with the dispatcher receiving a JSON payload via stdin:

```bash
echo '{"tool_input":{"file_path":"/tmp/hook-test/DOSSIER-X.md"}}' | bash .claude-plugin/hooks/dossier-hook-dispatcher.sh
```

| Hook | Seeded-bad input | Bad exit | Seeded-clean input | Clean exit |
|---|---|:-:|---|:-:|
| `ballot-filename.sh` | `DOSSIER-Test-BALLOT.md` (no reviewer) | 1 | `DOSSIER-Test-BALLOT-Max.md` | 0 |
| `ballot-anti-option.sh` | `- [ ] Option B (not recommended)` in a DEC, no `<!-- justify -->` | 1 | Same row with `<!-- justify: ... -->` 3 lines later | 0 |
| `ballot-cover-archaeology.sh` | `**Updated:** 2026-04-18 — added DEC-005` in cover | 1 | Clean reviewer/role/peer/dossier cover block | 0 |
| `dossier-framing-declared.sh` | `DOSSIER-X.md` with no `framing-mode:` frontmatter | 1 | `framing-mode: oss` in frontmatter | 0 |
| `dossier-forbidden-words.sh` (YAML-backed) | `framing-mode: oss` + "revenue" in body | 1 | `framing-mode: oss`, community-themed body | 0 |
| `dossier-forbidden-words.sh` (placeholder) | `framing-mode: {oss \| commercial \| ...}` (template) | 0 (skipped) | — | — |
| `dossier-forbidden-words.sh` (unknown mode) | `framing-mode: bogus` | 2 | — | — |
| `dossier-citation-audit.sh` (no refs) | dossier with zero `[Xn]` refs | 0 + warning | dossier with matched `[X1]` + §Sources `[X1]` def | 0 silent |

Dispatcher end-to-end (5 paths): all routed correctly, aggregate exit 2 when any sub-check fails, exit 0 when all pass.

Regex bugs caught in testing and fixed in-session:
- `ballot-anti-option.sh` initial pattern used BRE alternation (`\|`) inside an ERE grep (`-E`). Fixed to ERE syntax (`|`). Seeded-bad then correctly exit 1.
- `ballot-cover-archaeology.sh` `updated [0-9]{4}...` required a literal space before the date; failed to match `**Updated:** 2026-04-18`. Widened to `updated[^a-z]*[0-9]{4}...` — matches the colon + whitespace between `updated` and the date.

## What didn't ship and why

- **PreToolUse rigor upgrade** — documented as future work in both `skills/ballot/SKILL.md` §Gates and `skills/ballot/references/ballot-conventions.md` §Gate rigor levels. Cost ~3× the PostToolUse implementation plus per-tool content parsing. Cheapest candidate: `ballot-filename.sh` since filename is in `tool_input.file_path` before write.
- **Must-tier blocker hook** — too fragile. Detecting "final-status ballot with unticked Must" would require parsing reviewer delivery intent. Kept as prose rule with "flag in sessionlog if blocked" consequence.
- **`dossier` → `research-dossier` rename** — pitch Q3 recommendation stood (keep). Not in B's scope.
- **Path C** (three-way research split) — both pitch and assessment §5 said defer.
- **Per-use-case ballot templates** (hiring, vendor, ADR variants) — noted in `skills/ballot/README.md` §Planned Improvements. Current use cases are in SKILL.md as text sketches, which is sufficient for the a11y-session audience.

## Files touched

**New (9):**
- `skills/ballot/SKILL.md` (107 lines)
- `skills/ballot/README.md` (76 lines)
- `skills/ballot/references/ballot-conventions.md` (118 lines)
- `skills/ballot/templates/ballot-per-reviewer.md` (moved from dossier; header trimmed from 26 to 6 lines)
- `.claude-plugin/hooks/ballot-anti-option.sh` (57 lines)
- `.claude-plugin/hooks/ballot-cover-archaeology.sh` (62 lines)
- `.claude-plugin/hooks/dossier-framing-declared.sh` (53 lines)
- `skills/dossier/references/framing-modes.yaml` (62 lines)
- `.changeset/20260418-pitch-b-ballot-extraction.md` (23 lines)
- `docs/sessionlogs/2026-04-18-pitch-b-impl.md` (this file)

**Modified (9):**
- `skills/dossier/SKILL.md` (156 → 139 lines; ballot section removed, decision-model split to 3 axes, manual-invocation dropped, gates table updated)
- `skills/dossier/README.md` (92 lines; Path B refactor note, updated known-gaps, updated testing scenarios)
- `skills/dossier/templates/dossier.md` (180 lines; section-order comment trimmed 14→4, Audience row added to Key Facts)
- `skills/dossier/references/framing-modes.md` (122 → 105 lines; wordlists → pointers to YAML, template-placeholder section added)
- `skills/dossier/references/audit-checks.md` (74 lines; rewritten to reflect renamed hooks + YAML wordlist + alerting level)
- `.claude-plugin/hooks/dossier-hook-dispatcher.sh` (74 lines; added framing-declared + 2 ballot hooks to routing)
- `.claude-plugin/hooks/dossier-forbidden-words.sh` (102 lines; bash arrays → yq-backed lookup)
- `.claude-plugin/hooks/dossier-citation-audit.sh` (54 lines; stderr warning on zero-`[Xn]` case)
- `.claude-plugin/marketplace.json` (+10 lines; ballot entry)
- `README.md` (+1 line; ballot row in skills table)

**Renamed (1):**
- `.claude-plugin/hooks/dossier-ballot-filename.sh` → `.claude-plugin/hooks/ballot-filename.sh`

## Reading-time estimate for Max

Assessment §7 measured Path A at ~14 min scan / ~30 min careful read across 5 artefacts.

Post-B estimate (both skills combined):

| Artefact | Lines | Scan (min) | Careful read (min) |
|---|---|---|---|
| `skills/dossier/SKILL.md` | 139 | 3 | 8 |
| `skills/ballot/SKILL.md` | 107 | 3 | 7 |
| `skills/ballot/README.md` | 76 | 1 | 3 |
| `skills/dossier/README.md` | 92 | 2 | 4 |
| `skills/ballot/references/ballot-conventions.md` | 118 | 2 | 6 |
| `skills/dossier/references/framing-modes.md` | 105 | 2 | 5 |
| `skills/dossier/references/audit-checks.md` | 74 | 2 | 4 |
| **Total** | 711 | **15** | **37** |

Total raw line count rose (672 → 711), but coverage is now split across two coherent skills instead of one oversized one. Scan-time target <10 min is still missed, but the skills are now decomposed — a reader touching only ballot skips the dossier artefacts, and vice versa.

**Recommended reading path for Max (targets ~15 min):**
1. `docs/pitches/2026-04-18-pitch-A-assessment.md` §§3, 5, 6, 8 (already read in Session 1 — skim) — 3 min
2. `skills/ballot/SKILL.md` — 7 min
3. `skills/dossier/SKILL.md` (the delta from Path A) — 5 min
4. This sessionlog §Decisions + §Hook tests — 3 min

Total: ~18 min. The 37-min figure above is exhaustive reading; 18 min is "enough to approve".

## Zero-ambiguity re-read (delegate perspective)

After commit 5, re-read both SKILL.md files cold. Findings:

**`skills/ballot/SKILL.md`**: zero blocking ambiguities. Minor observations logged but none require a fix:
- `${CLAUDE_SKILL_DIR}/templates/...` env var is agent-context only; empty in a fresh shell. This is a read-reference pattern consistent with sibling skills (lab-notes, tracer-bullets). Acceptable.
- Hiring use case mentions "companion dossier" but a standalone hiring ballot may not have one. The §Standalone vs. Dossier-invoked section handles this explicitly. Acceptable.

**`skills/dossier/SKILL.md`**: zero blocking ambiguities. All six assessment-identified ambiguities closed:
1. Decision-model axes split into who/when/how with inline examples per axis.
2. Frontmatter `framing-mode:` is the single declaration; prose-line requirement removed.
3. Manual-invocation commands dropped; SKILL.md explains PostToolUse auto-fire.
4. Audience explicitly a prose line in Key Facts box; template has the row.
5. Must-tier softened to prose rule with sessionlog-flag-if-blocked consequence; no gate shipped (fragility rationale documented in ballot-conventions.md).
6. Citation no-op warning in `dossier-citation-audit.sh`; Common Mistakes table has a row.

## PR #43 update — next action

After this commit, I will:
1. Push `worktree-dossier-b-impl` to origin (optional staging push).
2. Fast-forward merge into local `dossier-skill-pitch`; push that branch.
3. `gh pr edit 43 --body-file /tmp/pr43-body.md` with the TL;DR / What shipped / What to review / Out of scope / Read time structure.

PR #43 then contains the full narrative: pitch → Pitch A POC → assessment → Pitch B implementation.

---

## Post-review Polish (2026-04-18, same-day follow-up)

Max reviewed the merged branch and surfaced two concerns. This follow-up session addresses both on top of the Pitch B work.

### Concerns

1. **Most audit scripts are overfit** to the a11y-extension session. Each grep gate encodes assumptions that won't hold for dossiers in other styles (`[Xn]` citation format, OSS-mode forbidden words, H2-level glossary heading, specific archaeology phrases). The Pitch-A assessment §§3.1 and 3.3 already flagged these as alerting-level-not-gates and wordlist-duplication-prone.
2. **Ballot skill framing is wrong.** Currently framed around reviewer count ("two or more reviewers; single decider doesn't need a ballot"). The real axis is **async decision-making** — any time decider(s) aren't all in the agent session. Canonical cases: review a dossier over chat, review a PR on the train, hand off to remote collaborators. Single-decider async is still ballot-worthy; reviewer count is incidental.

### Decisions made (post-review)

| # | Decision | Rationale |
|---|---|---|
| P1 | Ballot reframed as async-decision instrument, not multi-reviewer instrument | Max's review: the real axis is async (decider(s) outside the session), not reviewer count. Single async decider still benefits from empty checkboxes, tiered Must/Should/Could, filename-survives-listing, 12-hour-later readability. |
| P2 | Delete 6 overfit hooks: citation-audit, forbidden-words, section-order, dated-claim-scan, ballot-anti-option, ballot-cover-archaeology | Each encoded a specific pattern from the a11y session. Dossiers in other styles (hiring, architecture, vendor) use different conventions. Pattern lists don't generalize; judgement-capable reviewers do. |
| P3 | Keep 2 hooks: `ballot-filename.sh`, `dossier-framing-declared.sh` | Mechanical checks — filename shape and YAML field presence are genuinely pattern-reliable across all dossier styles. |
| P4 | Keep `dossier-hook-dispatcher.sh` (simplified) rather than inline into plugin.json | The kept scripts take argv for CLI-testability; Claude Code pipes JSON on stdin. The dispatcher exists purely as an argv/stdin shim. Rewriting the scripts to accept both would have violated "do NOT touch the 2 kept scripts" from the brief. |
| P5 | Delete `framing-modes.yaml` (orphaned once `forbidden-words.sh` deleted) | No remaining script consumes it. `dossier-framing-declared.sh` only checks for `framing-mode:` field presence, not values. Vocabulary guidance folded into `framing-modes.md` (prose, with examples). |
| P6 | Delete `audit-checks.md` (80% documented deleted scripts) | The 2 kept hooks are self-documenting in one line each in their respective SKILL.md §Gates sections. The review-checklists become the canonical "what quality looks like" doc. |
| P7 | Two reviewer-checklists as the grep-gate replacement | Each item has what-to-check / why / good / red-flags structure. Generalizes the concerns (framing coherence, citation integrity, dated-claim freshness, cover archaeology, etc.) without hard-coding the patterns. Dossier checklist: 8 items, ~180 lines. Ballot checklist: 8 items, ~150 lines. |
| P8 | Changeset: `minor` bump for both ballot and dossier | Ballot reframe is user-visible semantic expansion (single async decider now first-class). Dossier gains review-checklist as new review mechanism. No breaking changes. |
| P9 | Append to this sessionlog rather than split | This sessionlog was 150 lines; appending a ~60-line Post-review section keeps the narrative coherent at ~210 lines. |

### Files touched (post-review)

**Created (3):**
- `skills/dossier/references/review-checklist.md` (~180 lines, 8 items)
- `skills/ballot/references/review-checklist.md` (~150 lines, 8 items)
- `.changeset/20260418-130906-polish-pass.md`

**Deleted (8):**
- `.claude-plugin/hooks/dossier-citation-audit.sh`
- `.claude-plugin/hooks/dossier-forbidden-words.sh`
- `.claude-plugin/hooks/dossier-section-order.sh`
- `.claude-plugin/hooks/dossier-dated-claim-scan.sh`
- `.claude-plugin/hooks/ballot-anti-option.sh`
- `.claude-plugin/hooks/ballot-cover-archaeology.sh`
- `skills/dossier/references/framing-modes.yaml`
- `skills/dossier/references/audit-checks.md`

**Modified (10):**
- `skills/ballot/SKILL.md` (frontmatter, When-to-Use, When-NOT-to-Use, workflow, conventions, gates → "Reviewing a ballot", use cases)
- `skills/ballot/README.md` (purpose intro, file structure, testing scenarios, known gaps)
- `skills/ballot/references/ballot-conventions.md` (intro, "one file per decider", "clean cover block", "no anti-options", tier-rule, gate-rigor, template-placeholder)
- `skills/ballot/templates/ballot-per-reviewer.md` (optional peer ballot line, "reviewers disagree" → "reviewers disagree or single async decider flags dissent", delivery checklist comment)
- `skills/dossier/SKILL.md` (FRAME mode pointer, GATHER dated-claim, DELIVER, Gates table, Common Mistakes table, ballot cross-ref, output convention)
- `skills/dossier/README.md` (added Post-review polish paragraph, file structure, testing, known gaps)
- `skills/dossier/references/framing-modes.md` (intro re-framed; each mode gets inline vocabulary examples replacing the YAML pointer)
- `skills/dossier/templates/dossier.md` (section-order comment now points to review-checklist)
- `.claude-plugin/marketplace.json` (ballot entry description)
- `.claude-plugin/hooks/dossier-hook-dispatcher.sh` (simplified: removed routing logic; each kept script self-gates)
- `README.md` (root skills table ballot row)

### Hook test matrix (post-review)

| Script | Input | Expected exit | Got |
|--------|-------|---------------|-----|
| `ballot-filename.sh` | `/tmp/DOSSIER-Test-BALLOT-Max.md` | 0 | 0 ✅ |
| `ballot-filename.sh` | `/tmp/DOSSIER-Test-BALLOT.md` (no reviewer) | 1 | 1 ✅ |
| `ballot-filename.sh` | `/tmp/DOSSIER-Regular.md` (non-ballot path) | 0 | 0 ✅ (self-gating works) |
| `dossier-framing-declared.sh` | `/tmp/DOSSIER-Clean.md` with `framing-mode: oss` | 0 | 0 ✅ |
| `dossier-framing-declared.sh` | `/tmp/DOSSIER-Bad.md` with no frontmatter | 1 | 1 ✅ |
| `dossier-framing-declared.sh` | `/tmp/DOSSIER-Test-BALLOT-Max.md` (ballot path) | 0 | 0 ✅ (self-gating works) |

Both scripts self-gate on filename pattern, which is why the simplified dispatcher can call them unconditionally.

### Validation

- `pnpm test` → passes; both skills list with new descriptions.
- `pnpm run validate` → "All skills valid (0 warning(s))".
- `grep -r <deleted-refs> skills/ .claude-plugin/ README.md` → only intentional historical references in review-checklist.md and ballot-conventions.md (describing why the hooks were deleted).

### Git strategy

Same as Pitch B:
1. Commit in logical chunks on `worktree-dossier-polish`.
2. Fast-forward-merge into `dossier-skill-pitch`.
3. Push to origin.
4. Append `## Post-review adjustments` section to PR #43 body via `gh pr edit 43 --body-file`.
5. Do NOT open a new PR. Do NOT merge to main.

---

## Post-review follow-up: clickable citations (2026-04-18, same-day)

Max surfaced one more concrete bugfix for the same PR before /bye: make `[R1]` / `[G6]` / `[Sn]` style citations clickable via Markdown reference-link syntax, while preserving the bracket tokens readers see in raw markdown.

### Decisions made

| # | Decision | Rationale |
|---|---|---|
| C1 | Default to reference-link syntax (`[S1][ref-S1]` + `[ref-S1]: url`) over footnote syntax (`[^S1]`) | Portability. Reference-links render consistently in GitHub, Obsidian, Bitbucket, Confluence, iOS Markdown Reader, terminal previewers. Footnote rendering is uneven — GitHub does it, Confluence internal renderers often don't, many mobile readers skip them. Brief said "favour portability"; reference-links win. Footnote form documented as an alternative for authors whose target renderer supports it. |
| C2 | Accept plain-bracket rendering (rendered link text shows `S1`, not `[S1]`) over fullwidth unicode brackets or backslash-escaping | Raw markdown keeps `[S1]` bracket tokens for a reviewer viewing the file directly. Rendered link shows `S1` without brackets, which is the standard markdown rendering and what readers expect from link text. Fullwidth `［S1］` is visually heavier and looks foreign in otherwise plain prose. Backslash-escape makes raw markdown noisier (`\[S1\][ref-S1]`). Both alternatives trade raw-file readability or rendered polish for marginal bracket preservation — not worth it. |
| C3 | Backwards-compatible — existing bare `[Xn]` citations remain valid, they just aren't clickable | No retroactive rewrite required. Forward-looking convention. Existing dossiers pass the review-checklist's citation-integrity item as long as each bare `[Xn]` resolves to a §Sources entry (same as before); upgrading to `[Xn][ref-Xn]` adds the clickability. |
| C4 | Category-prefix scheme left to the author's convention (S, G, R, O, W, X...) but must be internally consistent | Different dossier styles organize sources differently (Requirements-anchored vs Gather-buckets vs Sources-only vs Official/Other). Mandating one scheme would over-fit. The review-checklist flags mixed prefixes without a pattern as a red flag. |

### Files touched

- `skills/dossier/SKILL.md` — §4 SYNTHESIZE citation guidance (one bullet).
- `skills/dossier/templates/dossier.md` — §Evaluations inline-cite hint; §Sources fully rewritten to use `[ref-Sn]` labels with reference-link definitions at the bottom.
- `skills/dossier/references/review-checklist.md` — citation-integrity item (#2) rewritten to describe the new pattern, document the footnote alternative + portability rationale, and list concrete red flags for the new syntax.
- `.changeset/20260418-130906-polish-pass.md` — added bullet describing the clickable-citations upgrade; still minor bump for both skills (additive UX improvement; no breakage).
- This sessionlog — appended this section.

### What was NOT changed

- `skills/ballot/templates/ballot-per-reviewer.md` — ballots don't have a §Sources section and don't carry citations; the reference-link pattern doesn't apply.
- `skills/dossier/references/sources-by-domain.md` — already uses inline `[name](url)` links throughout; no `[Xn]`-style citations to upgrade.
- Hook scripts — the kept hooks (`ballot-filename.sh`, `dossier-framing-declared.sh`) are mechanical checks unrelated to citation style.

### Verification

- Mental simulation of a reader opening a dossier produced under the new pattern: body text reads `"Kubernetes 1.29 shipped in January 2026 [S4][ref-S4]"`; `S4` is a clickable link to the release notes; raw markdown still shows the bracket token for file-viewing reviewers. The §Sources entry near the end gives the verbal citation; the `[ref-S4]: https://...` definition right after makes the link work. Click UX matches expectations.
- `pnpm test` + `pnpm run validate` — to be run after the commit before push.
- No regression of the existing citation-integrity concern — every `[Xn]` still needs a §Sources entry; the addition is the `[ref-Xn]` label that makes the link clickable.
