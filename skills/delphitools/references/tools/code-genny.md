# Barcode Generator

**Category:** Other Tools
**URL:** https://delphi.tools/tools/code-genny
**Status:** stable

## What It Does

Generates barcodes in a wide range of 1D and 2D formats from a data string, with configurable scale and height. Supports single barcode preview and download as well as batch ZIP export.

## When to Use

- Generating a Code 128, EAN-13, or UPC-A barcode for a product label or inventory system
- Producing a 2D barcode (Data Matrix, Aztec, PDF417) for document or logistics use
- Creating a batch of barcodes from a list and downloading them as a single ZIP archive

## Browser Mode (Default)

### Inputs

- **Data field:** text input labelled "Data" — enter the string to encode (e.g. `012345678905` for EAN-13)
- **Format selector:** dropdown listing all supported formats: Code 128, EAN-13, UPC-A, Data Matrix, Aztec, PDF417, QR Code, and more
- **Scale slider:** controls the module size (pixel multiplier); range 1–10
- **Height slider:** controls the bar height in modules for 1D formats; range varies by format
- **Batch text area** (Batch mode): one data string per line

### Step-by-Step

1. Navigate to https://delphi.tools/tools/code-genny
2. Type or paste the data string into the **Data** field
3. Select the desired barcode format from the **Format** dropdown (e.g. **Code 128**)
4. Adjust the **Scale** slider for the desired resolution (3–4 is typical for screen use; 5+ for print)
5. For 1D formats (Code 128, EAN-13, UPC-A), adjust the **Height** slider if needed
6. The barcode preview updates live in the preview panel
7. Click **Download PNG** or **Download SVG** to save the barcode
8. For multiple barcodes: switch to **Batch** mode, paste one data string per line, then click **Download ZIP**

### Output

- **Single:** barcode image preview; downloadable as PNG or SVG
- **Batch:** ZIP archive containing one PNG file per input line

### Options

- **Format:** Code 128, EAN-13, UPC-A, Data Matrix, Aztec, PDF417, QR Code (and additional formats available in the dropdown)
- **Scale:** pixel multiplier per module (higher = larger image)
- **Height:** bar height for 1D symbologies

## Advanced Mode (Node.js/CLI)

### Underlying Library

`bwip-js` 4.8.0 (CommonJS)

### Recipe

```js
// install: npm install bwip-js
const bwipjs = require('bwip-js');
const fs = require('fs');

// PNG output via callback
bwipjs.toBuffer(
  {
    bcid: 'code128',   // barcode type identifier (see bwip-js docs for full list)
    text: 'ABC-12345', // data to encode
    scale: 3,          // module size multiplier
    height: 10,        // bar height in millimetres (1D formats)
    includetext: true, // render human-readable text below barcode
    textxalign: 'center',
  },
  (err, png) => {
    if (err) throw err;
    fs.writeFileSync('barcode.png', png);
    console.log('Saved barcode.png');
  }
);

// SVG output (synchronous)
const svg = bwipjs.toSVG({
  bcid: 'ean13',
  text: '012345678905',
  scale: 3,
  includetext: true,
});
fs.writeFileSync('barcode.svg', svg);
console.log('Saved barcode.svg');

// Common bcid values:
// 'code128'    → Code 128
// 'ean13'      → EAN-13
// 'upca'       → UPC-A
// 'datamatrix' → Data Matrix
// 'azteccode'  → Aztec
// 'pdf417'     → PDF417
// 'qrcode'     → QR Code
```

### Wrapper Script

`${CLAUDE_SKILL_DIR}/scripts/generate-barcode.mjs`

### Notes

- `bcid` values are lowercase with no hyphens; see the full list at https://bwip-js.metafloor.com/?demo (or the bwip-js README).
- EAN-13 requires exactly 12 digits in `text` (the 13th check digit is computed automatically); UPC-A requires exactly 11 digits.
- `toBuffer` is async (callback-based); `toSVG` is synchronous.
- For batch generation, loop over an array of strings, call `toBuffer` for each, and collect the PNG buffers before writing or zipping.
- The `height` option is in millimetres for most 1D symbologies; `scale` multiplies the entire image. For print at 300 dpi, use `scale: 10` and `height: 15`.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
