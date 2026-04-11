# SVG Optimiser

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/svg-optimiser
**Status:** stable

## What It Does

Optimises and minifies SVG files using SVGO, removing unnecessary metadata, comments, and redundant attributes. Produces a smaller, cleaner SVG without visual changes.

## When to Use

- Reducing SVG file size before committing assets to a project
- Cleaning up SVG exports from Figma, Illustrator, or Inkscape that contain bloated metadata
- After using Image Tracer, to further compress the traced SVG output

## Browser Mode (Default)

### Inputs

Two input methods are available — use either one:

- **Drop zone:** drag an SVG file onto the area labelled "Drop SVG file here", or click it to open a file picker (accepts `.svg` files only)
- **Paste textarea:** type or paste raw SVG markup directly into the textarea labelled "Paste your SVG code here..."
- **From Image Tracer:** the tool also accepts input via `sessionStorage` when the user clicks "Send to SVG Optimiser" in the Image Tracer tool — the SVG code is transferred automatically

### Step-by-Step

1. Navigate to https://delphi.tools/tools/svg-optimiser
2. Either drag an `.svg` file onto the drop zone labelled "Drop SVG file here", or paste SVG code into the textarea labelled "Paste your SVG code here..."
3. Optimisation runs automatically after input is detected — no submit button is required
4. Review the stats card showing original size, optimised size, bytes saved, and percent reduction
5. Review the live preview to confirm the SVG renders correctly
6. Click "Download Optimized SVG" to save the file, or "Copy SVG Code" to copy the result to the clipboard
7. Click "Clear" to reset all inputs and start over

### Output

An optimised SVG file with unnecessary metadata, comments, and redundant attributes removed. The output appears in a read-only textarea. A stats card displays: original size, optimised size, bytes saved, and percent reduction.

### Options

No manual configuration required. Optimisation always runs with `multipass: true` and the `preset-default` SVGO plugin set. There are no user-configurable settings in the browser UI.

## Advanced Mode (Node.js/CLI)

Uses `svgo` 4.x (ESM). Import from `'svgo'` — do NOT use `'svgo/browser'`.

```js
import { optimize } from 'svgo';
import { readFileSync, writeFileSync } from 'fs';

const svg = readFileSync('input.svg', 'utf8');
const result = optimize(svg, {
  multipass: true,
  plugins: ['preset-default'],
});
writeFileSync('output.svg', result.data);
```

A ready-made wrapper script is available at `${CLAUDE_SKILL_DIR}/scripts/optimize-svg.mjs`.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
