# DelphiTools Skill Architecture: Tracking a Browser-Based Tool Library

**Date:** 2026-04-11
**Author:** Claude Code (research commissioned by Max Albrecht)
**Status:** Research complete — ready for skill implementation

---

## Key Concepts

| Term | What it is | Learn more |
|------|-----------|------------|
| **[DelphiTools](https://delphi.tools)** | Open-source collection of 47 browser-based design utilities. No logins, no tracking, all local processing. | [GitHub](https://github.com/1612elphi/delphitools) |
| **Browser automation** | Using Playwright MCP (or similar) to drive tools in a real browser on behalf of the user. The default interaction mode for this skill. | [Playwright MCP](https://github.com/anthropics/anthropic-quickstarts/tree/main/mcp-servers/playwright) |
| **Static export** | DelphiTools builds to pure static HTML/JS/CSS via `next build`. Can be self-hosted from any file server or opened locally. | [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) |
| **`lib/` modules** | Pure TypeScript computation modules in the DelphiTools source — separated from React UI. Many are headless-friendly for advanced use. | [Source: lib/](https://github.com/1612elphi/delphitools/tree/main/lib) |

---

## Management Summary

### Core Framing

This skill **tracks the [DelphiTools](https://delphi.tools) tool library** — it does not recreate its tools. The tools are open-source, browser-based, and run at [delphi.tools](https://delphi.tools) (or [tools.rmv.fyi](https://tools.rmv.fyi)). The skill's job is to:

1. **Know what tools exist** and when to suggest them
2. **Guide users through using them** in the browser (default mode for designers)
3. **Provide advanced-mode recipes** for developers who want programmatic access via git clone + Node.js

### Recommendations

| Priority | What | Why |
|----------|------|-----|
| **1. Per-tool reference files** | One reference file per tool in `references/tools/` | Main value: detailed user guides that agents use to help designers |
| **2. Browser-first guidance** | Default mode = Playwright MCP navigation to `delphi.tools/tools/{id}` | Target audience is designers, not developers. Tools already work in the browser. |
| **3. Version-pinned source access** | Track repo commits/tags; provide git clone + build instructions | Advanced mode for developers. The repo has no tags yet, so pin to commit hashes. |
| **4. Wrapper scripts for advanced mode** | Shell/Node scripts in `references/scripts/` for programmatic use | Bridge between "clone the repo" and "run the tool headlessly" |

---

## Tool Library Inventory

### Summary

- **47 tools** across 8 categories (as of commit `12919e0`, 2026-04-10)
- **Live site:** [delphi.tools](https://delphi.tools) (also [tools.rmv.fyi](https://tools.rmv.fyi))
- **Source:** [1612elphi/delphitools](https://github.com/1612elphi/delphitools) — 307 stars, MIT license
- **No releases/tags** — track by commit hash
- **No CI/CD** — no GitHub Actions workflows
- **iOS app** in TestFlight beta (announced in latest commits)

### Complete Tool Registry

Source: [`lib/tools.ts`](https://github.com/1612elphi/delphitools/blob/main/lib/tools.ts)

#### Social Media (4 tools)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `social-cropper` | Social Media Cropper | Crop images for Instagram, Bluesky and Threads | [Open](https://delphi.tools/tools/social-cropper) |
| `matte-generator` | Matte Generator | Put non-square images on a square matte | [Open](https://delphi.tools/tools/matte-generator) |
| `scroll-generator` | Seamless Scroll Generator | Split images for Instagram carousel scrolls | [Open](https://delphi.tools/tools/scroll-generator) |
| `watermarker` | Watermarker | Add watermarks to images | [Open](https://delphi.tools/tools/watermarker) |

#### Colour (8 tools)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `colour-converter` | Colour Converter | Convert between colour formats (HEX, RGB, HSL, LAB, LCH, OKLAB, OKLCH) | [Open](https://delphi.tools/tools/colour-converter) |
| `tailwind-shades` | Tailwind Shade Generator | Generate Tailwind colour scales | [Open](https://delphi.tools/tools/tailwind-shades) |
| `harmony-genny` | Harmony Generator | Generate colour harmonies | [Open](https://delphi.tools/tools/harmony-genny) |
| `palette-genny` | Palette Generator | Generate beautiful colour palettes | [Open](https://delphi.tools/tools/palette-genny) |
| `palette-collection` | Palette Collection | Browse curated colour palettes | [Open](https://delphi.tools/tools/palette-collection) |
| `contrast-checker` | Contrast Checker | Check WCAG colour contrast compliance | [Open](https://delphi.tools/tools/contrast-checker) |
| `colorblind-sim` | Colour Blindness Simulator | Simulate how colours appear to colour blind users | [Open](https://delphi.tools/tools/colorblind-sim) |
| `gradient-genny` | Gradient Generator | Create linear, corner, and mesh gradients | [Open](https://delphi.tools/tools/gradient-genny) |

#### Images and Assets (10 tools)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `favicon-genny` | Favicon Generator | Generate favicons from any image | [Open](https://delphi.tools/tools/favicon-genny) |
| `svg-optimiser` | SVG Optimiser | Optimise and minify SVG files | [Open](https://delphi.tools/tools/svg-optimiser) |
| `placeholder-genny` | Placeholder Generator | Generate placeholder images | [Open](https://delphi.tools/tools/placeholder-genny) |
| `image-splitter` | Image Splitter | Split images into tiles | [Open](https://delphi.tools/tools/image-splitter) |
| `image-converter` | Image Converter | Convert between PNG, JPEG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS | [Open](https://delphi.tools/tools/image-converter) |
| `artwork-enhancer` | Artwork Enhancer | Add colour noise overlay to artwork | [Open](https://delphi.tools/tools/artwork-enhancer) |
| `background-remover` | Background Remover | Remove backgrounds automatically (Beta) | [Open](https://delphi.tools/tools/background-remover) |
| `image-tracer` | Image Tracer | Trace raster images to SVG vectors | [Open](https://delphi.tools/tools/image-tracer) |
| `paste-image` | Paste Image | Paste and download clipboard images | [Open](https://delphi.tools/tools/paste-image) |
| `image-clipper` | Image Clipper | Trim transparent edges from PNGs | [Open](https://delphi.tools/tools/image-clipper) |

#### Typography and Text (7 tools)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `px-to-rem` | PX to REM | Convert pixels to rem units | [Open](https://delphi.tools/tools/px-to-rem) |
| `line-height-calc` | Line Height Calculator | Calculate optimal line heights | [Open](https://delphi.tools/tools/line-height-calc) |
| `typo-calc` | Typography Calculator | Convert between typographic units | [Open](https://delphi.tools/tools/typo-calc) |
| `paper-sizes` | Paper Sizes | Reference for paper dimensions | [Open](https://delphi.tools/tools/paper-sizes) |
| `word-counter` | Word Counter | Count words, characters and more | [Open](https://delphi.tools/tools/word-counter) |
| `glyph-browser` | Glyph Browser | Browse unicode glyphs | [Open](https://delphi.tools/tools/glyph-browser) |
| `font-explorer` | Font File Explorer | Explore font file contents | [Open](https://delphi.tools/tools/font-explorer) |

#### Print and Production (4 tools)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `pdf-preflight` | PDF Preflight | Analyse PDFs for print-readiness issues | [Open](https://delphi.tools/tools/pdf-preflight) |
| `guillotine-director` | Guillotine Director | Guided workflow for guillotine cutting | [Open](https://delphi.tools/tools/guillotine-director) |
| `zine-imposer` | Zine Imposer | Create 8-page mini-zine imposition layouts | [Open](https://delphi.tools/tools/zine-imposer) |
| `imposer` | Print Imposer | Impose PDF pages for booklet, saddle-stitch, N-up | [Open](https://delphi.tools/tools/imposer) |

#### Other Tools (6 tools)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `markdown-writer` | Text Scratchpad | Text editor with manipulation tools | [Open](https://delphi.tools/tools/markdown-writer) |
| `tailwind-cheatsheet` | Tailwind Cheat Sheet | Quick reference for Tailwind classes | [Open](https://delphi.tools/tools/tailwind-cheatsheet) |
| `qr-genny` | QR Generator | Styled QR codes with custom colours, shapes, logos | [Open](https://delphi.tools/tools/qr-genny) |
| `code-genny` | Barcode Generator | Data Matrix, Aztec, PDF417, Code 128, EAN-13, and more | [Open](https://delphi.tools/tools/code-genny) |
| `meta-tag-genny` | Meta Tag Generator | Generate HTML meta tags | [Open](https://delphi.tools/tools/meta-tag-genny) |
| `regex-tester` | Regex Tester | Test regular expressions | [Open](https://delphi.tools/tools/regex-tester) |

#### Calculators (7 tools)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `sci-calc` | Scientific Calculator | Full-featured calculator with history | [Open](https://delphi.tools/tools/sci-calc) |
| `graph-calc` | Graph Calculator | Plot and visualise mathematical functions | [Open](https://delphi.tools/tools/graph-calc) |
| `algebra-calc` | Algebra Calculator | Symbolic algebra: simplify, factor, solve, derivatives | [Open](https://delphi.tools/tools/algebra-calc) |
| `base-converter` | Base Converter | Convert between decimal, hex, binary, octal | [Open](https://delphi.tools/tools/base-converter) |
| `time-calc` | Time Calculator | Unix timestamps, date arithmetic, timezone conversion | [Open](https://delphi.tools/tools/time-calc) |
| `unit-converter` | Unit Converter | Convert between units of length, weight, data, and more | [Open](https://delphi.tools/tools/unit-converter) |
| `encoder` | Encoding Tools | Base64, URL encoding, and hash generation | [Open](https://delphi.tools/tools/encoder) |

#### Turbo-nerd (1 tool)

| ID | Name | Description | URL |
|----|------|-------------|-----|
| `shavian-transliterator` | Shavian Transliterator | Transliterate English text to the Shavian alphabet | [Open](https://delphi.tools/tools/shavian-transliterator) |

---

## Architecture: How the Tools Work

### Build and Deploy

| Aspect | Detail |
|--------|--------|
| Framework | Next.js 16.1.6 + React 19.2.3 |
| Build | `next build` with `output: "export"` — produces static `out/` directory |
| Package manager | Bun (`bun.lock` present) |
| Hosting | Static files served from CDN. No server required at runtime. |
| Domains | `delphi.tools` (primary) and `tools.rmv.fyi` |
| CI/CD | None — no GitHub Actions, no automated deploy pipeline |
| Releases | No tags, no GitHub releases. Track by commit hash on `main`. |

### Tool Loading

Each tool is a React component in `components/tools/{tool-id}.tsx`, loaded via `next/dynamic` imports in `app/tools/[toolId]/page.tsx`. The URL pattern is:

```
https://delphi.tools/tools/{tool-id}
```

The tool registry in `lib/tools.ts` is the single source of truth for all tool metadata (ID, name, description, category, icon, flags like `new` and `beta`).

### Shared Computation Modules (lib/)

These pure TypeScript modules contain logic separated from React UI — relevant for advanced-mode extraction:

| Module | Lines | Purpose | Headless-friendly? |
|--------|-------|---------|-------------------|
| `lib/imposition.ts` | 690 | Print imposition geometry and page ordering | Yes — explicitly designed as "No React, no UI, no PDF dependencies" |
| `lib/palette-strategies.ts` | 764 | 20+ palette generation algorithms | Yes — pure math |
| `lib/palette-collection.ts` | ~200 | Curated palette data | Yes — static data |
| `lib/colour-names.ts` | ~30 | Nearest-color name lookup (wraps `color-name-list`) | Yes |
| `lib/colour-notation.ts` | New | Colour notation preferences | Yes |
| `lib/paper-sizes.ts` | ~50 | Standard paper dimensions | Yes — static data |
| `lib/math-constants.ts` | ~20 | Math constants | Yes |
| `lib/shavian/` | ~500 | Shavian transliteration logic | Yes — pure TS |

### Key npm Dependencies (for advanced mode)

| Package | Version | Used by | Purpose |
|---------|---------|---------|---------|
| svgo | ^4.0.0 | svg-optimiser | SVG optimization |
| pdf-lib | ^1.17.1 | imposer, zine-imposer, pdf-preflight, paper-sizes | PDF creation and manipulation |
| pdfjs-dist | ^5.4.624 | imposer, pdf-preflight | PDF parsing and rendering |
| qr-code-styling | ^1.9.2 | qr-genny | Styled QR code generation |
| bwip-js | ^4.8.0 | code-genny | Barcode generation |
| mathjs | ^15.1.0 | sci-calc | Math expression evaluation |
| nerdamer | ^1.1.13 | algebra-calc | Symbolic algebra |
| katex | ^0.16.27 | algebra-calc | LaTeX math rendering |
| crypto-js | ^4.2.0 | encoder | Hash generation |
| @huggingface/transformers | ^3.8.1 | background-remover | ML background removal |
| imagetracerjs | ^1.2.6 | image-tracer | Raster-to-SVG tracing |
| gifenc | ^1.0.3 | image-converter | GIF encoding |
| utif | ^3.1.0 | image-converter | TIFF handling |
| jszip | ^3.10.1 | qr-genny, code-genny, image-converter | ZIP creation for batch exports |
| color-name-list | ^14.31.0 | palette-genny, palette-collection, gradient-genny | Colour name lookup |
| mafs | ^0.21.0 | graph-calc | Function plotting |

---

## Skill Structure Design

### Proposed File Layout

```
skills/delphitools/
  SKILL.md                              # Main skill — overview, when to use, quick reference
  README.md                             # Development docs
  references/
    tools/                              # One file per tool (47 files)
      social-cropper.md
      matte-generator.md
      ...
      shavian-transliterator.md
    advanced-mode.md                    # Git clone, build, self-host instructions
    browser-automation-patterns.md      # Playwright MCP patterns for common interactions
    version-tracking.md                 # Current tracked version, changelog, download URLs
  scripts/
    build-local.sh                      # Clone + install + build DelphiTools locally
    serve-local.sh                      # Serve the static export locally
    # Per-tool wrapper scripts (for tools with extractable logic):
    optimize-svg.mjs                    # Wrapper around svgo
    generate-qr.mjs                     # Wrapper around qr-code-styling
    generate-barcode.mjs                # Wrapper around bwip-js
    create-pdf.mjs                      # Wrapper around pdf-lib
    impose-pdf.mjs                      # Wrapper using lib/imposition.ts + pdf-lib
    trace-image.mjs                     # Wrapper around imagetracerjs
    algebra.mjs                         # Wrapper around nerdamer
    encode.mjs                          # Wrapper around crypto-js + built-in encodings
```

### SKILL.md Design

The SKILL.md should:

1. **Trigger on design tool tasks** — "crop for Instagram", "optimize SVG", "check contrast", "generate QR code", "impose PDF for booklet", etc.
2. **Default to browser guidance** — load the tool URL in Playwright MCP, explain the interface, guide the user step by step
3. **Reference per-tool files** — `${CLAUDE_SKILL_DIR}/references/tools/{tool-id}.md` for detailed instructions
4. **Offer advanced mode** — for developers, point to wrapper scripts and git clone instructions

Estimated SKILL.md size: ~150 lines (overview + quick-reference table + mode selection + reference pointers).

### Per-Tool Reference File Structure

Each `references/tools/{tool-id}.md` should follow this template:

```markdown
# {Tool Name}

**Category:** {category}
**URL:** https://delphi.tools/tools/{tool-id}
**Status:** {stable | beta | new}

## What It Does
{1-2 sentence description of the tool's purpose}

## When to Use
{Scenarios where this tool is the right choice}

## Browser Mode (Default)

### Inputs
{What the user needs to provide — file upload, text input, colour picker, etc.}

### Steps
1. Navigate to https://delphi.tools/tools/{tool-id}
2. {Step-by-step browser instructions}
3. ...

### Outputs
{What the tool produces — downloaded file, copied text, visual preview, etc.}

### Options
{Configurable settings — format, quality, size, etc.}

## Advanced Mode (Node.js/CLI)

### Library
{npm package name and version}

### Quick Recipe
```js
{Minimal working code}
```

### Notes
{ESM vs CJS, polyfills needed, gotchas}
```

### Browser Automation Patterns

The `references/browser-automation-patterns.md` should document reusable Playwright MCP patterns for:

| Pattern | Tools That Use It | Playwright Approach |
|---------|------------------|-------------------|
| **Text input** | colour-converter, encoder, regex-tester, algebra-calc, word-counter | `browser_fill_form` on the textbox |
| **File upload** | social-cropper, image-converter, pdf-preflight, imposer, svg-optimiser | `browser_file_upload` on the drop zone |
| **Colour picker** | contrast-checker, tailwind-shades, harmony-genny, gradient-genny | `browser_fill_form` on the hex input field |
| **Slider adjustment** | qr-genny (size, padding), image-converter (quality), imposer (margins) | `browser_click` on slider + `browser_press_key` |
| **Download result** | Most tools | `browser_click` on the download button; file saves to default downloads dir |
| **Copy result** | colour-converter, encoder, meta-tag-genny | `browser_click` on copy button; result goes to clipboard |
| **Tab/mode selection** | encoder (Base64/URL/Hash), qr-genny (Single/vCard/Batch), algebra-calc (Simplify/Expand/...) | `browser_click` on the tab trigger |

### Version Tracking

Since the repo has **no tags or releases**, the skill should track by commit hash:

```markdown
## Current Tracked Version

**Commit:** 12919e0
**Date:** 2026-04-10
**Tools:** 47

### Download

git clone https://github.com/1612elphi/delphitools.git
cd delphitools
git checkout 12919e0

# Or download as archive:
curl -L https://github.com/1612elphi/delphitools/archive/12919e0.tar.gz -o delphitools.tar.gz
```

When the repo adds proper tags/releases, the skill should switch to tracking those.

---

## Tool Categorisation by Interaction Pattern

This categorisation informs how browser guidance and advanced-mode scripts are structured:

### Text-In, Text-Out (13 tools)

These tools accept text input and produce text output. Easiest for both browser automation and headless use.

| Tool | Input | Output |
|------|-------|--------|
| `colour-converter` | Colour value (hex, rgb, etc.) | All colour formats |
| `contrast-checker` | Two colours | WCAG ratio and grade |
| `tailwind-shades` | Base colour | 50-950 shade scale |
| `harmony-genny` | Base colour | Harmony set |
| `px-to-rem` | Pixel value | REM value |
| `line-height-calc` | Font size | Optimal line height |
| `typo-calc` | Value in one unit | Value in other units |
| `base-converter` | Number | Number in other bases |
| `time-calc` | Timestamp or date | Converted value |
| `unit-converter` | Value + unit | Converted value |
| `encoder` | Text | Base64 / URL-encoded / hash |
| `regex-tester` | Pattern + test string | Matches |
| `sci-calc` | Expression | Result |

### Text-In, Rich-Out (5 tools)

Accept text, produce visual or structured output.

| Tool | Input | Output |
|------|-------|--------|
| `algebra-calc` | Expression | LaTeX-rendered result |
| `graph-calc` | Function(s) | Plotted graph |
| `qr-genny` | URL/text/vCard | Styled QR code (PNG/SVG) |
| `code-genny` | Data string | Barcode (PNG/SVG) |
| `meta-tag-genny` | Page metadata fields | HTML meta tags |

### File-In, File-Out (14 tools)

Accept file upload, produce processed file.

| Tool | Input | Output |
|------|-------|--------|
| `svg-optimiser` | SVG file or paste | Optimised SVG |
| `image-converter` | Image file(s) | Converted image(s) |
| `image-splitter` | Image | Grid tiles (ZIP) |
| `image-tracer` | Raster image | SVG vector |
| `image-clipper` | PNG with transparency | Trimmed PNG |
| `favicon-genny` | Image | Favicon files |
| `social-cropper` | Image | Cropped image |
| `matte-generator` | Image | Image on matte |
| `scroll-generator` | Image | Carousel slides |
| `watermarker` | Image + watermark | Watermarked image |
| `artwork-enhancer` | Image | Enhanced image |
| `background-remover` | Image | Image with background removed |
| `imposer` | PDF | Imposed PDF |
| `zine-imposer` | Image or PDF | Zine layout PDF |

### File-In, Analysis-Out (2 tools)

Accept file, produce analysis report.

| Tool | Input | Output |
|------|-------|--------|
| `pdf-preflight` | PDF | Print-readiness report |
| `font-explorer` | Font file | Font metadata + glyph table |

### Reference/Browse (6 tools)

No input needed — browse or look up data.

| Tool | What It Provides |
|------|-----------------|
| `paper-sizes` | Paper dimension reference table |
| `palette-collection` | Curated colour palette library |
| `glyph-browser` | Unicode character search |
| `tailwind-cheatsheet` | Tailwind CSS class reference |
| `markdown-writer` | Text editor with tools |
| `guillotine-director` | Step-by-step cutting guide |

### Interactive/Generative (3 tools)

Interactive tools that generate output through UI manipulation.

| Tool | Interaction |
|------|------------|
| `palette-genny` | Generate → regenerate → customise → export |
| `gradient-genny` | Add/remove/drag colour stops → export CSS/PNG |
| `colorblind-sim` | Upload image → view through different vision types |

### Specialised (3 tools)

| Tool | Interaction |
|------|------------|
| `paste-image` | Paste from clipboard → download |
| `shavian-transliterator` | Type English → see Shavian script |
| `word-counter` | Paste/type text → see stats |

---

## Licensing Notes

- **All code:** MIT license
- **BRIA RMBG-1.4 model** (used by Background Remover): **CC BY-NC-ND 4.0** — non-commercial use only. This is the only non-MIT component. ([Source](https://huggingface.co/briaai/RMBG-1.4))

---

## Self-Hosting (Advanced Mode)

### Build Locally

```bash
git clone https://github.com/1612elphi/delphitools.git
cd delphitools
bun install          # or: npm install
bun run build        # or: npm run build — produces out/ directory
```

The `out/` directory is a fully self-contained static site. Serve it with any static file server:

```bash
npx serve out        # or: python3 -m http.server 3000 -d out
```

### Requirements

- Node.js 20+ (or Bun)
- ~700MB disk for `node_modules` (mostly ML model in `@huggingface/transformers`)
- No runtime server — everything is static files

---

## Action Plan for Skill Implementation

### Phase 1: Skeleton and Core (estimated 47 files)

1. Write `SKILL.md` with tool quick-reference table and mode selection
2. Write `README.md` with design decisions
3. Create `references/tools/` with 47 per-tool reference files (templated, then customised)
4. Create `references/advanced-mode.md` with git clone + build instructions
5. Create `references/browser-automation-patterns.md`
6. Create `references/version-tracking.md` pinned to commit `12919e0`

### Phase 2: Wrapper Scripts (estimated 8 scripts)

Write `scripts/` wrapper scripts for the tools with extractable library logic:
- `build-local.sh` — clone + install + build
- `serve-local.sh` — serve static export
- `optimize-svg.mjs` — svgo wrapper
- `generate-qr.mjs` — qr-code-styling wrapper (needs jsdom + canvas shims)
- `generate-barcode.mjs` — bwip-js wrapper
- `create-pdf.mjs` / `impose-pdf.mjs` — pdf-lib wrappers
- `trace-image.mjs` — imagetracerjs wrapper
- `algebra.mjs` — nerdamer wrapper
- `encode.mjs` — crypto-js + built-in encoding wrapper

### Phase 3: Testing and Validation

1. Trigger test: ask "optimise this SVG" — should load skill and guide to browser tool
2. Browser automation test: walk through 3 tools via Playwright MCP
3. Advanced mode test: run each wrapper script
4. Version tracking test: verify download URL produces working build

---

## Sources

### Primary
- [1612elphi/delphitools](https://github.com/1612elphi/delphitools) — 307 stars, MIT, last push 2026-04-10
- [delphi.tools](https://delphi.tools) — live site (also at [tools.rmv.fyi](https://tools.rmv.fyi))

### Project Documentation
- [CONTRIBUTING.md](https://github.com/1612elphi/delphitools/blob/main/CONTRIBUTING.md) — project philosophy: local, private, static
- [ACKNOWLEDGEMENTS.md](https://github.com/1612elphi/delphitools/blob/main/ACKNOWLEDGEMENTS.md) — dependencies and licensing (BRIA model CC BY-NC-ND 4.0)

### Previous Research
- `DOSSIER-DelphiTools-Headless-Feasibility-2026-04-08.md` — headless library testing results (all npm libraries verified working in Node.js)
