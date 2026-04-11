# Social Cropper

**Category:** Social Media
**URL:** https://delphi.tools/tools/social-cropper
**Status:** stable

## What It Does

Crops images to the correct aspect ratio for Instagram, Bluesky, and Threads, with a drag-to-reposition interface for choosing which part of the image to keep.

## When to Use

- Preparing a photo or graphic for posting to Instagram, Bluesky, or Threads
- Cropping a landscape image to a square or portrait ratio without losing the subject
- Batch-preparing assets for a social media campaign across multiple platforms

## Browser Mode

### Inputs

- **File upload drop zone:** drag any image file onto the drop zone, or click it to open a file picker (accepts PNG, JPEG, WebP, and other common formats)
- **Platform picker:** select the target platform — Instagram, Bluesky, or Threads
- **Aspect ratio selector:** each platform exposes the aspect ratios it supports (e.g. 1:1 square, 4:5 portrait, 16:9 landscape)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/social-cropper
2. Drag an image file onto the drop zone, or click it to open a file picker
3. Select the target platform from the platform picker (Instagram, Bluesky, or Threads)
4. Select the desired aspect ratio for that platform from the aspect ratio selector
5. A crop window overlay appears on the image preview at the selected aspect ratio
6. Drag the crop window to reposition it over the part of the image to keep
7. Click the "Download" button to save the cropped PNG

### Output

A cropped PNG file at the exact pixel dimensions required for the selected platform and aspect ratio. The crop is taken from the repositioned crop window.

### Options

- **Platform:** Instagram | Bluesky | Threads
- **Aspect ratio:** varies by platform (e.g. Instagram supports 1:1, 4:5, 1.91:1; Bluesky and Threads offer their own supported ratios)

No quality or format options — output is always PNG.

## CLI Mode (Node.js)

The browser tool uses a custom Canvas drag UI. Equivalent cropping with `sharp`:

```js
import sharp from 'sharp';

// Example: crop to Instagram square (1:1) centred on a 1200×800 image
const { width, height } = await sharp('input.jpg').metadata();
const size = Math.min(width, height);
const left = Math.floor((width - size) / 2);
const top = Math.floor((height - size) / 2);

await sharp('input.jpg')
  .extract({ left, top, width: size, height: size })
  .toFile('output-square.png');
```

Adjust `left` and `top` to control which region is cropped, matching the drag-to-reposition behaviour in Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
