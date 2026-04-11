# Colorblind Sim

**Category:** Colour
**URL:** https://delphi.tools/tools/colorblind-sim
**Status:** stable

## What It Does

Simulates how an image appears to users with four types of colour blindness — protanopia, deuteranopia, tritanopia, and achromatopsia — and displays the original alongside the simulated versions for side-by-side comparison.

## When to Use

- You want to check whether a design, chart, or image is readable for colour-blind users.
- You need to verify that colour is not the only way information is conveyed in an image.
- You are running accessibility checks before publishing visual content.

## Browser Mode (Default)

### Inputs

- **Image file upload button** — click to select an image file (PNG, JPG, WebP, or GIF) from disk.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/colorblind-sim
2. Click the image upload button and select an image file.
3. The tool processes the image using Canvas pixel manipulation with the Brettel LMS matrix algorithm.
4. Four simulation views appear alongside the original:
   - **Protanopia** — reduced red sensitivity (red-green confusion, missing red cones).
   - **Deuteranopia** — reduced green sensitivity (red-green confusion, missing green cones).
   - **Tritanopia** — reduced blue sensitivity (blue-yellow confusion, missing blue cones).
   - **Achromatopsia** — complete colour blindness (greyscale only).
5. Compare each simulated view to the original to identify problem areas.

### Output

- **Side-by-side comparison** — the original image and four simulated versions displayed together.
- Each view is labelled with the colour blindness type.

### Options

- No configurable options. All four simulation types are always shown.

## Advanced Mode (Node.js/CLI)

N/A — uses custom Brettel LMS matrix pixel manipulation via the browser Canvas API. Use Browser Mode.
