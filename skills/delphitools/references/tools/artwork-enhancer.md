# Artwork Enhancer

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/artwork-enhancer
**Status:** stable

## What It Does

Applies a configurable colour noise overlay to an image, adding a film-grain or texture effect that gives digital artwork a more tactile, analogue quality.

## When to Use

- You have flat digital artwork or a smooth photo and want to add grain or texture without switching to a full image editor.
- You are preparing artwork for print or social media and want a subtle noise overlay to reduce banding or add visual warmth.

## Browser Mode (Default)

### Inputs

- **Image upload area** — drag-and-drop or click to upload; accepts JPEG, PNG, WebP
- **Noise Type selector** — controls the character of the noise (e.g. monochrome grain, colour noise, or film-style grain variants)
- **Intensity slider** — controls how strong the noise overlay appears (low = subtle grain, high = heavy texture)
- **Scale slider** — controls the size of individual noise particles (low = fine grain, high = coarse/chunky grain)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/artwork-enhancer
2. Click the upload area or drag your image file onto it. The image preview appears.
3. Select a **Noise Type** from the selector to choose the grain character.
4. Drag the **Intensity slider** to set how visible the noise is. Start low (10–20%) and increase until the effect looks natural.
5. Drag the **Scale slider** to adjust grain size. Fine grain (low scale) suits high-resolution artwork; coarse grain (high scale) suits lo-fi or retro aesthetics.
6. The canvas preview updates in real time as you adjust sliders.
7. Click the **Download** button to save the result as a PNG.

### Output

A single PNG file — the original image with the noise overlay applied at the configured settings.

### Options

| Setting | Values | Default |
|---------|--------|---------|
| Noise Type | Monochrome / Colour / Film variants | Monochrome |
| Intensity | 0–100% | ~20% |
| Scale | Low (fine) to High (coarse) | Medium |

## Advanced Mode (Node.js/CLI)

N/A — use Browser Mode. For custom automation, implement Canvas noise generation: create an `OffscreenCanvas` the same size as the source image, fill it with randomised RGBA pixel values at the desired intensity and scale, then composite it over the source image using `ctx.globalCompositeOperation = 'overlay'` or `'soft-light'`.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
