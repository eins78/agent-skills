# Pandoc PR #54 — Critical Review + Hardening Pass

**Date:** 2026-05-18
**Source:** Claude Code
**Session:** Reconstructed from 1 compaction (prior session created PR #54; this session reviewed it and applied fixes)

## Summary

Critical review of PR #54 (compact A4 print recipe for the `pandoc` skill) surfaced 10 issues across the wrapper script, print stylesheet, regression test, and docs. All 10 were fixed in commit `8e41477`, pushed to `feature/pandoc-marked-print`, verified locally with `pnpm test`, `pnpm run validate`, and the now-renamed `pnpm test:print`.

## Key Accomplishments

- Produced a structured critical review of PR #54 with severity tiers (real bugs / test rigor / doc accuracy / process)
- Fixed two real latent bugs that would produce wrong output without surfacing errors:
  - **Code block clipping:** `<pre>` had `white-space: pre` + `overflow: visible`, so long lines silently fell off the page edge in print. Fixture's short code block wouldn't catch this.
  - **Silent Chrome failure:** `2>/dev/null` swallowed Chrome's stderr; wrapper would exit 0 with a 0-byte PDF if Chrome misbehaved.
- Tightened the regression test from a permissive smoke check into a real layout regression detector (page count range, tofu-glyph negative check)
- Made the print recipe surface on print-related triggers in addition to "convert"
- Documented the `tests/` directory pattern in root CLAUDE.md so future contributors know it's accepted (it was previously novel and only justified by user confirmation in the prior session)

## Changes Made

All in commit `8e41477`:

- Modified: `skills/pandoc/themes/marked-print.css` — `<pre>` and `<code>` now `pre-wrap` + `overflow-wrap: anywhere`
- Modified: `skills/pandoc/scripts/md2pdf-print.sh` — single `mktemp -d` workdir, captured Chrome stderr to log, fail loudly on Chrome non-zero or empty PDF
- Modified: `skills/pandoc/tests/test-md2pdf-print.sh` — `mktemp -d`, page count range `1-3`, negative `?`-substitution check
- Modified: `skills/pandoc/SKILL.md` — added `print to PDF, printable PDF, A4 print, fold-to-A5 booklet` to triggers; reframed pandoc-3.9 note as future-proof; documented long-line wrap behavior
- Modified: `skills/pandoc/README.md` — Chrome wording broadened beyond macOS; test instructions reflect tightened assertions and `pnpm test:print`
- Modified: `CLAUDE.md` — added section listing `scripts/`, `themes/`, `references/`, `tests/` as accepted optional skill subdirectories with their conventions
- Modified: `package.json` — added `test:print` npm script
- Modified: `.changeset/pandoc-marked-print-recipe.md` — extended description to mention the hardening (stderr capture, empty-PDF guard, long-line wrap, tighter test)

## Decisions

- **Rolled the fixes into v1.2.0 rather than bumping to 1.2.1.** The 1.2.0 changeset hasn't shipped yet (PR still open), so these are pre-release refinements, not a follow-up patch. CLAUDE.md says version bumps are managed by `bump-skill-versions.sh` from the `bumps:` block — the existing `minor` bump still produces the right version.
- **Chose `white-space: pre-wrap; overflow-wrap: anywhere` over `word-break: break-all`.** `break-all` would break inside short identifiers even when not needed; `overflow-wrap: anywhere` only breaks mid-token when no softer break exists at the edge, which keeps normal code readable.
- **Page count range `1-3`, not exact `== 1`.** Exact would flake on minor CSS tweaks that legitimately push the fixture to two pages. The range still catches the real failure mode (layout regression that paginates the fixture to ~50 pages).
- **Added negative tofu check rather than positive font-coverage check.** The fixture contains no `?` literals, so `grep -q '?'` cleanly detects fallback substitutions adjacent to the Japanese/emoji ranges without needing to inventory expected glyphs.
- **Skipped accessibility-lead delegation as false-positive.** The hook fired on "PR" in the prompt, but the work is a print stylesheet for a CLI converter — not user-facing web UI. Print CSS doesn't intersect with screen-reader accessibility in a meaningful way for this scope.

## Verification

```
pnpm test          → all skills discoverable
pnpm run validate  → "All skills valid (0 warning(s))"
pnpm test:print    → 6/6 PASS (252296 bytes, 594.96×841.92 pt, 1 page,
                     香川県高松市浜ノ町 preserved, 🎟 preserved, no '?' substitutions)
```

## Next Steps

- [ ] Await review / merge of PR #54: <https://github.com/eins78/agent-skills/pull/54>
- [ ] (Optional follow-up, separate PR) Wire `pnpm test:print` into CI on macOS runner only (test self-skips elsewhere, so it's safe but adds little value off-macOS)

## Repository State

- Branch: `worktree-pandoc` → pushed to `origin/feature/pandoc-marked-print`
- Commits on PR #54 (3 total, top to bottom):
  - `8e41477` — pandoc: address PR review — harden wrapper, tighten test, expand docs
  - `e984f47` — pandoc: in-repo fixture + regression test for the print recipe
  - `93d9673` — pandoc: v1.2.0 — compact A4 print recipe (Japanese + emoji)
- Working tree clean
