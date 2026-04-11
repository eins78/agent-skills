# DelphiTools Advanced Mode

For developers who want programmatic access to DelphiTools' underlying libraries.

## Option 1: Download Pre-Built Bundle

Download a pre-built static site from GitHub Releases:

```bash
# Download latest bundle
gh release download --repo eins78/agent-skills --pattern 'delphitools-bundle-*.tgz' --output delphitools-bundle.tgz

# Extract and serve
mkdir delphitools-site && tar xzf delphitools-bundle.tgz -C delphitools-site
npx serve delphitools-site
# Open http://localhost:3000 in a browser
```

## Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/1612elphi/delphitools.git
cd delphitools

# Install dependencies (Bun recommended, npm also works)
bun install    # or: npm install

# Build the static site
bun run build  # or: npm run build

# The output is in the out/ directory
npx serve out
# Open http://localhost:3000 in a browser
```

**Requirements:** Node.js 20+ or Bun. About 700MB disk for node_modules.

## Option 3: Use Wrapper Scripts Directly

Wrapper scripts in this skill call the underlying npm libraries without needing the full DelphiTools site. Each script is self-contained.

| Script | What it does | Underlying library |
|--------|-------------|-------------------|
| `${CLAUDE_SKILL_DIR}/scripts/optimize-svg.mjs` | Optimise SVG files | svgo 4.x |
| `${CLAUDE_SKILL_DIR}/scripts/generate-qr.mjs` | Generate styled QR codes | qr-code-styling |
| `${CLAUDE_SKILL_DIR}/scripts/generate-barcode.mjs` | Generate barcodes (Code128, EAN-13, etc.) | bwip-js |
| `${CLAUDE_SKILL_DIR}/scripts/create-pdf.mjs` | Create PDF documents | pdf-lib |
| `${CLAUDE_SKILL_DIR}/scripts/impose-pdf.mjs` | Impose PDFs for booklet printing | pdf-lib + imposition logic |
| `${CLAUDE_SKILL_DIR}/scripts/trace-image.mjs` | Trace raster images to SVG | imagetracerjs |
| `${CLAUDE_SKILL_DIR}/scripts/algebra.mjs` | Symbolic algebra (simplify, solve, etc.) | nerdamer |
| `${CLAUDE_SKILL_DIR}/scripts/encode.mjs` | Base64, URL encoding, hashing | crypto-js + Node.js built-ins |

Run any script with `--help` to see usage:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/optimize-svg.mjs --help
```

**Note:** Scripts install their dependencies on first run if missing. First run may take a few seconds for npm install.

## Key API Differences from Browser

| Library | Browser import (DelphiTools uses) | Node.js import (use in scripts) |
|---------|----------------------------------|-------------------------------|
| svgo | `from "svgo/browser"` | `from "svgo"` |
| pdfjs-dist | `from "pdfjs-dist"` | `from "pdfjs-dist/legacy/build/pdf.mjs"` |
| bwip-js | `bwipjs.toCanvas()` | `bwipjs.toBuffer()` (callback) or `bwipjs.toSVG()` |
| qr-code-styling | Uses browser DOM | Needs `jsdom` + `canvas` polyfills |
| imagetracerjs | `imageToSVG(path)` | `imagedataToSVG(rawImageData)` — skip the browser Image API |

## Source Code Structure

The DelphiTools source has pure-computation modules in `lib/` that can be imported directly:

| Module | Lines | What it does |
|--------|-------|-------------|
| `lib/imposition.ts` | 690 | Print imposition geometry — no React, no UI, no PDF deps |
| `lib/palette-strategies.ts` | 764 | 20+ palette generation algorithms |
| `lib/colour-notation.ts` | ~100 | Colour format conversions (HEX, RGB, HSL, LAB, OKLCH) |
| `lib/paper-sizes.ts` | ~50 | Standard paper dimensions |
| `lib/shavian/` | ~500 | Shavian transliteration logic |

## Licensing Note

All code is MIT except the BRIA RMBG-1.4 model used by Background Remover, which is **CC BY-NC-ND 4.0** (non-commercial use only).
