# Dossier Skill — Development Documentation

## Purpose

Structured research workflow producing cited, well-edited reports in two genres — **research** dossiers that map a topic so the reader concludes for themselves, and **decision** dossiers that rank options and recommend one — plus optional decision ballots. Codifies a pattern used 16+ times since January 2026.

**Tier:** Published (beta) — available in the [eins78/agent-skills](https://github.com/eins78/agent-skills) plugin

## Provenance

Extracted from validated research artifacts across multiple domains:
- **Auth solution evaluation:** 7 products, 9 weighted requirements, phased migration plan, categorized sources (official, community, articles, blogs, podcasts, repos)
- **URL shortener research:** 12+ products in tiered format
- **Customer portal research:** /last30days + 40+ WebSearch pages
- **Sprint retrospective synthesis:** 4 detailed sub-reports
- 10+ additional research sessions (Japan travel, Grafana plugins, AI code review, MeteoSwiss, etc.)

**Path A extension (2026-04-18).** Extended per Pitch A in `docs/pitches/2026-04-18-dossier-skill-evolution.md`, with FRAME phase, Key Facts box, four enforcement hooks, per-reviewer ballot template, and framing-mode wordlists. Addresses 11 failure modes observed in the `heading-outline-extension` dossier session (2026-04-17 / 2026-04-18).

**Path B refactor (2026-04-18).** Ballot conventions and template extracted into a standalone `ballot` skill — see `skills/ballot/`. The dossier SKILL now cross-references ballot; the per-reviewer template moved from `skills/dossier/templates/` to `skills/ballot/templates/`. Wordlists consolidated into `references/framing-modes.yaml` (single source of truth, consumed by the gate via yq). Added `dossier-framing-declared` gate (closes the declaration-vs-consequence split) and citation-audit no-op warning. Rationale: `docs/pitches/2026-04-18-pitch-A-assessment.md` §§3, 5, 6.

**Post-review polish (2026-04-18).** Six overfit grep hooks removed (citation-audit, forbidden-words, section-order, dated-claim-scan, ballot-anti-option, ballot-cover-archaeology); two mechanical hooks kept (`dossier-framing-declared`, `ballot-filename`). The removed hooks encoded a11y-session-specific patterns that didn't generalize across dossier styles. Replaced by `references/review-checklist.md` — a reviewer-facing audit doc that generalizes the concerns. `framing-modes.yaml` and `audit-checks.md` were deleted as orphaned; `framing-modes.md` temporarily retained mode-selection guidance (removed in the preflight-gate pass below).

**Source archival (2026-07-26).** Added `scripts/archive-source.sh`, `references/source-archival.md`, review-checklist item 10, and the `sources-index-consistency.sh` gate. Until this pass the skill captured nothing — every citation was a bare URL, and the checklist named "URLs that 404 when spot-checked" as a red flag in two separate items without prescribing any remedy. Tool selection is evidence-based rather than assumed: see `research/2026-07-26-source-archival/`. The headline finding is that `wget` — the obvious first guess — is the wrong tool twice over: its `--quota` provably cannot cap a single-file download (GNU manual: *"quota will never affect downloading a single file"*), and it is not installed on stock macOS, where `curl` is the Apple-shipped binary. The ladder is therefore `monolith` → `curl` (floor) with `pandoc` layered on top, and `wget --mirror` is rejected outright rather than capped, since recursion is the failure mode and depth-0 is what verification needs.

**Preflight gate (2026-04-18).** `dossier-framing-declared.sh` and `framing-modes.md` removed — the framing-mode convention (`oss`/`commercial`/`hiring`/`vendor`/`personal`) was over-specific, same anti-pattern as the six deleted grep hooks. Replaced the `### 0. FRAME` step with a three-check preflight gate (Specific / Unambiguous / Well-understood). Review-checklist item 1 swapped from "framing coherence" to "preflight evidence".

**Research/decision genre split (2026-08-08).** Added Preflight check 4 (genre), `templates/report.md`, a survey mode in EVALUATE, and a genre-conditional Key Facts box. Prompted by a dossier that adjudicated a product pitch when the reader wanted a market survey: the verdict sat at section 2 before any content, and the six `Finding N` headings were phrased as stances, so the document could not be skimmed by topic. The underlying research files were already survey-shaped and correct — the genre error was introduced entirely at the synthesis step, and the compiled document did not link the research files it was built from, so the reader only ever saw the adjudication layer.

Cause was structural, not a drafting slip: the skill described its own output as *"actionable reports with ranked recommendations"*, EVALUATE offered scoring as its only analysis mode, the Key Facts box required who-decides/decision-model/deadline, and `templates/dossier.md` carries exactly one descriptive section (`Current State`) among eight. SCOPE nominally offered *"comparison, evaluation, or investigation"* but nothing downstream read the choice — a decorative parameter.

**This is not a revival of the removed framing-mode gate, and the axis is the giveaway.** Those modes (`oss`/`commercial`/…) classified the *character of the sources*; genre classifies *what document the reader wants*. The two never overlapped, so genre was not lost when that gate died — it was never covered. The mechanism also differs where it matters: `dossier-framing-declared.sh` linted a declared label that changed no output, which is why it was ignorable and correctly removed. Genre instead selects the template and switches EVALUATE and SYNTHESIZE, so it cannot be declared-and-ignored. Deliberately no script — see Known Gaps.

**Insights section (2026-08-08).** Added an optional `## Insights` section to both templates, a SYNTHESIZE bullet, four Common Mistakes rows, and review-checklist item 12. Requested directly: *"dossier should also have a section with interesting insights that are semi related but maybe useful or inspiring, and they can be shortly mentioned (teaser and linked) a few times throughout the dossier where it fits."*

The gap it fills is a structural one, not an oversight by any particular author. A brief acts as a filter, and the material it filters out is not uniformly worthless — a striking parallel, a number that reframes a scale, an adjacent field that solved the same problem differently. That material has nowhere to go, so it gets discarded at the synthesis step every time. Giving it a named home changes the default from *delete* to *collect*.

Two failure modes are called out because they are opposite and both quiet. **Buried findings** — a decision-relevant fact filed under Insights sits below the conclusion where the decider never reaches it, so the dossier contains the information without delivering it. The inversion test catches this: if removing it changes a finding, it is not an insight. **Orphans** — a correctly-filed insight that is never teased from the body lives past the point most readers stop, making the most memorable material in the research the least-read part of the document. Hence the teaser convention, which deliberately reuses the existing `[S1][ref-S1]` citation idiom (`I1`/`[in-I1]`) rather than inventing a second cross-reference syntax.

**REVIEW stage (2026-08-08).** Added a stage between SYNTHESIZE and DELIVER: three fresh-context subagent lenses (`references/review-lenses.md`), a review artifact beside the dossier, and `review-artifact-present.sh` fired PreToolUse on `git commit` via `dossier-commit-gate.sh`. Requested by Max after the defect below: *"sounds like a self-review step (maybe using one or more subagents) would be a good addition to the dossier skill?"*

The trigger was the Insights feature failing its own checklist item within two hours of shipping. The author of item 12 wrote an insight whose closing sentence asserted that a public debate had "largely ignored" a monument — an absence claim that was never researched, in a dossier that grades every other claim. **The Known Limitation this closes had been recorded months earlier, along with this exact fix** ("Checklist discipline depends on the reviewer… Planned: seed a subagent test scenario"). Recording a limitation is not mitigating it.

The diagnosis is the workspace's own gates-over-rules test: DELIVER said "run the reviewer checklist", and *"did I run it?"* was answerable affirmatively without the work. That is a rule. Rules drift.

**The isolation is the mechanism, not the subagents.** A reviewer holding the author's reasoning inherits the author's blind spot — the claim *felt* safe because the author half-remembered the sources. So the three lenses receive deliberately different, deliberately restricted inputs, and the **Insights lens is starved hardest**: giving it `sources/` would let it verify a claim the document never cited and pass something the reader cannot verify. Its blindness is precisely what lets it catch stance.

**Two design corrections found during implementation**, both worth keeping visible because the obvious version of each is wrong. *(1)* The gate is PreToolUse on `git commit`, not PostToolUse on `Write` — Write is alerting-level (the file is already on disk) and also the wrong moment, since a dossier is edited dozens of times during SYNTHESIZE and a review demand on each would be pure noise. *(2)* There is no "review must be newer than the dossier" check: the correct workflow is review → findings → fix, which leaves the dossier newer than the review by construction, so an mtime gate would fire on every properly-executed review and pass only when the author changed nothing.

Legitimacy under the skill's own rule: like the two surviving hooks and unlike the six removed ones, this gate checks a **file-level fact** (does a dispositioned review artifact exist) and never greps document prose. Judgement stays with the reviewers.

## Design Influences

- **[last30days](https://github.com/ScrapCreators/last30days-skill):** Parallel source dispatch + judge synthesis pass. Adapted: per-topic agent design instead of fixed 10+ platform roster.
- **[Claude Code ultraplan](https://code.claude.com/docs/en/claude-code-on-the-web):** Extended autonomous thinking for deep tasks. Adapted: monolithic synthesis pass for complex dossiers.
- **[writing-skills](https://github.com/anthropics/superpowers):** TDD for documentation, CSO (Claude Search Optimization), token efficiency.

## File Structure

```
dossier/
├── SKILL.md                          # Main skill
├── README.md                         # This file
├── references/
│   ├── sources-by-domain.md          # Domain → source mapping (13 domains)
│   ├── review-checklist.md           # Reviewer audit checklist (12 items) — what good looks like
│   ├── review-lenses.md              # REVIEW stage: 3 subagent lens prompts + artifact format
│   └── source-archival.md            # Capture tiers, caps, index schema, Wayback, repo hygiene
├── scripts/
│   └── archive-source.sh             # Depth-0 source capture + index append (no required deps)
└── templates/
    ├── dossier.md                    # DECISION genre: ranked options + recommendation
    └── report.md                     # RESEARCH genre: survey spine, subject-shaped headings,
                                      #   "what could not be determined", optional final assessment
                                      # (ballot template moved to skills/ballot/)

# Hooks (repo-level, wired in .claude-plugin/plugin.json):
.claude-plugin/hooks/
├── ballot-filename.sh                # Gate: per-reviewer ballot naming (owned by skills/ballot)
├── sources-index-consistency.sh      # Gate: sources/ matches sources/index.md (silent if no archive)
├── dossier-hook-dispatcher.sh        # PostToolUse shim — file_path from JSON, invokes the two above
├── review-artifact-present.sh        # Gate: review-*.md exists, every finding dispositioned
└── dossier-commit-gate.sh            # PreToolUse shim on Bash — blocks `git commit` of an unreviewed dossier
```

## Dependencies

**Required:** WebSearch, WebFetch (built into Claude Code). For source archival: `curl` and `awk` only — both are Apple-/distro-shipped, so there is nothing for an adopter to install.
**Optional:** last30days skill (for social signal), commit-notation skill (for commit messages). For source archival: [`monolith`](https://github.com/Y2Z/monolith) (single-file HTML capture, `brew install monolith`) and [`pandoc`](https://pandoc.org/) (text extraction). Both are detected at runtime; absence degrades quality, never function.

Deliberately **not** dependencies: `wget` (cannot cap a single-file download, absent on stock macOS), `single-file-cli` / `percollate` (require a Chromium install), `ArchiveBox` (a self-hosted service), `httrack` (a site mirrorer). Rationale and measurements in `research/2026-07-26-source-archival/`.

## Testing

To verify the skill works:

1. **Trigger test:** Say "research the best X" or "compare A vs B" — the skill should load
2. **Preflight test:** Give an ambiguous request ("look into the AI space") — the skill should ask for clarification before starting research
3. **Template test:** Check that a produced dossier includes all REQUIRED sections (Key Facts, Key Concepts, Management Summary, Evaluations, Sources)
4. **Ballot filename gate:** Write a file named `DOSSIER-Test-BALLOT.md` (no reviewer) — the `ballot-filename.sh` hook fires, stderr reports the pattern mismatch, exit code 2.
5. **Review-checklist pass:** After delivering a dossier, walk through `references/review-checklist.md` — each of the 12 items should be actionable against the finished dossier.
5b. **Review gate:** In a scratch git repo, stage a `DOSSIER-*.md` with no `review-*.md` beside it and pipe `{"tool_input":{"command":"git commit -m x"}}` into `dossier-commit-gate.sh` — expect exit 2 and a "no review artifact" message. Add a `review-*.md` whose finding has no `**Disposition:**` line — expect exit 2 again with the count mismatch. Disposition it — expect exit 0. Ballot files and non-commit Bash calls must pass untouched.
6. **Ballot test:** Ask for a comparison requiring a decision — verify the `ballot` skill's per-reviewer template is used.
7. **Session test:** After dossier delivery, ask a follow-up question — verify session stays open.
8. **Source archival (manual, not run by `pnpm test`):**

   ```bash
   # Capture a normal page, a JS-rendered one, and an unreachable host.
   S=skills/dossier/scripts/archive-source.sh
   bash $S https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404 S1 /tmp/src --no-wayback
   bash $S https://x.com/                    S2 /tmp/src --no-wayback   # expect: thin-capture
   bash $S https://this-host.invalid/x       S3 /tmp/src --no-wayback   # expect: exit 0, unavailable
   cat /tmp/src/index.md

   # Degradation: stock PATH only — no monolith, pandoc, or Homebrew.
   env PATH=/usr/bin:/bin bash $S https://example.com S4 /tmp/src-bare
   ```

   Expected: exit 0 in every case including the unreachable host; MDN gets both `.html` and a much smaller `.md`; `x.com` is flagged `thin-capture`; the bare-PATH run still captures via `curl`.
9. **Consistency gate:** with an archive present, delete a file that `index.md` references and write the dossier — `sources-index-consistency.sh` reports the missing file and the dispatcher exits 2. With no `sources/` directory, the same write exits 0.

## Known Gaps

- **Genre inference is a judgement, and it is deliberately unguarded.** Preflight 4 asks the agent to infer research-vs-decision from the request and to ask when it is ambiguous. There is no script checking it, and there should not be — the real question is "does this document's shape match what the reader asked for", which is not a pattern match. The 2026-04-18 `dossier-framing-declared.sh` gate tried to enforce framing by linting a declared label; it changed no output, and was removed. The mitigation here is *consequence*, not enforcement: the genre selects the template and switches two stages, so getting it wrong produces a visibly wrong-shaped document. Residual risk: an agent that never asks and always infers "decision" would regress silently. Untested against a subagent scenario.
- **Alerting-level gate.** PostToolUse fires *after* file write; exit 2 feeds stderr back to Claude but a motivated agent can ignore. Two gates remain (`ballot-filename.sh`, `sources-index-consistency.sh`) after the polish and preflight passes removed six others. PreToolUse rigor is documented future work; `ballot-filename.sh` is the cheapest upgrade candidate (filename is in `tool_input.file_path` before write).
- **JS-rendered sources cannot be captured.** Neither `curl` nor `monolith` executes JavaScript, so a client-rendered page archives as an empty shell. The skill detects this (`thin-capture`, via an awk text-length probe validated against real pages) and points at `single-file-cli` for a manual capture, but it cannot fix it. A headless browser is the real answer and is too heavy to require. Deliberate trade-off, not an oversight.
- **Archival coverage is not enforced.** The gate checks that the archive is *self-consistent*, never that every citation was captured — a coverage gate would hard-fail on a machine where nothing could be fetched, which is exactly the adopter this skill must not break. So a dossier can ship with zero archived sources and pass every gate. Reviewed by checklist item 10 instead.
- **`archive-source.sh` has no test suite.** Verified by the manual scenarios above (including a stock-`PATH` run) rather than by automated tests. A `tests/` dir following the `pandoc` skill's pattern is the natural next step.
- ~~**Checklist discipline depends on the reviewer.**~~ **CLOSED 2026-08-08 by the REVIEW stage.** This limitation was recorded months before it fired, along with the fix ("seed a subagent test scenario that runs the checklist"). It fired anyway: the author of review-checklist item 12 shipped a dossier violating item 12 roughly two hours after writing it. Diagnosis on the day: the DELIVER instruction was a *rule* — "did I run the checklist?" was answerable without doing the work. Now a stage with a PreToolUse commit gate. The residual risk moved rather than vanished: see the review-artifact entry below.
- **The review gate cannot prove the review is current.** It checks that a review artifact exists and that every finding is dispositioned — file-level facts. A dossier substantially rewritten after its review still passes; staleness (>14 days between review date and dossier mtime) is a warning, never a block. Deliberate: an mtime gate would fire on every properly-executed review, because the correct workflow is review → findings → fix, which leaves the dossier newer than the review by construction.
- **The review artifact could decay into box-ticking.** If findings become perfunctory, this becomes the rule it replaced. The disposition requirement resists it — writing "waived because X" is harder to fake than "checklist run" — but it is a softer defence than the gate itself. Worth watching over the first several dossiers.
- **Must-tier ballot gate deferred.** A hook that detects unticked Must items at delivery time would require parsing reviewer intent; too fragile. Kept as a prose rule in `skills/ballot/SKILL.md` — flag in sessionlog if blocked.
- **Source reference file** covers 13 domains — will grow with usage.
- **Template comments** (REQUIRED/OPTIONAL markers) need to be stripped from final output.
- **Hook routing scope.** Wiring targets Write/Edit on `DOSSIER-*.md` paths only; non-dossier research files are not audited.

## Future Improvements

- Integration with Obsidian vault for persistent knowledge
- Structured data export (JSON) alongside markdown dossier
- Quality scoring rubric for self-assessment before delivery
- Cross-dossier reference index (link related dossiers)
