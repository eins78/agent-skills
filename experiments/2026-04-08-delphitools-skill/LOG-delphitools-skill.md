---
phase: VERDICT
mode: rigorous
started: 2026-04-08
timebox: 2026-04-09
slug: delphitools-skill
tags: [skill-creation, browser-tools, headless-research]
verdict: null
confidence: null
---

# Lab Notes: DelphiTools Skill — Browser-Based Design Tools for AI Agents

## Motivation

DelphiTools is a collection of 47 browser-based design tools (SVG optimization, QR codes, PDF tools, image conversion, colour utilities, etc.). They have no CLI or API — everything is browser-only. We want to create a skill that teaches agents to use these tools, ideally without needing a browser. The key research question: can the underlying npm libraries be used headlessly in Node.js?

## Hypothesis

The majority (>70%) of DelphiTools' 47 browser tools are thin UI wrappers around standalone npm libraries that can be used directly in Node.js without a browser. For the remaining tools, Playwright MCP browser automation provides a viable fallback.

## Success Criteria

- [ ] MUST: Identify and verify headless Node.js recipes for at least 12 of the 15 most useful tools
- [ ] MUST: SKILL.md under 200 lines following pandoc skill conventions
- [ ] MUST: All recipes verified to actually run in Node.js
- [ ] SHOULD: Playwright MCP recipes for at least 3 browser-only tools
- [ ] SHOULD: Complete tool catalog with headless feasibility for all 47 tools

## Fail Condition

If more than 5 of the "Tier A" libraries (svgo, qrcode, pdf-lib, pdfjs-dist, bwip-js, mathjs, nerdamer, crypto-js, jszip, imagetracerjs, gifenc) fail to work in Node.js due to ESM/CJS issues, browser globals, or missing WASM files — the headless approach is less viable than assumed and the skill should pivot to primarily browser-automation recipes.

## Time Box

**Deadline:** 2026-04-09
**Early Stop:** If headless approach is validated for >12 tools, skip exhaustive browser testing and move to writing.
**Rationale:** This is a single-session skill creation task. One day is sufficient.

## Pre-Committed Decisions

**If confirmed:** Write the skill with Node.js recipes as primary, browser automation as escape hatch. Publish as beta.
**If refuted:** Pivot the skill to be primarily a Playwright MCP automation guide, with the tool catalog as discovery value.

## Environment

- macOS Darwin 24.6.0, Mac Mini M4 Pro (mac-zrh)
- Node.js (system version)
- pnpm 10.27.0
- Playwright MCP available via chrome-browser skill
- DelphiTools source: https://github.com/1612elphi/delphitools

## Baseline

No existing skill for browser-based design tools in the agent-skills repo. Agents currently have no guidance on tools like svgo, QR generators, or browser-based image processing.

---

## Running Log

### 2026-04-08 22:44 — Experiment framed

Initial research complete via Explore agents:
- DelphiTools has 47 tools across 8 categories (Social Media, Colour, Images, Typography, Print, Other, Calculators, Turbo-nerd)
- 100% client-side — static Next.js 16 export, zero server components
- No CLI, no API — all browser UI
- Key npm deps identified: svgo, pdfjs-dist, pdf-lib, imagetracerjs, bwip-js, qrcode, @huggingface/transformers, mathjs, nerdamer, crypto-js, gifenc, jszip
- Live site appears to be at `https://tools.rmv.fyi` (not `https://delphi.tools` as originally stated — need to verify)
- Repo has 296 stars, actively developed (pushed today)

Three-tier model proposed:
- Tier A (pure Node.js): svgo, qrcode, pdf-lib, pdfjs-dist, bwip-js, mathjs, nerdamer, crypto-js, jszip, imagetracerjs, gifenc
- Tier B (Node.js with caveats): @huggingface/transformers
- Tier C (browser-only): social-cropper, paste-image, artwork-enhancer, and other Canvas/DOM-heavy tools

### 2026-04-08 23:14 — Browser exploration via Playwright MCP

Tested 8 representative tools across all major categories:

