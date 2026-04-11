#!/usr/bin/env node
// Wrapper: Generate styled QR codes (same library as DelphiTools QR Generator)
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/qr-genny.md
//
// Usage:
//   node generate-qr.mjs "https://example.com" -o qr.png
//   node generate-qr.mjs "Hello" -o qr.svg --type svg --dots rounded --color "#4267B2"
//
// Requires: npm install qr-code-styling@1 jsdom@24 canvas@2

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node generate-qr.mjs DATA [-o OUTPUT] [OPTIONS]

Generate styled QR codes with custom colours and shapes.

Arguments:
  DATA              Text or URL to encode (required)
  -o, --output      Output file path (required)
  --type            Output type: png or svg (default: png)
  --size            QR code size in pixels (default: 300)
  --dots            Dot style: square, rounded, dots, classy, extra-rounded (default: square)
  --color           Dot colour as hex (default: #000000)
  --bg              Background colour as hex (default: #ffffff)
  --correction      Error correction: L, M, Q, H (default: M)

Requires: npm install qr-code-styling@1 jsdom@24 canvas@2

Examples:
  node generate-qr.mjs "https://example.com" -o qr.png
  node generate-qr.mjs "Hello" -o qr.png --dots rounded --color "#3b82f6"
  node generate-qr.mjs "https://example.com" -o qr.svg --type svg`);
  process.exit(0);
}

let QRCodeStyling, JSDOM, createCanvas;
try {
  const jsdomMod = await import('jsdom');
  JSDOM = jsdomMod.JSDOM;
  const canvasMod = await import('canvas');
  createCanvas = canvasMod.createCanvas;
  // Set up DOM globals that qr-code-styling expects
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.XMLSerializer = dom.window.XMLSerializer;
  global.Image = canvasMod.Image;
  global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
  QRCodeStyling = (await import('qr-code-styling')).default;
} catch (e) {
  console.error('Error: Required packages not installed. Run: npm install qr-code-styling@1 jsdom@24 canvas@2');
  console.error('Detail:', e.message);
  process.exit(1);
}

// Parse args
let data = null;
let outputFile = null;
let type = 'png';
let size = 300;
let dotsType = 'square';
let color = '#000000';
let bg = '#ffffff';
let correction = 'M';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') { outputFile = args[++i]; }
  else if (args[i] === '--type') { type = args[++i]; }
  else if (args[i] === '--size') { size = parseInt(args[++i]); }
  else if (args[i] === '--dots') { dotsType = args[++i]; }
  else if (args[i] === '--color') { color = args[++i]; }
  else if (args[i] === '--bg') { bg = args[++i]; }
  else if (args[i] === '--correction') { correction = args[++i]; }
  else if (!args[i].startsWith('-')) { data = args[i]; }
}

if (!data) { console.error('Error: Data argument is required.'); process.exit(1); }
if (!outputFile) { console.error('Error: Output file (-o) is required.'); process.exit(1); }

const qrCode = new QRCodeStyling({
  width: size,
  height: size,
  data,
  dotsOptions: { type: dotsType, color },
  backgroundOptions: { color: bg },
  qrOptions: { errorCorrectionLevel: correction },
  nodeCanvas: createCanvas,
  type: type === 'svg' ? 'svg' : 'canvas',
});

if (type === 'svg') {
  const svgBuffer = await qrCode.getRawData('svg');
  writeFileSync(resolve(outputFile), Buffer.from(await svgBuffer.arrayBuffer()));
  console.log(`SVG QR code saved to ${outputFile} (${size}px)`);
} else {
  const pngBuffer = await qrCode.getRawData('png');
  writeFileSync(resolve(outputFile), Buffer.from(await pngBuffer.arrayBuffer()));
  console.log(`PNG QR code saved to ${outputFile} (${size}px)`);
}
