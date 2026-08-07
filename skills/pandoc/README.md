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

### Mostly recipes, a few bundled wrappers

Pandoc's CLI is already the right interface for most conversions, so the skill is recipe-first. Two recipes are exceptions, both bundled because the *composition* is the value — agents would otherwise reinvent them each time:

- **Compact A4 print** (`scripts/md2pdf-print.sh` + `themes/marked-print.css`) composes pandoc with headless Chrome to get Marked-2-style print output with full Japanese + emoji support, which no single pandoc PDF engine handles cleanly out of the box.
- **Kindle EPUB** (`scripts/md2kindle-epub.sh`) fixes a specific set of flags — `--toc --toc-depth=3 --split-level=2` plus `-f markdown-task_lists` — that were arrived at empirically for e-reader output. The `task_lists` half in particular is a non-obvious finding (see Provenance) that a hand-written invocation reliably gets wrong.

### Kindle delivery is a separate skill

`md2kindle-epub.sh` produces the file and stops there. Everything about *getting it onto a device* — delivery routes, per-device addressing, the approved-sender allowlist, size ceilings — lives in the `send-to-kindle` skill. Those facts have a shelf life (four breaking changes between 2022 and 2026) and would otherwise version-bump `pandoc` every time Amazon moves something.

## File Structure

```
pandoc/
├── SKILL.md                          # Core skill (recipes, patterns, when-to-use)
├── README.md                         # This file
├── scripts/
│   ├── md2pdf-print.sh               # Markdown → A4 print PDF (pandoc + headless Chrome)
│   └── md2kindle-epub.sh             # Markdown → e-reader EPUB (TOC, chapter split, literal checkboxes)
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
- For the **compact A4 print** recipe: Google Chrome (or Chromium). The wrapper defaults to the macOS app-bundle path (`/Applications/Google Chrome.app`); on Linux/Windows or non-default install locations, override with `CHROME=/path/to/chrome`. No LaTeX needed. Glyph fallback for Japanese + emoji is best on macOS where Apple's system font stack is available; other platforms work but the exact look depends on installed fonts.
- For the **Kindle EPUB** recipe: pandoc only. No LaTeX, no Chrome, no Calibre — pandoc writes EPUB natively.
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
   pnpm test:print                              # convenience script
   # or, equivalently:
   skills/pandoc/tests/test-md2pdf-print.sh
   ```

   This runs `scripts/md2pdf-print.sh` against the in-repo fixture
   `tests/fixtures/print-test.md` (English + Japanese + emoji), then asserts:
   PDF is produced, page size is A4 (595 × 842 pt), page count is 1–3
   (catches layout regressions that explode the page count), Japanese
   string `香川県高松市浜ノ町` survives the round-trip via `pdftotext`,
   emoji `🎟` survives, and no `?` substitutions appear in the extracted
   text (a tofu-glyph negative check). The script skips cleanly (exit 0)
   if Chrome, pandoc, or poppler are not installed — so it's safe to wire
   into CI on machines where one or more aren't available.

   Override Chrome path with `CHROME=/path/to/chrome pnpm test:print`.

7. **Kindle EPUB test (manual):** no automated test yet. Convert any markdown
   file with `##` headings and a GFM checkbox list, then verify:

   ```bash
   skills/pandoc/scripts/md2kindle-epub.sh -o /tmp/out.epub some-doc.md
   unzip -l /tmp/out.epub                     # mimetype first, one .xhtml per H2
   unzip -p /tmp/out.epub EPUB/nav.xhtml      # TOC lists headings to depth 3
   unzip -p /tmp/out.epub 'EPUB/text/*.xhtml' | grep -c 'input type="checkbox"'  # expect 0
   ```

   Add `--raw-checkboxes` and the last check should flip to non-zero.

## Provenance

- Option reference curated from official pandoc 3.9.0.2 man page (`man pandoc`)
- Recipes validated against actual pandoc invocations
- Format lists from `pandoc --list-input-formats` and `pandoc --list-output-formats`
- `md2kindle-epub.sh` and the `task_lists` / Unicode-glyph finding come from a 2026-08-06 Kindle delivery experiment run outside this repo (home-workspace `research/2026-08-06-kindle-delivery/`), which tested the script against a real 436-line dossier and a real 7-checkbox ballot, validated the resulting EPUB with `xmllint`, and confirmed on-device rendering. The script is copied here verbatim, comment block included.

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
