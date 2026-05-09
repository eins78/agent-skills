# Pandoc Skill — Development Documentation

## Purpose

Teaches agents to use pandoc for document format conversion instead of writing ad-hoc conversion scripts. Primary value is discovery — the description triggers on format conversion requests, and the skill provides recipes so agents don't reinvent the wheel.

**Tier:** Published (beta) — available in the [eins78/agent-skills](https://github.com/eins78/agent-skills) plugin

## Design Decisions

### Discovery-first design

The skill's main value is in the frontmatter description. Agents frequently write Python scripts with python-docx, beautifulsoup4, or markdown libraries when pandoc handles the conversion in a single command. The trigger phrases target these exact scenarios.

### No globs

Pandoc handles 60+ input formats. File-type-based triggering would be either too broad or too narrow. Description-based matching is correct here.

### Curated manual vs full manual

The pandoc man page is 5200+ lines. The curated version in `references/` keeps the most useful sections (options, common variables, extensions overview) and cuts exhaustive per-format details. Agents can always run `man pandoc` or `pandoc --help` for the complete reference.

### Mostly recipes, one bundled wrapper

Pandoc's CLI is already the right interface for most conversions, so the skill is recipe-first. The one exception is the **compact A4 print** recipe (`scripts/md2pdf-print.sh` + `themes/marked-print.css`): it composes pandoc with headless Chrome to get Marked-2-style print output with full Japanese + emoji support, which no single pandoc PDF engine handles cleanly out of the box. Bundled because the composition is the value — agents would otherwise reinvent the wrapper each time.

## File Structure

```
pandoc/
├── SKILL.md                          # Core skill (recipes, patterns, when-to-use)
├── README.md                         # This file
├── scripts/
│   └── md2pdf-print.sh               # Markdown → A4 print PDF (pandoc + headless Chrome)
├── themes/
│   └── marked-print.css              # Compact A4 print stylesheet for the wrapper
├── tests/
│   ├── test-md2pdf-print.sh          # Regression test for the print recipe
│   └── fixtures/
│       └── print-test.md             # Fixture: English + Japanese + emoji
└── references/
    ├── pandoc-manual.md              # Curated pandoc manual (~690 lines)
    ├── pandoc-install.md             # Installation guide
    └── pandoc-advanced.md            # Lua filters, citations, slides, templates
```

## Dependencies

- pandoc 3.x+ (tested with 3.9.0.2)
- For PDF output: a LaTeX distribution (texlive, mactex, tectonic) or weasyprint/typst
- For the **compact A4 print** recipe: macOS with Google Chrome installed (the wrapper assumes `/Applications/Google Chrome.app`; override with `CHROME=...`). No LaTeX needed.
- For running `tests/test-md2pdf-print.sh`: poppler (`brew install poppler`) for `pdfinfo` + `pdftotext`. The test skips cleanly if any tool is missing — it never fails CI on a machine that can't run it.
- No other dependencies

## Testing

1. **Trigger test:** Ask "convert this markdown to PDF" — the skill should load
2. **Recipe test:** Run each recipe from SKILL.md and verify output
3. **Anti-pattern test:** Ask to "write a script to convert DOCX to markdown" — agent should use pandoc instead
4. **Format detection test:** Verify pandoc auto-detects from file extensions
5. **Reference test:** Ask about Lua filters or citations — agent should consult `references/pandoc-advanced.md`
6. **Compact A4 print test (automated):** Run

   ```bash
   skills/pandoc/tests/test-md2pdf-print.sh
   ```

   This runs `scripts/md2pdf-print.sh` against the in-repo fixture
   `tests/fixtures/print-test.md` (English + Japanese + emoji), then asserts:
   PDF is produced, page size is A4 (595 × 842 pt), page count ≥ 1, Japanese
   string `香川県高松市浜ノ町` survives the round-trip via `pdftotext`, and
   emoji `🎟` survives. The script skips cleanly (exit 0) if Chrome,
   pandoc, or poppler are not installed — so it's safe to wire into CI.

   Override Chrome path with `CHROME=/path/to/chrome tests/test-md2pdf-print.sh`.

## Provenance

- Option reference curated from official pandoc 3.9.0.2 man page (`man pandoc`)
- Recipes validated against actual pandoc invocations
- Format lists from `pandoc --list-input-formats` and `pandoc --list-output-formats`

## Known Gaps

- No coverage of pandoc's Haskell library API (not relevant for CLI use)
- Citation processing is summarized, not exhaustive
- No Windows installation instructions (macOS/Linux/Docker only)
- Custom reader/writer documentation is minimal
- No coverage of pandoc server mode

## Future Improvements

- Add a `defaults/` directory with pre-built .yaml defaults files for common workflows
- Add example Lua filters for common transformations
- Add DOCX reference template for styled output
- Coverage of pandoc's Typst integration (growing format)