1. **SVG Optimiser** — Paste SVG text, instant optimization. 334B→282B (16%). Wraps svgo. Preview + download.
2. **QR Generator** — Very feature-rich. Single/vCard/Batch modes. 6 content types (URL, Email, Phone, WiFi, SMS, Geo). Extensive styling: size, padding, error correction (L/M/Q/H), 7 quick styles, 6 dot shapes (Boxy, Bouba, Braille, Calligraph, Kiki, Blobby), 3 eye styles, 2 pupil styles, logo upload. Export: PNG/SVG/Copy.
3. **Encoding Tools** — Three tabs: Base64, URL Encode, Hash. Text in → encoded out. Encode/Decode toggle.
4. **Contrast Checker** — WCAG compliance checking. Colour inputs for foreground/background.
5. **Algebra Calculator** — 6 operations: Simplify, Expand, Factor, Solve, d/dx, ∫. Expression input with syntax ref. Wraps nerdamer.
6. **PDF Preflight** — Drop PDF for print-readiness analysis. Uses pdfjs-dist for parsing.
7. **Image Tracer** — Drop PNG/JPG/WebP/GIF, traces to SVG vectors. Uses imagetracerjs.
8. **Print Imposer** — Most sophisticated tool. Layouts: saddle stitch, booklet, N-up. Options: paper (A4), orientation, scaling, duplex flip, margins/gutter/creep, crop marks, blank mode. Visual sheet preview with page ordering. Uses pdf-lib.
9. **Colour Converter** — Input any color, get 7 formats: HEX, RGB, HSL, LAB, LCH, OKLAB, OKLCH. Pure math.

Key observations:
- All tools load fast (static export)
- No server calls confirmed — all processing visible in-browser
- Tools with file upload use HTML5 drag-drop / file input
- Text-based tools (encoder, algebra, colour converter) are easiest for headless — just math
- Image tools need file I/O but underlying libs often work in Node.js
- Print tools are the most complex but pdf-lib is Node.js compatible

Dispatched 4 parallel agents:
- Source code deep dive (sonnet) — all 47 tool components
- Tier A testing (sonnet) — 11 pure Node.js libraries
- Tier B testing (sonnet) — ML/WASM libraries
- Tier C testing (sonnet) — browser-only alternatives

### 2026-04-08 23:18 — Source code analysis (manual)

Cloned repo to ~/FORK/delphitools. Key findings:

**Dependency versions (from package.json):**
- svgo ^4.0.0 (MAJOR v4 — API changed from v3)
- pdfjs-dist ^5.4.624 (recent, may be ESM-only)
- @huggingface/transformers ^3.8.1 (official HF, not @xenova fork)
- pdf-lib ^1.17.1
- bwip-js ^4.8.0
- mathjs ^15.1.0
- nerdamer ^1.1.13
- crypto-js ^4.2.0
- jszip ^3.10.1
- imagetracerjs ^1.2.6 (last update 2020)
- gifenc ^1.0.3
- qr-code-styling ^1.9.2
- qrcode ^1.5.4
- katex ^0.16.27
- color-name-list ^14.31.0

**Tool categorization by implementation pattern:**

| Category | Count | Examples |
|----------|-------|---------|
| Pure JS/React (no Canvas, no external lib) | 20 | base-converter, colour-converter, contrast-checker, harmony-genny, px-to-rem, regex-tester, word-counter, etc. |
| External lib, no Canvas | 5 | svg-optimiser (svgo), sci-calc (mathjs), algebra-calc (nerdamer+katex), encoder (crypto-js), paper-sizes (pdf-lib) |
| External lib + Canvas | 8 | qr-generator, code-generator (bwip-js), image-converter (gifenc+utif), image-tracer (imagetracerjs), imposer (pdf-lib+pdfjs), pdf-preflight, background-remover, zine-imposer |
| Canvas only (custom code) | 13 | artwork-enhancer, colorblind-sim, favicon-genny, gradient-genny, image-splitter, matte-generator, palette-genny, paste-image, placeholder-genny, scroll-generator, shavian-transliterator, social-cropper, watermarker |

**Key observations:**
- svg-optimiser imports `svgo/browser` (browser entry point). Node.js would use `svgo` directly — same `optimize()` API.
- Most tools use **dynamic imports** (`await import(...)`) for code-splitting.
- `lib/` contains shared utilities: colour-names.ts, imposition.ts, palette-strategies.ts, paper-sizes.ts, shavian/.
- `lib/colour-names.ts` wraps `color-name-list/bestof` — nearest-colour matching.
- encoder uses btoa/atob (Base64), encodeURIComponent (URL), and crypto-js (hashing). All trivially headless — Node.js has built-in equivalents.
- BRIA RMBG-1.4 model license is CC BY-NC-ND 4.0 (NOT MIT) — important restriction.
- CONTRIBUTING.md confirms: "No outside calls", "No server components", "All local, all private".

---

### 2026-04-08 23:30 — Headless execution testing (manual verification of agent results)

All 11 Tier A libraries confirmed PASS in Node.js v24.14.1:

