# Favicon Generator

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/favicon-genny
**Status:** stable

## What It Does

Generates a complete set of favicon files at standard sizes (16×16, 32×32, 48×48, 64×64 px) and packages them as an ICO file, all from a single source image.

## When to Use

- Creating a favicon set for a new website from a logo or icon image
- Replacing an outdated single-size favicon.ico with a multi-size ICO file
- Quickly generating browser tab icons without needing design software

## Browser Mode (Default)

### Inputs

- **File upload drop zone:** drag any image file onto the drop zone, or click it to open a file picker (PNG recommended for best results; also accepts JPEG, WebP, and GIF)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/favicon-genny
2. Drag an image file onto the drop zone, or click it to open a file picker
3. The tool automatically resizes the source image to 16×16, 32×32, 48×48, and 64×64 px using Canvas
4. Previews of each size are displayed on screen
5. Click the "Download" button next to any individual size to save that PNG
6. Click "Download All" to save all sizes plus the combined ICO file as a ZIP archive

### Output

Individual PNG files at 16, 32, 48, and 64 px square, plus a single `favicon.ico` file containing all four sizes embedded as multi-resolution ICO. The ICO is assembled using custom byte assembly in the browser.

### Options

No configurable settings. The tool always produces all four standard sizes and the combined ICO file.

## Advanced Mode (Node.js/CLI)

N/A — ICO file assembly uses a custom Canvas resize and ICO byte assembly implementation with no direct Node.js library equivalent in this tool.

For scripted favicon generation, use the `sharp` npm package for PNG resizing and a dedicated ICO library such as `ico-endec` or `png-to-ico`:

```js
import sharp from 'sharp';
import { encode } from 'ico-endec'; // npm: ico-endec
import { readFileSync, writeFileSync } from 'fs';

const sizes = [16, 32, 48, 64];
const pngBuffers = await Promise.all(
  sizes.map(size =>
    sharp('input.png').resize(size, size).png().toBuffer()
  )
);
writeFileSync('favicon.ico', encode(pngBuffers));
```

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
