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
│   ├── review-checklist.md           # Reviewer audit checklist (11 items)
│   └── source-archival.md            # Capture tiers, caps, index schema, Wayback, repo hygiene
├── scripts/
│   └── archive-source.sh             # Depth-0 source capture + index append (no required deps)
└── templates/
    ├── dossier.md                    # DECISION genre: ranked options + recommendation
    └── report.md                     # RESEARCH genre: survey spine, subject-shaped headings,
                                      #   "what could not be determined", optional final assessment
                                      # (ballot template moved to skills/ballot/)

# Hooks (repo-level, wired in .claude-plugin/plugin.json via dossier-hook-dispatcher.sh):
.claude-plugin/hooks/
├── ballot-filename.sh                # Gate: per-reviewer ballot naming (owned by skills/ballot)
├── sources-index-consistency.sh      # Gate: sources/ matches sources/index.md (silent if no archive)
└── dossier-hook-dispatcher.sh        # Argv/stdin shim — extracts file_path from PostToolUse JSON, invokes both gates
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
5. **Review-checklist pass:** After delivering a dossier, walk through `references/review-checklist.md` — each of the 11 items should be actionable against the finished dossier.
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
- **Checklist discipline depends on the reviewer.** The review-checklist replaces 4 deleted grep hooks; its value depends on a judgement-capable reviewer actually running it. Agents under time pressure may skim. Planned: seed a subagent test scenario that runs the checklist.
- **Must-tier ballot gate deferred.** A hook that detects unticked Must items at delivery time would require parsing reviewer intent; too fragile. Kept as a prose rule in `skills/ballot/SKILL.md` — flag in sessionlog if blocked.
- **Source reference file** covers 13 domains — will grow with usage.
- **Template comments** (REQUIRED/OPTIONAL markers) need to be stripped from final output.
- **Hook routing scope.** Wiring targets Write/Edit on `DOSSIER-*.md` paths only; non-dossier research files are not audited.

## Future Improvements

- Integration with Obsidian vault for persistent knowledge
- Structured data export (JSON) alongside markdown dossier
- Quality scoring rubric for self-assessment before delivery
- Cross-dossier reference index (link related dossiers)
