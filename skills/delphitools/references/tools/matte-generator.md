# Matte Generator

**Category:** Social Media
**URL:** https://delphi.tools/tools/matte-generator
**Status:** stable

## What It Does

Places a non-square image onto a square (or 4:5) matte background, filling the surrounding space with a colour, blur, or gradient so the result fits Instagram and other square-only feeds.

## When to Use

- A photo is landscape or portrait and must be posted to a platform that requires square crops without cropping the subject.
- You want a polished coloured or blurred border instead of white letterboxing.

## Browser Mode (Default)

### Inputs

- **Image upload area** — drag-and-drop or click to upload; accepts JPEG, PNG, WebP
- **Matte Type selector** — three options: `Colour`, `Blur`, `Gradient`
- **Colour picker** — appears when Matte Type is `Colour` or `Gradient`; picks the matte fill colour (auto-populated with the dominant colour detected from the image)
- **Output Size (px) field** — integer pixel value for the output canvas side length (e.g. 1080)
- **Aspect Ratio selector** — `1:1` (square) or `4:5` (portrait rectangle)
- **Padding slider** — controls the inset gap between the image edge and the matte border (0–50%)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/matte-generator
2. Click the upload area or drag your image file onto it. The image preview appears immediately.
3. Choose a **Matte Type**: `Colour`, `Blur`, or `Gradient`.
   - `Colour`: fills the matte with a flat colour. The colour picker pre-fills with the dominant colour detected from your image — adjust if needed.
   - `Blur`: fills the matte with a blurred, scaled copy of the image itself.
   - `Gradient`: fills the matte with a gradient derived from the colour picker value.
4. Set **Output Size** to your desired pixel dimension (1080 is standard for Instagram).
5. Choose **Aspect Ratio**: `1:1` for a square post, `4:5` for a portrait feed post.
6. Drag the **Padding** slider to add breathing room around the image.
7. The canvas preview updates in real time as you adjust settings.
8. Click the **Download** button to save the result as a PNG.

### Output

A single PNG file — the original image centred on the matte background at the specified output size.

### Options

| Setting | Values | Default |
|---------|--------|---------|
| Matte Type | Colour / Blur / Gradient | Colour |
| Output Size | Any integer (px) | 1080 |
| Aspect Ratio | 1:1 / 4:5 | 1:1 |
| Padding | 0–50% | ~5% |
| Colour | Any hex/RGB | Auto (dominant colour) |

## Advanced Mode (Node.js/CLI)

N/A — use Browser Mode. For custom automation, implement Canvas compositing: draw the matte background onto an `OffscreenCanvas` at the target size, then draw the scaled source image centred on top.
