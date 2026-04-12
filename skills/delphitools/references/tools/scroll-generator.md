# Scroll Generator

**Category:** Social Media
**URL:** https://delphi.tools/tools/scroll-generator
**Status:** stable

## What It Does

Splits a wide image into a series of equal-width panel tiles that, when posted as an Instagram carousel, create a seamless panoramic scroll illusion across multiple slides.

## When to Use

- You have a wide or panoramic image and want to post it as an Instagram carousel where swiping reveals a continuous scene.
- You need individual square or portrait tiles exported at consistent sizes for a multi-post layout.

## Browser Mode

### Inputs

- **Image upload area** — drag-and-drop or click to upload; accepts JPEG, PNG, WebP
- **Aspect Ratio selector** — `4:5` (portrait, recommended for Instagram feed) or `1:1` (square)
- **Fill Mode selector** — controls how the left and right edges of the first and last panels are filled:
  - `Blur` — fills edge gaps with a blurred copy of the adjacent image region
  - `Solid Colour` — fills edge gaps with a flat colour
- **Colour picker** — appears when Fill Mode is `Solid Colour`; selects the fill colour

### Step-by-Step

1. Navigate to https://delphi.tools/tools/scroll-generator
2. Click the upload area or drag your image file onto it. The tool analyses the image width and calculates how many panels it will produce.
3. Select **Aspect Ratio**: `4:5` for portrait panels or `1:1` for square panels.
4. Choose **Fill Mode** for edge panels:
   - Select `Blur` to blend edges into the image naturally.
   - Select `Solid Colour`, then use the **Colour picker** to set the fill colour.
5. The preview grid shows each numbered panel tile.
6. To save:
   - Click the **Download** button beneath any individual panel to save that tile as a PNG.
   - Click **Download ZIP** (or equivalent batch export button) to download all panels as a single ZIP archive.

### Output

- Individual panel tiles as PNG files (one per carousel slide)
- Optional ZIP archive containing all tiles

### Options

| Setting | Values | Default |
|---------|--------|---------|
| Aspect Ratio | 4:5 / 1:1 | 4:5 |
| Fill Mode | Blur / Solid Colour | Blur |
| Fill Colour | Any hex/RGB (Solid Colour only) | White |

## CLI Mode (Node.js)

N/A — use Browser Mode. For custom automation, implement Canvas slicing: compute panel width from `imageWidth / panelCount`, draw each slice onto a separate canvas at the target aspect ratio, and export each as PNG.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
