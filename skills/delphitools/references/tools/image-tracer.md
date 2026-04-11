# Image Tracer

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/image-tracer
**Status:** new

## What It Does

Traces raster images (PNG, JPG, WebP, GIF) to scalable SVG vectors using imagetracerjs. Useful for converting logos, icons, or illustrations into resolution-independent SVG files.

## When to Use

- Converting a PNG or JPG logo to SVG for use in CSS or HTML
- Turning a scanned illustration or pixel-art icon into a vector graphic
- Preparing a raster image for further editing in a vector tool like Figma or Inkscape

## Browser Mode

### Inputs

- **File upload drop zone:** drag a PNG, JPG, WebP, or GIF file onto the drop zone, or click to open a file picker

### Step-by-Step

1. Navigate to https://delphi.tools/tools/image-tracer
2. Drag an image file (PNG, JPG, WebP, or GIF) onto the drop zone, or click it to open a file picker
3. Select a preset from the preset system: "flat", "artistic", "technical", or "custom"
4. If "custom" is selected, adjust the sliders: number of colours, blur radius, line threshold, and fill strategy
5. Tracing runs automatically when the file is loaded or settings change
6. Review the live SVG preview to confirm the result
7. Click "Download SVG" to save the SVG file locally, OR click "Send to SVG Optimiser" to pass the result directly to the SVG Optimiser tool for further compression

### Output

A traced SVG file rendered as a live preview in the browser. The "Download SVG" button saves the file. The "Send to SVG Optimiser" button chains the output to the SVG Optimiser tool via `sessionStorage`.

### Options

- **Preset:** flat | artistic | technical | custom (default: flat)
- **Number of colours:** slider controlling how many colours are quantised in the trace (lower = simpler SVG)
- **Blur radius:** slider controlling pre-blur applied before tracing (higher = smoother edges)
- **Line threshold:** slider controlling the minimum path length retained (higher = fewer small paths)
- **Fill strategy:** controls whether shapes are filled, stroked, or both

## CLI Mode (Node.js)

Uses `imagetracerjs` 1.2.6 (CommonJS). Use `imagedataToSVG` with raw RGBA pixel data — do NOT use `imageToSVG`, which requires a browser `Image` API.

```js
const ImageTracer = require('imagetracerjs');
const { createCanvas, loadImage } = require('canvas'); // npm: canvas

async function traceFile(inputPath) {
  const img = await loadImage(inputPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const svg = ImageTracer.imagedataToSVG(
    { width: img.width, height: img.height, data: imageData.data },
    { numberofcolors: 16, blurradius: 0 }
  );
  return svg;
}
```

A ready-made wrapper script is available at `${CLAUDE_SKILL_DIR}/scripts/trace-image.mjs`.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
