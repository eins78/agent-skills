#!/usr/bin/env node
// Wrapper: Optimise SVG files using svgo (same library as DelphiTools SVG Optimiser)
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/svg-optimiser.md
//
// Usage:
//   node optimize-svg.mjs input.svg                    # output to stdout
//   node optimize-svg.mjs input.svg -o output.svg      # output to file
//   cat input.svg | node optimize-svg.mjs              # read from stdin
//
// Requires: npm install svgo@4

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node optimize-svg.mjs [INPUT] [-o OUTPUT] [--multipass true|false]

Optimise and minify SVG files using svgo.

Arguments:
  INPUT             SVG file path (or read from stdin if omitted)
  -o, --output      Output file path (default: stdout)
  --multipass       Enable multipass optimisation (default: true)

Requires: npm install svgo@4

Examples:
  node optimize-svg.mjs icon.svg
  node optimize-svg.mjs icon.svg -o icon.min.svg
  cat drawing.svg | node optimize-svg.mjs > optimised.svg`);
  process.exit(0);
}

let optimizeFn;
try {
  const svgo = await import('svgo');
  optimizeFn = svgo.optimize;
} catch {
  console.error('Error: svgo not installed. Run: npm install svgo@4');
  process.exit(1);
}

// Parse args
let inputFile = null;
let outputFile = null;
let multipass = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' || args[i] === '--output') {
    outputFile = args[++i];
  } else if (args[i] === '--multipass') {
    multipass = args[++i] !== 'false';
  } else if (!args[i].startsWith('-')) {
    inputFile = args[i];
  }
}

// Read input
let svg;
if (inputFile) {
  const path = resolve(inputFile);
  if (!existsSync(path)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }
  svg = readFileSync(path, 'utf8');
} else {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  svg = Buffer.concat(chunks).toString('utf8');
}

if (!svg.trim()) {
  console.error('Error: Empty input. Provide an SVG file or pipe SVG to stdin.');
  process.exit(1);
}

// Optimise
const result = optimizeFn(svg, {
  multipass,
  plugins: [
    'preset-default',
    'removeDimensions',
    { name: 'removeAttrs', params: { attrs: '(data-.*)' } },
  ],
});

const originalSize = Buffer.byteLength(svg, 'utf8');
const optimisedSize = Buffer.byteLength(result.data, 'utf8');
const saved = originalSize - optimisedSize;
const percent = Math.round((saved / originalSize) * 100);

if (outputFile) {
  writeFileSync(resolve(outputFile), result.data);
  console.error(`Optimised: ${originalSize}B -> ${optimisedSize}B (saved ${saved}B, ${percent}%)`);
} else {
  console.error(`Optimised: ${originalSize}B -> ${optimisedSize}B (saved ${saved}B, ${percent}%)`);
  process.stdout.write(result.data);
}
