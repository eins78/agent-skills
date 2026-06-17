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
  console.log(`Usage: node trace-image.mjs INPUT [-o OUTPUT] [--preset NAME] [OPTIONS]

Trace a raster image (PNG, JPEG, WebP, GIF) to SVG vector.

Arguments:
  INPUT             Image file path (required)
  -o, --output      Output SVG file (default: stdout)
  --preset          Named preset (see list below, default: none)
  --colors          Number of colours for quantisation (default: 8)
  --blur            Blur radius for preprocessing (default: 0)
  --scale           Output scale factor (default: 1)
  --stroke          Stroke width in output SVG (default: 1)
  --ltres           Line threshold for straight lines (default: 1)
  --qtres           Quadratic spline threshold (default: 1)
  --pathomit        Omit paths shorter than N px (default: 8)

Presets (from imagetracerjs):
  default, posterized1, posterized2, posterized3, curvy, sharp, detailed,
  smoothed, grayscale, fixedpalette, randomsampling1-3

Requires: npm install imagetracerjs@1 sharp@0.34

Examples:
  node trace-image.mjs photo.png -o traced.svg
  node trace-image.mjs icon.jpg --colors 4 -o icon.svg
  node trace-image.mjs logo.png --preset posterized2 -o logo.svg
  node trace-image.mjs art.png --preset curvy --scale 2 -o art.svg`);
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
let preset = null;
let colors = 8;
let blur = 0;
let scale = 1;
let strokeWidth = 1;
let ltres = 1;
let qtres = 1;
let pathomit = 8;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') { outputFile = args[++i]; }
  else if (args[i] === '--preset') { preset = args[++i]; }
  else if (args[i] === '--colors') { colors = parseInt(args[++i]); }
  else if (args[i] === '--blur') { blur = parseInt(args[++i]); }
  else if (args[i] === '--scale') { scale = parseFloat(args[++i]); }
  else if (args[i] === '--stroke') { strokeWidth = parseFloat(args[++i]); }
  else if (args[i] === '--ltres') { ltres = parseFloat(args[++i]); }
  else if (args[i] === '--qtres') { qtres = parseFloat(args[++i]); }
  else if (args[i] === '--pathomit') { pathomit = parseInt(args[++i]); }
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

// Build options — use named preset if given, otherwise custom options.
// Presets match imagetracerjs's built-in optionpresets (same as DelphiTools component).
let options;
if (preset && ImageTracer.optionpresets && ImageTracer.optionpresets[preset]) {
  options = { ...ImageTracer.optionpresets[preset] };
} else if (preset) {
  console.error(`Warning: Unknown preset "${preset}". Using custom options.`);
  options = {};
} else {
  options = {};
}

// CLI args override preset values
options.numberofcolors = colors;
options.blurradius = blur;
options.scale = scale;
options.strokewidth = strokeWidth;
options.ltres = ltres;
options.qtres = qtres;
options.pathomit = pathomit;

const svg = ImageTracer.imagedataToSVG(imageData, options);

if (outputFile) {
  writeFileSync(resolve(outputFile), svg);
  console.error(`Traced ${info.width}x${info.height} image to SVG (${colors} colours)`);
} else {
  console.error(`Traced ${info.width}x${info.height} image to SVG (${colors} colours)`);
  process.stdout.write(svg);
}
