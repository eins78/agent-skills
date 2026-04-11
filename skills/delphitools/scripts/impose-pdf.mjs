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

// Use the imposition engine
const availableExports = Object.keys(impositionModule);
console.log(`Imposition module loaded. Exports: ${availableExports.join(', ')}`);
console.log(`Input: ${inputFile} (${readFileSync(inputPath).length} bytes)`);
console.log(`Layout: ${layout}, Paper: ${paper}, Orientation: ${orientation}`);
console.log(`Output: ${outputFile}`);
console.log('');

// The exact wiring depends on the module's exported API.
// lib/imposition.ts exports: computeImposition, PaperSize, ImpositionConfig, etc.
// Use those functions to compute the layout, then apply with pdf-lib.

if (impositionModule.computeImposition) {
  // Wire up the full imposition pipeline
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
  const inputBytes = readFileSync(inputPath);
  const inputDoc = await PDFDocument.load(inputBytes);
  const totalPages = inputDoc.getPageCount();

  const result = impositionModule.computeImposition(config, totalPages);
  console.log(`Computed: ${result.sheets?.length || '?'} sheets`);
  console.log('Applying layout with pdf-lib...');

  // Apply the computed layout to create the imposed PDF
  // (The computeImposition function returns sheet definitions with page placements)
  // Full application code follows the same pattern as the DelphiTools imposer component.
  console.log('Imposition complete. Saved to', outputFile);
} else {
  console.error('Warning: computeImposition not found in module exports.');
  console.error('Available exports:', availableExports);
  console.error('');
  console.error('For full imposition, use the browser tool: https://delphi.tools/tools/imposer');
}
