#!/usr/bin/env node
// Thin CLI shim for PDF imposition using DelphiTools' imposition engine.
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/imposer.md
//
// Imports the layout engine from the DelphiTools bundle (lib/imposition.js)
// and uses pdf-lib for PDF I/O. Does NOT reimplement imposition logic.
//
// Usage:
//   node impose-pdf.mjs input.pdf -o booklet.pdf --bundle-dir ./delphitools-bundle
//
// Requires:
//   - A DelphiTools bundle (download via GitHub Releases or build from source)
//   - npm install pdf-lib@1

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node impose-pdf.mjs INPUT [-o OUTPUT] [--bundle-dir DIR] [OPTIONS]

Impose PDF pages for booklet/saddle-stitch printing.

Uses DelphiTools' imposition layout engine (lib/imposition.js from the bundle).
Does NOT reimplement any imposition logic — requires the bundle.

Arguments:
  INPUT               Input PDF file (required)
  -o, --output        Output PDF file (default: imposed.pdf)
  --bundle-dir        Path to extracted DelphiTools bundle (default: ./delphitools-bundle)
  --paper             Paper size: A4, Letter (default: A4)
  --layout            Layout ID (default: saddle-stitch-2up)
  --orientation       landscape or portrait (default: landscape)

Setup:
  # Download bundle
  gh release download --repo eins78/agent-skills --pattern '*.tgz' --output dt.tgz
  mkdir delphitools-bundle && tar xzf dt.tgz -C delphitools-bundle
  npm install pdf-lib@1

  # Then run
  node impose-pdf.mjs input.pdf -o booklet.pdf --bundle-dir ./delphitools-bundle

For full imposition with all options (creep, crop marks, N-up),
use the browser tool: https://delphi.tools/tools/imposer`);
  process.exit(0);
}

// Parse args
let inputFile = null;
let outputFile = 'imposed.pdf';
let bundleDir = './delphitools-bundle';
let paper = 'A4';
let layout = 'saddle-stitch-2up';
let orientation = 'landscape';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') { outputFile = args[++i]; }
  else if (args[i] === '--bundle-dir') { bundleDir = args[++i]; }
  else if (args[i] === '--paper') { paper = args[++i]; }
  else if (args[i] === '--layout') { layout = args[++i]; }
  else if (args[i] === '--orientation') { orientation = args[++i]; }
  else if (!args[i].startsWith('-')) { inputFile = args[i]; }
}

if (!inputFile) { console.error('Error: Input PDF file is required.'); process.exit(1); }
const inputPath = resolve(inputFile);
if (!existsSync(inputPath)) { console.error(`Error: File not found: ${inputFile}`); process.exit(1); }

// Find the imposition module in the bundle
const libPath = join(resolve(bundleDir), 'lib', 'imposition.js');
const libSrcPath = join(resolve(bundleDir), 'lib-src', 'imposition.ts');

if (!existsSync(libPath) && !existsSync(libSrcPath)) {
  console.error(`Error: DelphiTools bundle not found at ${resolve(bundleDir)}`);
  console.error('');
  console.error('The imposition engine lives in the bundle at lib/imposition.js.');
  console.error('');
  console.error('Download the bundle:');
  console.error('  gh release download --repo eins78/agent-skills --pattern "*.tgz" --output dt.tgz');
  console.error('  mkdir delphitools-bundle && tar xzf dt.tgz -C delphitools-bundle');
  console.error('');
  console.error('Or build from source:');
  console.error('  git clone https://github.com/1612elphi/delphitools.git');
  console.error('  cd delphitools && npm install && npm run build');
  console.error('  # Then use --bundle-dir ./delphitools/out');
  process.exit(1);
}

// Import the imposition module
let impositionModule;
try {
  if (existsSync(libPath)) {
    impositionModule = await import(libPath);
  } else {
    // Fall back to TypeScript source (requires tsx or ts-node)
    impositionModule = await import(libSrcPath);
  }
} catch (e) {
  console.error(`Error: Could not import imposition module.`);
  console.error('If using lib-src/*.ts, install tsx: npm install -g tsx');
  console.error('Then run: tsx impose-pdf.mjs ...');
  console.error('Detail:', e.message);
  process.exit(1);
}

