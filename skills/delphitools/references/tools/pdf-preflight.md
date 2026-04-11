# PDF Preflight

**Category:** Print and Production
**URL:** https://delphi.tools/tools/pdf-preflight
**Status:** new

## What It Does

Analyses a PDF file for print-readiness issues and produces a structured preflight report with issues categorised as error, warning, or info across six categories: document, geometry, fonts, colour, images, and transparency.

## When to Use

- You need to check a PDF before sending it to a print provider.
- You want to verify that bleed, trim boxes, fonts, colour profiles, and image resolution are correct.
- You need a page-by-page view of preflight issues with visual overlays.

## Browser Mode (Default)

### Inputs

- **PDF file upload button** — click to select a PDF file from disk, or drag-and-drop onto the upload zone.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/pdf-preflight
2. Click the upload button or drag a PDF onto the upload zone.
3. The tool analyses the PDF using pdfjs-dist (page rendering) and pdf-lib (metadata extraction).
4. The preflight report appears, showing a summary count of errors, warnings, and info items.
5. The report is divided into six sections: Document, Geometry, Fonts, Colour, Images, Transparency. Each section lists its issues with severity badges (error / warning / info).
6. Use the page navigation controls to step through individual pages. Visual overlays on the page preview highlight bleed box and trim box positions.
7. Click any issue row to jump to the affected page.

### Output

- **Preflight report** — structured list of issues grouped by category (Document, Geometry, Fonts, Colour, Images, Transparency), each labelled error, warning, or info.
- **Page preview** — rendered page thumbnail with bleed/trim box overlays.
- **Page navigator** — previous/next controls to step through all pages.

### Options

- Page navigation controls step through the document page by page.

## Advanced Mode (Node.js/CLI)

pdfjs-dist is available in Node.js via the legacy build: `import('pdfjs-dist/legacy/build/pdf.mjs')`. Use this for headless page analysis. For basic PDF metadata extraction only (page dimensions, box values, document properties), pdf-lib also works in Node.js. Full preflight rendering with visual overlays requires Browser Mode.
