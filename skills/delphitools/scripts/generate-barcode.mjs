#!/usr/bin/env node
// Wrapper: Generate barcodes using bwip-js (same library as DelphiTools Barcode Generator)
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/code-genny.md
//
// Usage:
//   node generate-barcode.mjs "DATA" -o barcode.png
//   node generate-barcode.mjs "DATA" --format code128 --svg -o barcode.svg
//
// Requires: npm install bwip-js@4

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node generate-barcode.mjs DATA [-o OUTPUT] [--format FORMAT] [--svg] [--scale N] [--height N]

Generate barcodes in various formats.

Arguments:
  DATA              The data to encode (required)
  -o, --output      Output file path (required)
  --format          Barcode format (default: code128)
  --svg             Output as SVG instead of PNG
  --scale           Scale factor (default: 3 for 1D, auto for 2D)
  --height          Bar height in mm (default: 15, pdf417: 10)
  --text            Include human-readable text below barcode
  --color           Bar colour as hex, e.g. "#ff0000" (default: #000000)
  --bg              Background colour as hex (default: #ffffff)

Supported formats: code128, ean13, upca, datamatrix, azteccode, pdf417, qrcode, code39, and more.

Requires: npm install bwip-js@4

Examples:
  node generate-barcode.mjs "HELLO-123" -o barcode.png
  node generate-barcode.mjs "4006381333931" --format ean13 --text -o ean.png
  node generate-barcode.mjs "https://example.com" --format datamatrix --svg -o dm.svg
  node generate-barcode.mjs "ABC" --format code128 --color "#003366" -o blue.png`);
  process.exit(0);
}

let bwipjs;
try {
  bwipjs = (await import('bwip-js')).default;
} catch {
  console.error('Error: bwip-js not installed. Run: npm install bwip-js@4');
  process.exit(1);
}

// Parse args
let data = null;
let outputFile = null;
let format = 'code128';
let useSvg = false;
let scale = null;
let height = null;
let includeText = false;
let barColor = '';
let bgColor = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') { outputFile = args[++i]; }
  else if (args[i] === '--format') { format = args[++i]; }
  else if (args[i] === '--svg') { useSvg = true; }
  else if (args[i] === '--scale') { scale = parseInt(args[++i]); }
  else if (args[i] === '--height') { height = parseInt(args[++i]); }
  else if (args[i] === '--text') { includeText = true; }
  else if (args[i] === '--color') { barColor = args[++i]; }
  else if (args[i] === '--bg') { bgColor = args[++i]; }
  else if (!args[i].startsWith('-')) { data = args[i]; }
}

if (!data) { console.error('Error: Data argument is required.'); process.exit(1); }
if (!outputFile) { console.error('Error: Output file (-o) is required.'); process.exit(1); }

// Match DelphiTools component behaviour: 2D codes get auto-scaled, 1D get fixed scale/height.
const is2D = ['datamatrix', 'azteccode', 'qrcode', 'microqrcode', 'pdf417'].includes(format);
const effectiveScale = scale ?? (is2D ? 4 : 3);
const effectiveHeight = height ?? (format === 'pdf417' ? 10 : 15);

const opts = {
  bcid: format, text: data, scale: effectiveScale, includetext: includeText,
  paddingwidth: 2, paddingheight: 2,
  ...(is2D ? {} : { height: effectiveHeight }),
  ...(barColor ? { barcolor: barColor.replace('#', '') } : {}),
  ...(bgColor ? { backgroundcolor: bgColor.replace('#', '') } : {}),
};

if (useSvg) {
  const svg = bwipjs.toSVG(opts);
  writeFileSync(resolve(outputFile), svg);
  console.log(`SVG barcode saved to ${outputFile} (${format})`);
} else {
  await new Promise((ok, fail) => {
    bwipjs.toBuffer(opts, (err, png) => {
      if (err) { fail(err); return; }
      writeFileSync(resolve(outputFile), png);
      console.log(`PNG barcode saved to ${outputFile} (${png.length} bytes, ${format})`);
      ok();
    });
  });
}
