#!/usr/bin/env node
// Wrapper: Impose PDF pages for booklet/saddle-stitch printing using pdf-lib
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/imposer.md
//
// This implements a simplified version of the imposition logic from
// DelphiTools' lib/imposition.ts — enough for 2-up saddle-stitch booklets.
//
// Usage:
//   node impose-pdf.mjs input.pdf -o booklet.pdf
//   node impose-pdf.mjs input.pdf -o booklet.pdf --paper A4 --orientation landscape
//
// Requires: npm install pdf-lib@1

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node impose-pdf.mjs INPUT [-o OUTPUT] [--paper SIZE] [--orientation ORIENT]

Impose PDF pages for 2-up saddle-stitch booklet printing.

Arguments:
  INPUT             Input PDF file (required)
  -o, --output      Output PDF file (default: imposed.pdf)
  --paper           Paper size: A4, Letter (default: A4)
  --orientation     Sheet orientation: landscape, portrait (default: landscape)

How it works:
  Reorders pages for saddle-stitch binding. A 12-page document on landscape
  A4 produces 3 sheets, each with 2 pages front and 2 pages back.
  Sheet 1 front: pages 12, 1 | Sheet 1 back: pages 2, 11 | etc.

Requires: npm install pdf-lib@1

Examples:
  node impose-pdf.mjs document.pdf -o booklet.pdf
  node impose-pdf.mjs zine.pdf -o imposed.pdf --paper Letter`);
  process.exit(0);
}

let PDFDocument, degrees;
try {
  const mod = await import('pdf-lib');
  PDFDocument = mod.PDFDocument;
  degrees = mod.degrees;
} catch {
  console.error('Error: pdf-lib not installed. Run: npm install pdf-lib@1');
  process.exit(1);
}

// Parse args
let inputFile = null;
let outputFile = 'imposed.pdf';
let paper = 'A4';
let orientation = 'landscape';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') { outputFile = args[++i]; }
  else if (args[i] === '--paper') { paper = args[++i]; }
  else if (args[i] === '--orientation') { orientation = args[++i]; }
  else if (!args[i].startsWith('-')) { inputFile = args[i]; }
}

if (!inputFile) { console.error('Error: Input PDF file is required.'); process.exit(1); }
const path = resolve(inputFile);
if (!existsSync(path)) { console.error(`Error: File not found: ${inputFile}`); process.exit(1); }

// Paper sizes in points (1 point = 1/72 inch)
const paperSizes = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
  A3: [841.89, 1190.55],
  Legal: [612, 1008],
};

const [pw, ph] = paperSizes[paper] || paperSizes.A4;
const sheetWidth = orientation === 'landscape' ? Math.max(pw, ph) : Math.min(pw, ph);
const sheetHeight = orientation === 'landscape' ? Math.min(pw, ph) : Math.max(pw, ph);

// Load input PDF
const inputBytes = readFileSync(path);
const inputDoc = await PDFDocument.load(inputBytes);
const totalPages = inputDoc.getPageCount();

// Pad to multiple of 4 for saddle-stitch
const paddedCount = Math.ceil(totalPages / 4) * 4;
const sheets = paddedCount / 4;

// Generate saddle-stitch page order
// For saddle-stitch: sheet i has front=[paddedCount-2i, 2i+1] back=[2i+2, paddedCount-2i-1]
function getSaddleStitchOrder(total) {
  const order = [];
  for (let s = 0; s < total / 4; s++) {
    // Front: last-even, first-odd
    order.push({ sheet: s, side: 'front', left: total - 2 * s, right: 2 * s + 1 });
    // Back: next-even, prev-odd
    order.push({ sheet: s, side: 'back', left: 2 * s + 2, right: total - 2 * s - 1 });
  }
  return order;
}

const impositionOrder = getSaddleStitchOrder(paddedCount);

// Create output document
const outDoc = await PDFDocument.create();
const halfWidth = sheetWidth / 2;

// Copy all pages from input (indices are 0-based)
const copiedPages = await outDoc.copyPages(inputDoc, Array.from({ length: totalPages }, (_, i) => i));

for (const entry of impositionOrder) {
  const page = outDoc.addPage([sheetWidth, sheetHeight]);

  for (const [position, pageNum] of [['left', entry.left], ['right', entry.right]]) {
    if (pageNum > totalPages) continue; // blank page (padding)

    const srcPage = copiedPages[pageNum - 1];
    const embedded = await outDoc.embedPage(srcPage);
    const { width: srcW, height: srcH } = embedded;

    // Scale to fit half-sheet
    const scale = Math.min(halfWidth / srcW, sheetHeight / srcH);
    const xOffset = position === 'left' ? 0 : halfWidth;
    const yOffset = (sheetHeight - srcH * scale) / 2;

    page.drawPage(embedded, {
      x: xOffset + (halfWidth - srcW * scale) / 2,
      y: yOffset,
      xScale: scale,
      yScale: scale,
    });
  }
}

const outBytes = await outDoc.save();
writeFileSync(resolve(outputFile), outBytes);
console.log(`Imposed ${totalPages} pages onto ${sheets} sheets (${paper} ${orientation})`);
console.log(`Saved to ${outputFile} (${outBytes.length} bytes)`);
