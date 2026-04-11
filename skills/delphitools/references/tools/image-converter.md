# Image Converter

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/image-converter
**Status:** stable

## What It Does

Converts images between 9 formats — PNG, JPEG, WebP, AVIF, GIF, BMP, TIFF, ICO, and ICNS — with optional resizing and per-format quality controls. Supports multi-file batch conversion with ZIP download.

## When to Use

- Converting a batch of PNGs to WebP or AVIF for web performance
- Generating ICO or ICNS icon files from a source image
- Resizing images to a fixed size or percentage while converting format

## Browser Mode (Default)

### Inputs

- **File upload drop zone:** drag one or more image files onto the drop zone, or click to open a file picker (accepts any common image format)
- **Target format selector:** dropdown to choose the output format (PNG, JPEG, WebP, AVIF, GIF, BMP, TIFF, ICO, ICNS)
- **Resize options:** select "Original size", "Custom dimensions" (enter width and height in pixels), or "Percentage" (enter a scale factor)
- **Lock aspect ratio toggle:** when enabled, changing one dimension auto-calculates the other

### Step-by-Step

1. Navigate to https://delphi.tools/tools/image-converter
2. Drag one or more image files onto the drop zone, or click it to open a file picker
3. Select the desired output format from the target format selector dropdown
4. Optionally configure resize options: choose "Original size", "Custom dimensions", or "Percentage"
5. If "Custom dimensions" is selected, enter the target width and/or height; enable the lock aspect ratio toggle if needed
6. Configure any per-format quality settings that appear (see Options below)
7. Click the "Download" button next to each file to save it individually, or click "Download All as ZIP" to get a ZIP archive of all converted files

### Output

Each input file is converted to the selected format. Individual files can be downloaded one at a time. A "Download All as ZIP" button downloads all converted files in a single ZIP archive.

### Options

Options vary by output format:

- **JPEG:** quality slider (1–100, default 85)
- **WebP:** lossless toggle (off by default); quality slider visible when lossless is off
- **GIF:** colour count selector (2–256 colours, default 256)
- **ICO / ICNS:** multi-size toggle — when enabled, generates multiple icon sizes in a single file

## Advanced Mode (Node.js/CLI)

Partial Node.js support only. Some libraries used by this tool work in Node.js:

- **GIF encoding:** `gifenc` npm package
- **TIFF encoding/decoding:** `utif` npm package
- **ZIP bundling:** `jszip` npm package

For full cross-format conversion in a script, use the `sharp` npm package instead:

```js
import sharp from 'sharp';
await sharp('input.png').webp({ quality: 85 }).toFile('output.webp');
await sharp('input.png').jpeg({ quality: 85 }).toFile('output.jpg');
await sharp('input.png').avif().toFile('output.avif');
```

For AVIF, GIF, ICO, and ICNS at full fidelity, use Browser Mode.