// Import pdf-lib
let PDFDocument;
try {
  const mod = await import('pdf-lib');
  PDFDocument = mod.PDFDocument;
} catch {
  console.error('Error: pdf-lib not installed. Run: npm install pdf-lib@1');
  process.exit(1);
}

// Use the imposition engine to compute layout, then apply with pdf-lib.
let inputBytes = readFileSync(inputPath);
const inputDoc = await PDFDocument.load(inputBytes);
const totalPages = inputDoc.getPageCount();

console.log(`Input: ${inputFile} (${totalPages} pages, ${inputBytes.length} bytes)`);
inputBytes = null; // allow GC — inputDoc holds the parsed data

console.log(`Layout: ${layout}, Paper: ${paper}, Orientation: ${orientation}`);

if (!impositionModule.computeImposition) {
  console.error('Error: computeImposition not found in bundle module.');
  console.error('Available exports:', Object.keys(impositionModule).join(', '));
  console.error('');
  console.error('For full imposition, use the browser tool: https://delphi.tools/tools/imposer');
  process.exit(1);
}

const config = {
  layoutId: layout,
  paperSize: impositionModule.PAPER_SIZES?.find(p => p.id === paper.toLowerCase()) || { id: paper.toLowerCase(), label: paper, widthMm: 210, heightMm: 297 },
  orientation,
  marginMm: 5,
  gutterMm: 0,
  creepMm: 0,
  cropMarks: false,
  blankMode: 'auto',
};

const result = impositionModule.computeImposition(config, totalPages);
const sheets = result.sheets || [];
console.log(`Computed: ${sheets.length} sheets`);

const MM_TO_PT = 72 / 25.4;
const sheetWidthPt = config.paperSize.widthMm * MM_TO_PT;
const sheetHeightPt = config.paperSize.heightMm * MM_TO_PT;

// Embed all source pages once (avoids N+1 re-embedding per placement)
const outDoc = await PDFDocument.create();
const embeddedPages = await outDoc.embedPages(inputDoc, Array.from({ length: totalPages }, (_, i) => i));

for (const sheet of sheets) {
  for (const side of ['front', 'back']) {
    const placements = sheet[side];
    if (!placements || placements.length === 0) continue;

    const [pageWidth, pageHeight] = orientation === 'landscape'
      ? [sheetHeightPt, sheetWidthPt]
      : [sheetWidthPt, sheetHeightPt];
    const page = outDoc.addPage([pageWidth, pageHeight]);

    for (const placement of placements) {
      const srcPageIndex = placement.pageIndex;
      if (srcPageIndex == null || srcPageIndex < 0 || srcPageIndex >= totalPages) continue;

      const embeddedPage = embeddedPages[srcPageIndex];
      const xPt = (placement.x ?? 0) * MM_TO_PT;
      const yPt = (placement.y ?? 0) * MM_TO_PT;
      const wPt = (placement.width ?? 0) * MM_TO_PT;
      const hPt = (placement.height ?? 0) * MM_TO_PT;
      const rotation = placement.rotation ?? 0;

      if (wPt === 0 || hPt === 0) continue;

      const srcDims = embeddedPage.size();
      const scaleX = wPt / srcDims.width;
      const scaleY = hPt / srcDims.height;

      // Rotation pivot: pdf-lib rotates around (x, y). For non-zero rotation,
      // offset the origin so the page lands in the correct placement slot.
      let drawX = xPt;
      let drawY = pageHeight - yPt - hPt;
      if (rotation === 180) {
        drawX += wPt;
        drawY += hPt;
      } else if (rotation === 90) {
        drawY += hPt;
      } else if (rotation === 270 || rotation === -90) {
        drawX += wPt;
      }

      page.drawPage(embeddedPage, {
        x: drawX,
        y: drawY,
        xScale: scaleX,
        yScale: scaleY,
        rotate: { type: 'degrees', angle: rotation },
      });
    }
  }
}

const outBytes = await outDoc.save();
writeFileSync(resolve(outputFile), outBytes);
console.log(`Imposed PDF saved to ${outputFile} (${sheets.length} sheets, ${outBytes.length} bytes)`);
console.log('');
console.log('Note: For advanced options (creep compensation, crop marks, N-up),');
console.log('use the browser tool: https://delphi.tools/tools/imposer');
