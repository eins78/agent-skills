---
name: pandoc
description: >-
  Use when converting documents between formats — HTML, Markdown, DOCX, PDF,
  LaTeX, EPUB, reStructuredText, Org, JIRA, CSV, Jupyter notebooks, slides,
  and 60+ others. Triggers: convert file, export to PDF, make a PDF, turn
  this into markdown, HTML to markdown, DOCX to markdown, markdown to DOCX,
  generate slides, create EPUB, format conversion, pandoc, document
  conversion. Always prefer pandoc over ad-hoc conversion scripts.
globs: []
compatibility: claude-code, cursor
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/agent-skills
  version: "1.1.0"
---

# Pandoc

Universal document converter. Reader → AST → Writer pipeline with 60+ input and 80+ output formats. Prefer pandoc over writing custom conversion scripts — one command replaces most python-docx, beautifulsoup4, or markdown library usage.

## Quick Reference

| Flag | Purpose |
|------|---------|
| `-f FORMAT` | Input format (auto-detected from file extension) |
| `-t FORMAT` | Output format (auto-detected from extension) |
| `-o FILE` | Output file (stdout if omitted) |
| `-s` | Standalone — complete document with header/footer |
| `--wrap=none` | Don't rewrap lines (preserve original line breaks) |
| `--extract-media=DIR` | Extract images from DOCX/EPUB/ODT |
| `--toc` | Generate table of contents |
| `--number-sections` | Number section headings |
| `--pdf-engine=ENGINE` | PDF backend (default: pdflatex) |
| `--reference-doc=FILE` | Style template for DOCX/ODT/PPTX output |
| `--template=FILE` | Custom output template |
| `--embed-resources` | Embed images/CSS inline (HTML) |
| `-V KEY=VALUE` | Set template variable |
| `-L SCRIPT` | Apply Lua filter |
| `--shift-heading-level-by=N` | Adjust heading levels |
| `--columns=N` | Line wrap width (default 72) |

## Common Recipes

### HTML → Markdown

```bash
pandoc -f html -t gfm -o output.md input.html
pandoc -f html -t gfm --wrap=none https://example.com/page  # from URL
```

### Markdown → HTML

```bash
pandoc -s -o output.html input.md                    # standalone page
pandoc -s --toc --css=style.css -o output.html input.md  # with TOC + CSS
pandoc -t html input.md                              # fragment only (no <head>)
```

### DOCX → Markdown

```bash
pandoc --extract-media=media/ --wrap=none -o output.md input.docx
```

### Markdown → DOCX

```bash
pandoc -o output.docx input.md
pandoc --reference-doc=template.docx -o output.docx input.md  # styled
```

### Markdown → PDF

Requires a LaTeX engine (or alternative). See `${CLAUDE_SKILL_DIR}/references/pandoc-install.md` for setup.

```bash
pandoc -o output.pdf input.md                           # default (pdflatex)
pandoc --pdf-engine=xelatex -o output.pdf input.md      # Unicode/custom fonts
pandoc --pdf-engine=typst -o output.pdf input.md        # lightweight, no LaTeX
pandoc --pdf-engine=weasyprint -t html -o output.pdf input.md  # via HTML/CSS
```

### Jupyter Notebook ↔ Markdown

```bash
pandoc -o output.md notebook.ipynb                    # notebook → markdown
pandoc -o output.ipynb input.md                       # markdown → notebook
```

### Markdown → Slides

```bash
pandoc -t revealjs -s -o slides.html input.md         # reveal.js
pandoc -o slides.pptx input.md                        # PowerPoint
pandoc -t beamer -o slides.pdf input.md               # LaTeX Beamer
```

### EPUB

```bash
pandoc -o book.epub chapter1.md chapter2.md metadata.yaml
```

### Man page → Markdown

```bash
man pandoc | pandoc -f man -t gfm --wrap=none
```

### Batch conversion

```bash
for f in *.docx; do pandoc --extract-media=media/ -o "${f%.docx}.md" "$f"; done
```

## Format Detection

Pandoc auto-detects formats from file extensions. Specify `-f`/`-t` explicitly when:

- Reading from stdin or writing to stdout
- Extension is ambiguous (e.g., `.txt` → defaults to markdown)
- You need a specific variant (gfm vs markdown vs commonmark)

### Markdown Variants

| Format | Use for |
|--------|---------|
| `gfm` | GitHub — tables, task lists, strikethrough, autolinks |
| `commonmark` | Strict CommonMark spec |
| `commonmark_x` | CommonMark + pandoc extensions |
| `markdown` | Pandoc's Markdown — most features, default |
| `markdown_strict` | Original Gruber Markdown — minimal |

### Listing formats

```bash
pandoc --list-input-formats
pandoc --list-output-formats
pandoc --list-extensions=gfm          # extensions for a specific format
```

## Standalone vs Fragment

| Mode | Flag | Output | Use when |
|------|------|--------|----------|
| Fragment | (default) | Body content only | Embedding in another document |
| Standalone | `-s` | Complete document with headers | Creating a valid file (HTML, LaTeX, etc.) |

Always use `-s` for HTML files, LaTeX documents, and slide decks. DOCX/PDF/EPUB are always standalone.

## When to Use Pandoc vs Other Tools

| Task | Tool | Why |
|------|------|-----|
| Document format conversion | **pandoc** | Built for this — one command |
| Clean HTML → Markdown | **pandoc** | Handles structure well |
| Complex web scraping | Dedicated scraper | Pandoc needs clean HTML input |
| PDF text extraction | pdftotext, pdfplumber | Pandoc cannot read PDF |
| Image format conversion | ImageMagick, sips | Not pandoc's domain |
| CSV/JSON data processing | jq, csvkit, code | Pandoc reads CSV/JSON but as documents |
| Markdown rendering in terminal | glow, pandoc -t ansi | Either works |
| Office doc creation (complex) | python-docx, openpyxl | When pandoc's model is too simple |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing a Python script for DOCX → MD | Use `pandoc --extract-media=media/ -o out.md in.docx` |
| Forgetting `-s` for standalone HTML | Add `-s` when output needs `<head>` and `<body>` |
| PDF fails — no LaTeX installed | Install texlive/mactex, or use `--pdf-engine=typst` or `weasyprint` |
| Losing images from DOCX | Add `--extract-media=media/` |
| Wrong markdown flavor in output | Specify `-t gfm` or `-t commonmark` explicitly |
| Piping binary formats to stdout | Use `-o file.docx` — DOCX/PDF/EPUB must write to files |
| Line wrapping mangles output | Add `--wrap=none` to preserve original line breaks |

## References

Consult for deep dives — these are loaded on demand, not auto-included:

- `${CLAUDE_SKILL_DIR}/references/pandoc-manual.md` — Curated option reference, templates, extensions
- `${CLAUDE_SKILL_DIR}/references/pandoc-install.md` — Installation on macOS, Linux, Docker + PDF engines
- `${CLAUDE_SKILL_DIR}/references/pandoc-advanced.md` — Lua filters, citations, slides, custom writers, EPUB
