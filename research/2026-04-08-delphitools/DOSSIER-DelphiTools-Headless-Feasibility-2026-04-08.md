# DelphiTools: Headless Feasibility for AI Agent Skills

**Date:** 2026-04-08
**Author:** Claude Code (research commissioned by Max Albrecht)
**Status:** Research complete — ready for skill implementation

---

## Key Concepts

| Term | What it is | Learn more |
|------|-----------|------------|
| **[DelphiTools](https://tools.rmv.fyi)** | Collection of 47 browser-based design utilities. 100% client-side, no server, no tracking. | [GitHub](https://github.com/1612elphi/delphitools) |
| **Headless execution** | Running browser tool logic in Node.js without a browser DOM. The key question for this skill. | [Node.js docs](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) |
| **Canvas polyfill** | The `canvas` npm package provides HTML Canvas API in Node.js via native bindings. | [npm: canvas](https://www.npmjs.com/package/canvas) |
| **CDP** | Chrome DevTools Protocol — how Playwright MCP controls a browser. Required for browser-only tools. | [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) |
| **SVGO** | SVG Optimizer — the library behind DelphiTools' SVG Optimiser. Has a Node.js API separate from its browser entry point. | [GitHub](https://github.com/svg/svgo) |

---

## Management Summary

### Top-Level Finding

**34 of 47 tools (72%) can be fully replicated headlessly in Node.js** — either via the same underlying library or equivalent pure computation. The remaining 13 tools are custom Canvas code with no external library dependency, making them genuinely browser-only.

### Recommendations for Skill Design

| Priority | Recommendation | Rationale |
|----------|---------------|-----------|
| **1. Library recipes as primary** | Write Node.js recipes for the 13 tools that wrap npm libraries | Direct API access is faster, scriptable, and works in all AI environments |
| **2. Pure-math reference for 20 tools** | Document the algorithms (WCAG contrast, unit conversion, colour math) — not libraries | These are trivial computations any agent can implement inline |
| **3. Playwright MCP as escape hatch** | Provide browser automation recipes only for the 13 Canvas-only tools + 1 ML tool | Last resort — brittle, requires CDP setup, but covers the full 47 |

**Recommendation:** Build the skill in three layers. Layer 1 (SKILL.md): Quick-reference table mapping each tool to its headless approach, plus inline recipes for the 5 most useful libraries (svgo, pdf-lib, bwip-js, qr-code-styling, nerdamer). Layer 2 (references/node-recipes.md): Extended recipes for all 13 library-backed tools. Layer 3 (references/browser-automation.md): Playwright MCP patterns for genuinely browser-only tools. This mirrors the pandoc skill's progressive disclosure pattern.

---

## Tool Inventory

### Complete Catalog (47 tools, 8 categories)

#### Social Media (4 tools)

| Tool ID | Name | Description |
|---------|------|-------------|
| `social-cropper` | Social Media Cropper | Crop images for Instagram, Bluesky, Threads |
| `matte-generator` | Matte Generator | Place non-square images on a square matte |
| `scroll-generator` | Seamless Scroll Generator | Split images for Instagram carousel scrolls |
| `watermarker` | Watermarker | Add watermarks to images |

#### Colour (8 tools)

| Tool ID | Name | Description |
|---------|------|-------------|
| `colour-converter` | Colour Converter | Convert between HEX, RGB, HSL, LAB, LCH, OKLAB, OKLCH |
| `tailwind-shades` | Tailwind Shade Generator | Generate Tailwind CSS colour scales |
| `harmony-genny` | Harmony Generator | Generate colour harmonies (complementary, triadic, etc.) |
| `palette-genny` | Palette Generator | Generate palettes with 20+ strategies (mood, era, nature, colour theory) |
| `palette-collection` | Palette Collection | Browse curated colour palettes (10 categories, 30+ palettes) |
| `contrast-checker` | Contrast Checker | Check WCAG colour contrast compliance |
| `colorblind-sim` | Colour Blindness Simulator | Simulate colour blindness types |
| `gradient-genny` | Gradient Generator | Create linear, corner, and mesh CSS gradients |

#### Images and Assets (9 tools)

| Tool ID | Name | Description |
|---------|------|-------------|
| `favicon-genny` | Favicon Generator | Generate multi-size favicons from any image |
| `svg-optimiser` | SVG Optimiser | Optimise and minify SVG files via SVGO |
| `placeholder-genny` | Placeholder Generator | Generate placeholder images for mockups |
| `image-splitter` | Image Splitter | Split images into grid tiles |
| `image-converter` | Image Converter | Convert between PNG, JPEG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS |
| `artwork-enhancer` | Artwork Enhancer | Add colour noise overlay to artwork |
| `background-remover` | Background Remover | Remove backgrounds via BRIA RMBG-1.4 ML model (Beta) |
| `image-tracer` | Image Tracer | Trace raster images to SVG vectors via imagetracerjs |
| `paste-image` | Paste Image | Paste and download clipboard images |

#### Typography and Text (7 tools)

| Tool ID | Name | Description |
|---------|------|-------------|
| `px-to-rem` | PX to REM | Convert pixels to rem units |
| `line-height-calc` | Line Height Calculator | Calculate optimal line heights |
| `typo-calc` | Typography Calculator | Convert between agates, ciceros, picas, pt, inches, mm |
| `paper-sizes` | Paper Sizes | Reference table of standard paper dimensions |
| `word-counter` | Word Counter | Count words, characters, sentences, reading time |
| `glyph-browser` | Glyph Browser | Browse and search Unicode glyphs |
| `font-explorer` | Font File Explorer | Explore font file contents |

#### Print and Production (4 tools)

| Tool ID | Name | Description |
|---------|------|-------------|
| `pdf-preflight` | PDF Preflight | Analyse PDFs for print-readiness issues |
| `guillotine-director` | Guillotine Director | Guided workflow for guillotine cutting |
| `zine-imposer` | Zine Imposer | Create 8-page mini-zine imposition layouts |
| `imposer` | Print Imposer | Impose PDF pages for booklet, saddle-stitch, N-up |

#### Other Tools (6 tools)

| Tool ID | Name | Description |
|---------|------|-------------|
| `markdown-writer` | Text Scratchpad | Text editor with manipulation utilities |
| `tailwind-cheatsheet` | Tailwind Cheat Sheet | Quick reference for Tailwind classes |
| `qr-genny` | QR Generator | Styled QR codes with custom colours, shapes, logos |
| `code-genny` | Barcode Generator | Data Matrix, Aztec, PDF417, Code 128, EAN-13, and more |
| `meta-tag-genny` | Meta Tag Generator | Generate HTML meta tags for SEO |
| `regex-tester` | Regex Tester | Test regular expressions with live feedback |

#### Calculators (7 tools)

| Tool ID | Name | Description |
|---------|------|-------------|
| `sci-calc` | Scientific Calculator | Full-featured calculator with history |
| `graph-calc` | Graph Calculator | Plot mathematical functions |
| `algebra-calc` | Algebra Calculator | Simplify, expand, factor, solve, derivatives, integrals |
| `base-converter` | Base Converter | Convert between decimal, hex, binary, octal |
| `time-calc` | Time Calculator | Unix timestamps, date arithmetic, timezone conversion |
| `unit-converter` | Unit Converter | Convert between length, weight, data units |
| `encoder` | Encoding Tools | Base64, URL encoding, hash generation (MD5, SHA-1/256/512) |

#### Turbo-nerd (1 tool)

| Tool ID | Name | Description |
|---------|------|-------------|
| `shavian-transliterator` | Shavian Transliterator | Transliterate English to Shavian alphabet |

---

## Architecture Analysis

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | [Next.js](https://nextjs.org/) | 16.1.6 |
| UI | [React](https://react.dev/) | 19.2.3 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.x |
| Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | Various |
| Icons | [Lucide React](https://lucide.dev/) | 0.562.0 |
| Build output | **Static HTML export** (`output: "export"`) | N/A |
| Package manager | Bun | N/A |

### Design Philosophy

From [CONTRIBUTING.md](https://github.com/1612elphi/delphitools/blob/main/CONTRIBUTING.md):

1. **No outside calls** — tools never phone home, fetch from APIs, or transmit user data
2. **No server components** — entire app compiles to static HTML
3. **All local, all private** — no analytics, tracking, cookies, logins, or telemetry
4. **UNIX philosophy** — each tool does one thing well

### Code Architecture

The `lib/` directory contains pure TypeScript computation modules explicitly separated from the React UI:

| File | Lines | Purpose |
|------|-------|---------|
| `lib/imposition.ts` | 690 | Print imposition geometry and page ordering. Comment: "No React, no UI, no PDF dependencies" |
| `lib/palette-strategies.ts` | 764 | 20+ palette generation strategies (colour theory, mood, era, nature) |
| `lib/palette-collection.ts` | ~200 | Curated palette data (10 categories) |
| `lib/paper-sizes.ts` | ~50 | Standard paper dimensions |
| `lib/colour-names.ts` | ~30 | Nearest-color name lookup (wraps color-name-list) |
| `lib/shavian/` | ~500 | Shavian transliteration (pure TS) |

---

## Headless Feasibility Matrix

### Tool Classification

| Category | Count | Description | Headless Approach |
|----------|-------|-------------|-------------------|
| **Pure JS/React** | 20 | No Canvas, no external library | Implement the algorithm inline |
| **External lib only** | 5 | Uses npm library, no Canvas | Use the same npm library in Node.js |
| **External lib + Canvas** | 8 | Uses npm library + Canvas for rendering | Library works headless; Canvas needs polyfill |
| **Canvas only** | 13 | Custom Canvas code, no external library | Browser-only: Playwright MCP or `sharp` |

### Per-Tool Headless Status

| Tool ID | Library | Headless? | Approach |
|---------|---------|-----------|----------|
| `svg-optimiser` | svgo 4.0 | **Yes** | `optimize(svg, opts)` — use `svgo` not `svgo/browser` |
| `sci-calc` | mathjs 15.1 | **Yes** | `evaluate('sqrt(16) + 2^3')` |
| `algebra-calc` | nerdamer 1.1 + katex | **Yes** | `nerdamer('expr').expand()` + `katex.renderToString()` |
| `encoder` | crypto-js 4.2 | **Yes** | `CryptoJS.SHA256()` or Node.js built-in `crypto` |
| `paper-sizes` | pdf-lib 1.17 | **Yes** | PDF creation headless |
| `qr-genny` | qr-code-styling 1.9 | **Yes** | With `canvas` npm polyfill |
| `code-genny` | bwip-js 4.8 | **Yes** | `toBuffer(opts, cb)` for PNG, `toSVG(opts)` for vector |
| `image-tracer` | imagetracerjs 1.2 | **Yes** | `imagedataToSVG(rawImageData)` — no Canvas needed |
| `imposer` | pdf-lib + pdfjs-dist | **Yes** | All PDF ops work headlessly |
| `zine-imposer` | pdf-lib | **Yes** | Same as imposer |
| `pdf-preflight` | pdfjs-dist 5.4 | **Yes** | Text extraction + metadata headless |
| `image-converter` | gifenc + utif + jszip | **Partial** | GIF/TIFF/ZIP work; format conversion needs `sharp` |
| `background-remover` | @huggingface/transformers | **Partial** | `@imgly/background-removal-node` — 88MB model download |
| `colour-converter` | (pure math) | **Trivial** | hex to rgb to hsl to lab to oklch — all formulae |
| `contrast-checker` | (pure math) | **Trivial** | WCAG luminance formula: ~20 lines of code |
| `tailwind-shades` | (pure math) | **Trivial** | Use `culori` npm for OKLCH shade generation |
| `harmony-genny` | (pure math) | **Trivial** | Colour wheel rotations |
| `base-converter` | (pure math) | **Trivial** | `parseInt(n, base).toString(targetBase)` |
| `time-calc` | (pure math) | **Trivial** | `Date` + `Intl.DateTimeFormat` |
| `unit-converter` | (pure math) | **Trivial** | Multiplication by conversion factors |
| `word-counter` | (pure math) | **Trivial** | String splitting + regex |
| `px-to-rem` | (pure math) | **Trivial** | Division by base font size |
| `regex-tester` | (pure math) | **Trivial** | `new RegExp().exec()` |
| `meta-tag-genny` | (string templates) | **Trivial** | Template string assembly |
| `social-cropper` | (Canvas) | **Browser** | Use `sharp` for headless crop |
| `matte-generator` | (Canvas) | **Browser** | Use `sharp` for headless compositing |
| `watermarker` | (Canvas) | **Browser** | Use `sharp` for headless text overlay |
| `image-splitter` | (Canvas) | **Browser** | Use `sharp` for headless grid slicing |
| `favicon-genny` | (Canvas) | **Browser** | Use `sharp` for headless resize |
| `artwork-enhancer` | (Canvas) | **Browser** | Canvas noise overlay |
| `placeholder-genny` | (Canvas) | **Browser** | Use `sharp` for headless solid + text |
| `colorblind-sim` | (Canvas) | **Browser** | Canvas pixel colour transform |
| `gradient-genny` | (Canvas) | **Browser** | Canvas gradient rendering |
| `scroll-generator` | (Canvas) | **Browser** | Canvas image slicing |
| `paste-image` | (DOM) | **Browser** | Clipboard API — inherently interactive |
| `graph-calc` | (Canvas/SVG) | **Browser** | function-plot/mafs for visual graphing |
| `shavian-transliterator` | (Canvas + lib/) | **Partial** | Transliteration logic headless; rendering needs Canvas |

---

## Verified Library Recipes

All recipes tested on Node.js v24.14.1, macOS Darwin 24.6.0 (Mac Mini M4 Pro).

### Tier A: Pure Node.js (11/11 PASS)

| Library | Version | Import | Key API | Output |
|---------|---------|--------|---------|--------|
| [svgo](https://github.com/svg/svgo) | 4.0.1 | ESM | `optimize(svg, opts)` | SVG string |
| [qrcode](https://www.npmjs.com/package/qrcode) | 1.5.4 | CJS | `QRCode.toString()` | Text/data URL |
| [pdf-lib](https://pdf-lib.js.org/) | 1.17.1 | ESM | `PDFDocument.create()` | PDF buffer |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | 5.6 | ESM | `getDocument()` via `legacy/build/pdf.mjs` | Extracted text |
| [bwip-js](https://github.com/metafloor/bwip-js) | 4.9.0 | CJS | `toBuffer(opts, cb)`, `toSVG(opts)` | PNG/SVG |
| [mathjs](https://mathjs.org/) | 15.2.0 | CJS | `evaluate(expr)` | Number |
| [nerdamer](https://nerdamer.com/) | 1.1.13 | CJS | `nerdamer(expr).expand()` | Expression |
| [crypto-js](https://github.com/brix/crypto-js) | 4.2.0 | CJS | `CryptoJS.SHA256(str)` | Hash |
| [jszip](https://stuk.github.io/jszip/) | 3.10.1 | CJS | `new JSZip()` | ZIP buffer |
| [gifenc](https://github.com/mattdesl/gifenc) | 1.0.3 | CJS | `GIFEncoder()` | GIF buffer |
| [imagetracerjs](https://github.com/nicpottier/imagetracerjs) | 1.2.6 | CJS | `imagedataToSVG(imgdata)` | SVG string |

### Tier B: With Polyfills (4/4 PASS)

| Library | What It Provides | Install Size | Notes |
|---------|-----------------|-------------|-------|
| [canvas](https://www.npmjs.com/package/canvas) | HTML Canvas polyfill | ~15MB | Enables qr-code-styling in Node.js |
| [sharp](https://sharp.pixelplumbing.com/) | Image processing | ~10MB | Resize, convert, composite, crop |
| [@imgly/background-removal-node](https://www.npmjs.com/package/@imgly/background-removal-node) | Background removal | 88MB model | Works but heavy — slow on CPU |
| [culori](https://culorijs.org/) | Colour manipulation | ~200KB | OKLCH-based shade generation |

### Tier C: Additional Headless Libraries (3/3 PASS)

| Library | Replaces | Key Finding |
|---------|----------|-------------|
| [katex](https://katex.org/) | LaTeX rendering | `renderToString()` produces HTML headlessly |
| [color-name-list](https://github.com/meodai/color-names) | Colour lookups | 31,898 named colours, nearest-match in Node.js |
| Node.js `crypto` | crypto-js | Built-in: `crypto.createHash('sha256').update(str).digest('hex')` |

---

## Important Notes

### svgo API Difference

DelphiTools imports `svgo/browser`. In Node.js, use `svgo` directly:

```js
import { optimize } from 'svgo'; // NOT 'svgo/browser'
const result = optimize(svgString, { multipass: true, plugins: ['preset-default'] });
```

### Licensing Restriction

The [BRIA RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) background removal model is licensed **CC BY-NC-ND 4.0** (not MIT). Commercial use is restricted. All other code is MIT.

### bwip-js API Note

The API uses `toBuffer(opts, callback)` (callback-based), not `toBufferSync()`. Also supports `toSVG(opts)` for vector output without native dependencies.

### pdfjs-dist Requires Legacy Build

The default `build/pdf.mjs` fails in Node.js with `ReferenceError: DOMMatrix is not defined`. Must import from `pdfjs-dist/legacy/build/pdf.mjs` instead. The package itself prints a warning recommending this.

### qr-code-styling Requires jsdom + canvas

`qr-code-styling` calls `window.document`, `window.Image`, and `window.XMLSerializer` at construction time. Requires both `jsdom` (for DOM globals) and `canvas` (for image rendering) as polyfills. Not just `canvas` alone.

### Tool Count Correction

The source code registry (`lib/tools.ts`) lists exactly **46 tools**, not 47. The QR Generator appears in both "Greatest Hits" and "Other Tools" on the homepage, creating the appearance of 47.

### Unused Packages

5 packages in `package.json` are installed but never imported in any source file: `function-plot`, `@xyflow/react`, `react-markdown`, `remark-gfm`, `qrcode` (plain — only `qr-code-styling` is used).

### Background Removal: @imgly vs @huggingface

| Approach | Install Size | Model Download | Runtime | Processing (100x100) |
|----------|-------------|---------------|---------|---------------------|
| `@imgly/background-removal-node` | 289MB (models bundled) | None needed | onnxruntime-node native | 721ms |
| `@huggingface/transformers` | 14MB + 210MB ort | ~88MB from HF Hub | onnxruntime-node native | Requires model cache |

`@imgly` is recommended for the skill: models are pre-bundled (no cold start), fully offline, and the input MUST be a `Blob` with explicit MIME type.

### Runtime Compatibility

| Environment | Pure JS libs | canvas/sharp | Playwright MCP |
|-------------|-------------|-------------|----------------|
| Claude Code terminal | Yes | Yes | Yes |
| claude.ai artifacts | Yes | No | No |
| ChatGPT code interpreter | Yes | No | No |
| Cursor terminal | Yes | Yes | Yes |

Pure-JS libraries (svgo, mathjs, nerdamer, crypto-js, jszip, pdf-lib, gifenc, imagetracerjs) work everywhere. Libraries needing native bindings (canvas, sharp) require a full terminal environment.

---

## Sources

### Primary Source
- [1612elphi/delphitools](https://github.com/1612elphi/delphitools) — 296 stars, MIT license, last push 2026-04-08

### Tested Libraries
- [svgo](https://github.com/svg/svgo) — [pdf-lib](https://github.com/Hopding/pdf-lib) — [bwip-js](https://github.com/metafloor/bwip-js) — [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) — [mathjs](https://github.com/josdejong/mathjs) — [nerdamer](https://github.com/jiggzson/nerdamer) — [sharp](https://github.com/lovell/sharp) — [imagetracerjs](https://github.com/nicpottier/imagetracerjs) — [katex](https://github.com/KaTeX/KaTeX) — [culori](https://github.com/Evercoder/culori)

### Project Documentation
- [CONTRIBUTING.md](https://github.com/1612elphi/delphitools/blob/main/CONTRIBUTING.md) — project philosophy
- [ACKNOWLEDGEMENTS.md](https://github.com/1612elphi/delphitools/blob/main/ACKNOWLEDGEMENTS.md) — dependency attribution and licensing
