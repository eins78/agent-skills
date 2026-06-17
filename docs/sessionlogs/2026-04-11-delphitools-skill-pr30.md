# DelphiTools Skill — PR #30 Iteration

**Date:** 2026-04-11 / 2026-04-12
**Source:** Claude Code
**Session:** Reconstructed from 2 compactions · ~800k+ input tokens

## Plan Reference
- Plan: `~/.claude/plans/foamy-dazzling-balloon.md`
- Planned: 7-step creation of `delphitools` skill (explore site, explore source, headless research, dossier, write skill, validate, finalize)
- Executed: All steps completed across multiple sessions. This sessionlog covers the final iteration round (Apr 11-12).

## Summary

Completed two rounds of review and refactoring on PR #30 (`feat/delphitools-skill`). First round: wrapper script audit, exceptions table, browser-first mode hierarchy reframe. Second round: critical self-review finding 22 issues (6 critical), all fixed including a showstopper in `impose-pdf.mjs` that pretended to write output but didn't.

## Key Accomplishments

- Audited all 10 wrapper scripts — confirmed no bundle duplication (only `impose-pdf.mjs` imports from bundle, rest correctly call npm libraries)
- Reframed mode hierarchy: Browser Automation (primary) → Guided Browser Use (secondary) → CLI Mode (advanced)
- Renamed all 47 reference files: "Browser Mode (Default)" → "Browser Mode", "Advanced Mode" → "CLI Mode (Node.js)"
- Critical review found `impose-pdf.mjs` was a stub — rewrote with actual PDF output, then /simplify found 5 more bugs (N+1 embed, division-by-zero, rotation pivot, `??` vs `||`, memory leak)
- Fixed changeset format in README (was using wrong `Skills:` footer instead of `<!-- bumps: -->`)
- Reconciled wrapper counts across all files (7 tools, not 8/10)

## Decisions

- **Browser-first as primary mode:** DelphiTools is a browser app — browser automation covers 47/47 tools, CLI only covers 7. Previous "CLI-first" framing was backwards.
- **Guided Browser Use as secondary:** When Playwright MCP isn't available, agent guides user step-by-step. Fills gap for mobile/tablet users.
- **Paper Sizes moved to Print category:** Was in Typography, but the tool is about paper dimensions and PDF page detection — fits better with imposer/preflight/guillotine.
- **Reference file CLI sections:** Removed contradictory "N/A" framing from files that actually provide working recipes (favicon-genny, image-clipper, social-cropper).
- **impose-pdf.mjs rotation pivot:** pdf-lib rotates around (x, y) not page center. Added per-rotation offset table for 90°/180°/270°.

## Changes Made (this session)

- Modified: `skills/delphitools/SKILL.md` (mode hierarchy, flowchart, common mistakes, frontmatter fixes)
- Modified: `skills/delphitools/README.md` (exceptions table, wrapper counts, changeset format, mode names)
- Modified: `skills/delphitools/scripts/impose-pdf.mjs` (complete rewrite of output section)
- Modified: `skills/delphitools/scripts/encode.mjs` (comment fix)
- Modified: `skills/delphitools/scripts/build-local.sh` (header fix)
- Modified: `skills/delphitools/evals/evals.json` (category rename)
- Modified: 47 tool reference files (mode header renames)
- Modified: 6 tool reference files (content fixes: background-remover, graph-calc, meta-tag-genny, favicon-genny, image-clipper, social-cropper, paper-sizes)
- Modified: `skills/delphitools/references/advanced-mode.md`, `browser-automation-patterns.md`

## Wrap-up

### Post-/simplify analysis

The /simplify pass (3 parallel review agents: reuse, quality, efficiency) caught 5 real bugs in the freshly-rewritten `impose-pdf.mjs`:

1. **N+1 embedPages** — was calling `embedPages()` per placement inside the inner loop. A 20-page saddle-stitch booklet would embed each page ~4x. Fixed: batch-embed all pages once before the loop.
2. **Division by zero** — if placement width/height was 0, `scaleX`/`scaleY` became `Infinity`/`NaN`. Fixed: skip zero-size placements.
3. **Rotation pivot** — pdf-lib's `drawPage` rotates around `(x, y)` (bottom-left), not page center. For 180° rotation (common in imposition), pages landed off-canvas. Fixed: per-rotation offset table.
4. **`||` vs `??`** — `placement.x || 0` coerces valid `x=0` to `0` by accident. Switched to `?? 0` for correctness.
5. **Memory** — raw input buffer was retained after parsing. Set to `null` after `PDFDocument.load()`.

The documentation changes (other 12 files) were clean — no issues found by the efficiency or reuse agents.

### Items intentionally not fixed

- **Eval coverage gaps:** 21 of 47 tools have no eval coverage. Too large for this PR — should be a separate effort.
- **`advanced-mode.md` filename:** Renaming to `cli-mode.md` would break all existing references. Not worth it.
- **Unrelated files in PR:** `docs/sessionlogs/2026-04-11-typescript-strict-patterns-1.0.0.md`, CLAUDE.md changes, and `release.yml` changes were committed in earlier sessions on this branch. Cherry-picking them out would be more disruptive than leaving them.
- **Arg-parsing duplication across scripts:** All 7 `.mjs` scripts use the same hand-rolled arg loop. Intentional — scripts are standalone shims, coupling them via shared utils adds no value.

## Next Steps

- [ ] Run `/ai-review` for external second opinion before merge
- [ ] Move PR #30 from draft to ready
- [ ] Address colorblind-sim.md: lists 4 simulation types but live site shows 9
- [ ] Add evals for 21 uncovered tools (separate PR)
- [ ] Run `pnpm run validate` as final check

## Repository State

- Branch: `feat/delphitools-skill`
- Latest commit: `1fda2ce` — delphitools: critical review fixes across PR #30
- PR: https://github.com/eins78/agent-skills/pull/30 (draft)
- All changes pushed to origin
- `pnpm test` passes (12 skills)