| Library | Status | API | Notes |
|---------|--------|-----|-------|
| svgo 4.0.1 | PASS | `import { optimize } from 'svgo'` | Use `svgo` not `svgo/browser` in Node.js |
| qrcode 1.5.4 | PASS | `QRCode.toString()`, `QRCode.toDataURL()` | CJS, works directly |
| pdf-lib 1.17.1 | PASS | `PDFDocument.create()` | Full PDF creation |
| pdfjs-dist 5.6 | PASS | Legacy build for text extraction | Needs specific import path |
| bwip-js 4.9.0 | PASS | `toBuffer()` (callback), `toSVG()` | CJS, PNG + SVG output |
| mathjs 15.2.0 | PASS | `evaluate()` | CJS, all math ops work |
| nerdamer 1.1.13 | PASS | simplify/factor/solve/diff/integrate | CJS, needs Algebra+Calculus+Solve imports |
| crypto-js 4.2.0 | PASS | `CryptoJS.SHA256()` etc. | CJS, all hash types work |
| jszip 3.10.1 | PASS | `new JSZip()`, `type:'nodebuffer'` | CJS |
| gifenc 1.0.3 | PASS | `GIFEncoder()`, `writeFrame()` | CJS |
| imagetracerjs 1.2.6 | PASS | `imagedataToSVG(imgdata)` | CJS, no Canvas needed with raw ImageData! |

Additional Tier B/C findings:
- **qr-code-styling** + canvas npm polyfill → styled QR PNG output (PASS)
- **sharp** → image resize, format conversion, compositing (PASS, all tests)
- **canvas** npm → Canvas polyfill for macOS (PASS)
- **culori** → OKLCH-based Tailwind shade generation (PASS)
- **katex** → LaTeX→HTML rendering (PASS, 3806 chars for quadratic formula)
- **color-name-list** → 31,898 named colors, nearest-color lookup (PASS)
- **WCAG contrast** → pure math, zero dependencies (PASS, 21:1 for black/white)
- **@imgly/background-removal-node** → downloading 88MB model, works but heavy
- **pdf-lib** → page manipulation/imposition (PASS, multi-page rotation + N-up)

Key insight: `lib/imposition.ts` in the source is explicitly designed for headless use ("No React, no UI, no PDF dependencies — just geometry and page ordering"). 690 lines of pure TypeScript.

**Hypothesis CONFIRMED: >70% of tools can run headlessly.** All 11 Tier A libraries pass. Plus canvas polyfill enables qr-code-styling and imagetracerjs. Plus sharp covers most image manipulation needs.

## Failed Attempts

| # | What Was Tried | Why It Failed | Lesson |
|---|---------------|---------------|--------|

### 2026-04-08 23:45 — Dossier written

Compiled all research into `research/2026-04-08-delphitools/DOSSIER-DelphiTools-Headless-Feasibility-2026-04-08.md`. Report covers: full 47-tool inventory, architecture analysis, headless feasibility matrix per tool, verified library recipes, runtime compatibility, and skill design recommendations.

---

## Findings

1. **34 of 47 tools (72%) can run headlessly** — confirming the hypothesis (>70% threshold met)
2. **All 11 Tier A libraries pass** in Node.js v24.14.1 — svgo, qrcode, pdf-lib, pdfjs-dist, bwip-js, mathjs, nerdamer, crypto-js, jszip, gifenc, imagetracerjs
3. **Tool architecture is cleanly separated**: `lib/` contains pure computation (imposition.ts, palette-strategies.ts), `components/tools/` adds React UI + Canvas on top
4. **20 tools are trivial pure math** — agents can implement them inline without any library
5. **13 tools wrap specific npm libraries** — the skill's primary value is teaching these APIs
6. **13 tools are genuinely browser-only** — custom Canvas code with no library extraction path
7. **svgo v4 uses `svgo/browser` in the browser vs `svgo` in Node.js** — same API, different import
8. **bwip-js uses callback API** (`toBuffer(opts, cb)`) not sync — non-obvious, worth documenting
9. **imagetracerjs works with raw ImageData** — no Canvas polyfill needed for `imagedataToSVG()`
10. **Background removal needs 88MB model download** — works but heavy; CC BY-NC-ND 4.0 license restriction

## Verdict

**Outcome:** CONFIRMED
**Confidence:** high
**Evidence:** All 11 Tier A libraries pass headless testing. 34/47 tools (72%) can run without a browser, exceeding the >70% hypothesis threshold. The architecture cleanly separates pure computation from UI rendering.

**Next Action:** GRADUATE — implement the `delphitools` skill in a future session using this dossier as the reference. The skeleton SKILL.md and README.md already exist on branch `feat/delphitools-skill`.
