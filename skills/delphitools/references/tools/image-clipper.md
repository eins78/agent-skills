# Image Clipper

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/image-clipper
**Status:** new

## What It Does

Trims transparent edges from PNG images, cropping the canvas to the smallest bounding box that contains all non-transparent pixels.

## When to Use

- Removing excess transparent padding from an exported PNG icon or logo
- Tightening up assets exported from design tools like Figma that include extra whitespace
- Preparing PNGs for use in places where the file's actual dimensions must match the visible content

## Browser Mode

### Inputs

- **File upload drop zone:** drag a PNG file onto the drop zone labelled "Drop PNG file here", or click it to open a file picker (accepts `.png` files only)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/image-clipper
2. Drag a PNG file onto the drop zone labelled "Drop PNG file here", or click it to open a file picker
3. The tool scans the image pixel-by-pixel automatically after upload — no further interaction is required
4. Review the stats shown: original dimensions (width × height), clipped dimensions, and the number of pixels trimmed on each side (top, right, bottom, left)
5. Click the "Download" button to save the trimmed PNG

### Output

A trimmed PNG file with all fully-transparent edge rows and columns removed. The file dimensions are reduced to the tightest bounding box around the visible content. Transparent pixels within the content area are preserved.

### Options

No configurable settings. The tool always trims all fully-transparent edges using pixel-level Canvas scanning.

## CLI Mode (Node.js)

N/A — the tool uses a custom Canvas pixel-scanning implementation that has no direct Node.js equivalent.

Use the `sharp` npm package for equivalent trimming in scripts:

```js
import sharp from 'sharp';
await sharp('input.png').trim().toFile('output-trimmed.png');
```

`sharp`'s `trim()` removes edges that match the background colour of the top-left pixel. For true alpha-based trimming, pass `{ threshold: 0 }` to trim only fully-transparent pixels.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
