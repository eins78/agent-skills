#!/usr/bin/env node
// Wrapper: Create PDF documents using pdf-lib (same library as DelphiTools Print tools)
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/imposer.md
//
// Usage:
//   node create-pdf.mjs -o output.pdf --text "Hello World"
//   node create-pdf.mjs -o output.pdf --text "Page content" --size A4
//
// Requires: npm install pdf-lib@1

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node create-pdf.mjs -o OUTPUT [--text TEXT] [--size SIZE] [--pages N]

Create a simple PDF document.

Arguments:
  -o, --output      Output PDF file (required)
  --text            Text content for the first page
  --size            Page size: A4, Letter, Legal (default: A4)
  --pages           Number of blank pages (default: 1)
  --font-size       Font size in points (default: 18)

Requires: npm install pdf-lib@1

Examples:
  node create-pdf.mjs -o hello.pdf --text "Hello World"
  node create-pdf.mjs -o blank.pdf --size Letter --pages 12
  node create-pdf.mjs -o doc.pdf --text "My Document" --font-size 24`);
  process.exit(0);
}

let PDFDocument, StandardFonts, PageSizes;
try {
  const mod = await import('pdf-lib');
  PDFDocument = mod.PDFDocument;
  StandardFonts = mod.StandardFonts;
  PageSizes = mod.PageSizes;
} catch {
  console.error('Error: pdf-lib not installed. Run: npm install pdf-lib@1');
  process.exit(1);
}

// Parse args
let outputFile = null;
let text = null;
let size = 'A4';
let pages = 1;
let fontSize = 18;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') { outputFile = args[++i]; }
  else if (args[i] === '--text') { text = args[++i]; }
  else if (args[i] === '--size') { size = args[++i]; }
  else if (args[i] === '--pages') { pages = parseInt(args[++i]); }
  else if (args[i] === '--font-size') { fontSize = parseInt(args[++i]); }
}

if (!outputFile) { console.error('Error: Output file (-o) is required.'); process.exit(1); }

const pageSizeMap = {
  A4: PageSizes.A4,
  Letter: PageSizes.Letter,
  Legal: PageSizes.Legal,
  A3: PageSizes.A3,
  A5: PageSizes.A5,
};

const pageSize = pageSizeMap[size] || PageSizes.A4;
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);

for (let i = 0; i < pages; i++) {
  const page = doc.addPage(pageSize);
  if (text && i === 0) {
    page.drawText(text, {
      x: 50,
      y: page.getHeight() - 50 - fontSize,
      size: fontSize,
      font,
    });
  }
}

const pdfBytes = await doc.save();
writeFileSync(resolve(outputFile), pdfBytes);
console.log(`Created ${outputFile} (${pages} page(s), ${size}, ${pdfBytes.length} bytes)`);
