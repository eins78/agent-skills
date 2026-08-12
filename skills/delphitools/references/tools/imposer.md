# Imposer

**Category:** Print and Production
**URL:** https://delphi.tools/tools/imposer
**Status:** new

## What It Does

Rearranges and lays out PDF pages for professional print impositions — booklet, saddle-stitch, and N-up — so that a printed and folded or stacked sheet produces pages in the correct reading order.

## When to Use

- You need to print a PDF as a folded booklet (saddle-stitch) and want pages automatically reordered for double-sided printing.
- You want to place multiple PDF pages per printed sheet (2-up, 4-up, 6-up, etc.) to save paper or prepare print-ready files.

## Browser Mode

### Inputs

- **PDF upload area** — drag-and-drop or click to upload a PDF file
- **Layout selector** dropdown — choose the imposition layout:
  - `2-up Saddle Stitch` — pairs pages for a folded booklet
  - `4-up` — four pages per sheet
  - `6-up` — six pages per sheet
  - `8-up` — eight pages per sheet
  - `9-up` — nine pages per sheet
- **Paper Size combobox** — searchable dropdown; common sizes include A4, A3, Letter, Legal, Tabloid; type to filter
- **Orientation selector** — `Portrait` or `Landscape`
- **Scaling selector** — `Fit` (scale pages down to fit), `Fill` (scale up to fill), or `Actual` (no scaling)
- **Duplex Flip selector** — `Long edge` (standard duplex) or `Short edge` (used for landscape flip)
- **Margins slider** — outer margin in millimetres
- **Gutter slider** — space between page cells in millimetres
- **Creep slider** — compensation offset in millimetres for the paper thickness in saddle-stitch folds (increase for thicker paper stacks)
- **Crop Marks toggle** — on/off; adds printer crop marks to the output
- **Blank Mode controls** — settings for how blank pages are inserted when the total page count does not divide evenly into the chosen layout

### Step-by-Step

1. Navigate to https://delphi.tools/tools/imposer
2. Upload your PDF using the upload area. The tool parses the file using pdfjs-dist and displays a canvas preview.
3. Select a **Layout** from the dropdown (e.g. `2-up Saddle Stitch` for a booklet).
4. Choose the **Paper Size** for the output sheet. Type into the combobox to search (e.g. type "A4").
5. Set **Orientation** to match your printer setup.
6. Choose **Scaling**: use `Fit` to ensure all content is visible.
7. Set **Duplex Flip** to match your printer's duplex setting (`Long edge` is the most common).
8. Adjust **Margins** and **Gutter** if needed (0 mm is a valid starting point).
9. If printing a saddle-stitch booklet with many pages, increase the **Creep** slider slightly to compensate for paper thickness.
10. Toggle **Crop Marks** on if sending to a print shop.
11. The canvas preview shows each imposed sheet with page numbers overlaid. Scroll through the preview to verify the layout.
12. Click the **Download** button to save the imposed PDF.
13. Click the **Print Guide** button to open a printable instruction sheet that explains how to fold and collate the output.

### Output

- Imposed PDF file, ready for double-sided printing
- Optional Print Guide (opens in browser for printing)

### Options

| Setting | Values | Default |
|---------|--------|---------|
| Layout | 2-up Saddle Stitch / 4-up / 6-up / 8-up / 9-up | 2-up Saddle Stitch |
| Paper Size | A4, A3, Letter, Legal, Tabloid, etc. | A4 |
| Orientation | Portrait / Landscape | Portrait |
| Scaling | Fit / Fill / Actual | Fit |
| Duplex Flip | Long edge / Short edge | Long edge |
| Margins | 0–30 mm | 0 mm |
| Gutter | 0–30 mm | 0 mm |
| Creep | 0–10 mm | 0 mm |
| Crop Marks | On / Off | Off |

## CLI Mode (Node.js)

The imposition geometry is implemented in `lib/imposition.ts` (690 lines, pure TypeScript, no React) within the DelphiTools source. PDF manipulation uses **pdf-lib 1.17.1** (ESM) and **pdfjs-dist**.

A ready-made wrapper script is available at `${CLAUDE_SKILL_DIR}/scripts/impose-pdf.mjs`.

```js
// Minimal example using pdf-lib directly
import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';

const sourcePdf = await PDFDocument.load(readFileSync('input.pdf'));
// See ${CLAUDE_SKILL_DIR}/scripts/impose-pdf.mjs for full imposition logic
// using lib/imposition.ts geometry calculations
```

Use the wrapper script for production use; the manual approach requires replicating the `lib/imposition.ts` layout geometry.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
