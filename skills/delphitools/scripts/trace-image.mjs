#!/usr/bin/env node
// Wrapper: Trace raster images to SVG using imagetracerjs (same library as DelphiTools Image Tracer)
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/image-tracer.md
//
// Usage:
//   node trace-image.mjs input.png -o output.svg
//
// Requires: npm install imagetracerjs@1 sharp@0.34
// (sharp is used to decode the image to raw RGBA pixel data)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`Usage: node trace-image.mjs INPUT [-o OUTPUT] [--colors N] [--blur N]

Trace a raster image (PNG, JPEG, WebP, GIF) to SVG vector.

Arguments:
  INPUT             Image file path (required)
  -o, --output      Output SVG file (default: stdout)
  --colors          Number of colours for quantisation (default: 8)
  --blur            Blur radius for preprocessing (default: 0)

Requires: npm install imagetracerjs@1 sharp@0.34

Examples:
  node trace-image.mjs photo.png -o traced.svg
  node trace-image.mjs icon.jpg --colors 4 -o icon.svg`);
  process.exit(0);
}

let ImageTracer, sharp;
try {
  ImageTracer = (await import('imagetracerjs')).default || (await import('imagetracerjs'));
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('Error: Required packages not installed. Run: npm install imagetracerjs@1 sharp@0.34');
  process.exit(1);
}

// Parse args
let inputFile = null;
let outputFile = null;
let colors = 8;
let blur = 0;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') { outputFile = args[++i]; }
  else if (args[i] === '--colors') { colors = parseInt(args[++i]); }
  else if (args[i] === '--blur') { blur = parseInt(args[++i]); }
  else if (!args[i].startsWith('-')) { inputFile = args[i]; }
}

if (!inputFile) { console.error('Error: Input file is required.'); process.exit(1); }

const path = resolve(inputFile);
if (!existsSync(path)) { console.error(`Error: File not found: ${inputFile}`); process.exit(1); }

// Decode image to raw RGBA using sharp
const { data, info } = await sharp(path)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Create ImageData-like object for imagetracerjs
const imageData = {
  width: info.width,
  height: info.height,
  data: new Uint8ClampedArray(data),
};

// Trace to SVG
const options = {
  numberofcolors: colors,
  blurradius: blur,
  pathomit: 8,
};

const svg = ImageTracer.imagedataToSVG(imageData, options);

if (outputFile) {
  writeFileSync(resolve(outputFile), svg);
  console.error(`Traced ${info.width}x${info.height} image to SVG (${colors} colours)`);
} else {
  console.error(`Traced ${info.width}x${info.height} image to SVG (${colors} colours)`);
  process.stdout.write(svg);
}
