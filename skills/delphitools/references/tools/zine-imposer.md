# Zine Imposer

**Category:** Print and Production
**URL:** https://delphi.tools/tools/zine-imposer
**Status:** stable

## What It Does

Creates an 8-page mini-zine imposition layout from an image or PDF, arranging pages so that a single A4 or Letter sheet printed double-sided can be folded and cut into a pocket-sized zine.

## When to Use

- You have a set of images or a PDF and want to produce a fold-and-cut mini-zine without manual page reordering.
- You are running a zine-making workshop and need to generate print-ready sheets quickly.

## Browser Mode (Default)

### Inputs

- **File upload area** — drag-and-drop or click to upload an image (JPEG, PNG, WebP) or a PDF file

### Step-by-Step

1. Navigate to https://delphi.tools/tools/zine-imposer
2. Click the upload area or drag your file onto it.
   - For a **PDF**: the tool reads each page and maps them to the 8 zine positions automatically.
   - For an **image**: the tool uses the image as a single-panel spread or cover — check the preview to confirm placement.
3. The canvas preview shows how the pages will appear on the printed sheet, with fold and cut lines indicated.
4. Verify that pages appear in the correct positions. The standard 8-page zine imposition order (front-to-back reading) is: back cover, pages 2–3, pages 4–5, pages 6–7, front cover — rearranged across two sides of one sheet.
5. Click the **Download** button to save the imposed PDF, ready for double-sided printing.

### Output

An imposed PDF file. Print double-sided, fold in half lengthwise, then fold in half again, make one cut along the centre fold, and fold into a booklet.

### Options

No configurable settings beyond the source file upload — the tool applies the standard 8-page mini-zine layout automatically.

## Advanced Mode (Node.js/CLI)

Use **pdf-lib** in Node.js to build a custom imposition. A base script is available at `${CLAUDE_SKILL_DIR}/scripts/create-pdf.mjs` as a starting point.

For full layout geometry, clone the DelphiTools source and use `lib/imposition.ts` directly:

```js
import { PDFDocument, degrees } from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';

// Load source PDF
const srcBytes = readFileSync('source.pdf');
const srcDoc = await PDFDocument.load(srcBytes);
const outDoc = await PDFDocument.create();

// Standard 8-page zine imposition order (0-indexed source pages):
// Sheet front (left to right, top to bottom): [6, 3, 2, 5]  (some rotated 180°)
// Sheet back  (left to right, top to bottom): [0, 7, 4, 1]  (some rotated 180°)
// See ${CLAUDE_SKILL_DIR}/scripts/create-pdf.mjs for the full compositing logic

writeFileSync('zine-imposed.pdf', await outDoc.save());
```

Refer to `${CLAUDE_SKILL_DIR}/scripts/create-pdf.mjs` for the complete working implementation, or use `lib/imposition.ts` from the DelphiTools source for verified layout geometry.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
