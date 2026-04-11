# Image Splitter

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/image-splitter
**Status:** stable

## What It Does

Splits an image into a uniform grid of tiles, allowing each tile to be downloaded individually or as a batch ZIP archive.

## When to Use

- Slicing a sprite sheet into individual tile images
- Dividing a large image into equal sections for use in a mosaic or grid layout
- Preparing images for social media carousel posts that span multiple frames

## Browser Mode (Default)

### Inputs

- **File upload drop zone:** drag any image file onto the drop zone, or click it to open a file picker (accepts PNG, JPEG, WebP, and other common formats)
- **Grid size selector:** choose the number of rows and columns to split the image into (e.g. 2×2, 3×3, 4×2)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/image-splitter
2. Drag an image file onto the drop zone, or click it to open a file picker
3. Set the desired grid size using the rows and columns selectors (e.g. 3 rows × 3 columns for a 9-tile grid)
4. The image is sliced automatically and a grid of tile previews is displayed
5. Click the "Download" button beneath any individual tile to save that tile
6. Or click "Download All as ZIP" to save all tiles in a single ZIP archive

### Output

A set of image tiles, each representing one cell of the grid. Tiles are numbered in row-major order (left to right, top to bottom). Each tile has the same dimensions: the original image width divided by the number of columns, and the original image height divided by the number of rows.

### Options

- **Rows:** number of horizontal slices (minimum 1)
- **Columns:** number of vertical slices (minimum 1)

No quality or format options — output tiles are in the same format as the input image.

## Advanced Mode (Node.js/CLI)

N/A — the tool uses a custom Canvas slicing implementation.

Use the `sharp` npm package for equivalent tile extraction in scripts:

```js
import sharp from 'sharp';
const { width, height } = await sharp('input.png').metadata();
const rows = 3, cols = 3;
const tileW = Math.floor(width / cols);
const tileH = Math.floor(height / rows);

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    await sharp('input.png')
      .extract({ left: c * tileW, top: r * tileH, width: tileW, height: tileH })
      .toFile(`tile-${r}-${c}.png`);
  }
}
```

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
