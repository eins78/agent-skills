# Watermarker

**Category:** Social Media
**URL:** https://delphi.tools/tools/watermarker
**Status:** stable

## What It Does

Composites a watermark image onto a base image with configurable position, opacity, blend mode, scale, and padding, then exports the result as a PNG.

## When to Use

- You want to add a logo, signature, or copyright mark to a photo before posting or sharing.
- You need repeatable watermark placement across multiple images using the same settings.

## Browser Mode

### Inputs

- **Base Image upload area** — drag-and-drop or click to upload the main image; accepts JPEG, PNG, WebP
- **Watermark Image upload area** — separate upload zone for the watermark graphic (logo, text PNG, etc.); accepts PNG (transparent backgrounds are preserved)
- **Position grid** — 3×3 click grid plus a "Random" option; selects where the watermark is placed: top-left, top-centre, top-right, middle-left, centre, middle-right, bottom-left, bottom-centre, bottom-right, or random
- **Opacity slider** — 0 (invisible) to 100 (fully opaque); controls the watermark transparency
- **Blend Mode selector** — dropdown with: `Normal`, `Multiply`, `Screen`, `Overlay`
- **Scale slider** — sets watermark width as a percentage of the base image width (e.g. 20 = watermark is 20% as wide as the base image)
- **Padding slider** — inset distance from the chosen edge/corner in pixels or percentage units

### Step-by-Step

1. Navigate to https://delphi.tools/tools/watermarker
2. Upload your **base image** using the first upload area.
3. Upload your **watermark image** using the second upload area. Use a PNG with a transparent background for best results.
4. Click a cell in the **Position grid** to choose watermark placement. Click "Random" to randomise placement on each export.
5. Drag the **Opacity slider** to set watermark transparency (50–70% is a typical starting point).
6. Choose a **Blend Mode** from the dropdown:
   - `Normal` — watermark draws on top as-is.
   - `Multiply` — darkens underlying pixels; good for light backgrounds.
   - `Screen` — lightens underlying pixels; good for dark backgrounds.
   - `Overlay` — high-contrast mix; emphasises both light and dark regions.
7. Drag the **Scale slider** to resize the watermark relative to the base image width.
8. Drag the **Padding slider** to push the watermark away from the nearest edge or corner.
9. The canvas preview updates in real time.
10. Click the **Download** button to save the watermarked image as a PNG.

### Output

A single PNG file — the base image with the watermark composited at the configured position.

### Options

| Setting | Values | Default |
|---------|--------|---------|
| Position | 9-cell grid + Random | Bottom-right |
| Opacity | 0–100% | 100% |
| Blend Mode | Normal / Multiply / Screen / Overlay | Normal |
| Scale | % of base image width | 20% |
| Padding | px / % from edge | ~10px |

## CLI Mode (Node.js)

N/A — use Browser Mode. For custom automation, implement Canvas compositing: load both images, set `ctx.globalAlpha` for opacity, set `ctx.globalCompositeOperation` for blend mode, compute position from the 9-point grid, and draw the scaled watermark onto the base canvas.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
