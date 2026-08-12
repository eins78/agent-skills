# QR Code Generator

**Category:** Other Tools
**URL:** https://delphi.tools/tools/qr-genny
**Status:** stable

## What It Does

Generates styled QR codes from URLs, contact cards, or arbitrary text, with extensive visual customisation options. Supports single code generation, vCard building, and batch production with ZIP download.

## When to Use

- Creating a branded QR code (custom colours, dot style, logo) for a URL or contact
- Building a vCard QR code from structured contact fields without writing vCard syntax manually
- Generating multiple QR codes at once from a list (batch mode) and downloading them as a ZIP

## Browser Mode

### Inputs

- **Mode tabs:** Single | vCard Builder | Batch
- **Content field:** text or URL input labelled "Content" (Single mode); or structured fields (vCard mode); or multi-line list (Batch mode)
- **Content type selector** (Single mode): URL | Email | Phone | WiFi | SMS | Geo
- **Quick style buttons:** Classic | Rounded | Dots | Classy | Indigo | Rose | Teal
- **Dot type selector:** Boxy | Bouba | Braille | Calligraph | Kiki | Blobby
- **Eye style selector:** Boxy | Circular | Rounded
- **Pupil style selector:** Square | Circle
- **Foreground colour picker** and **Background colour picker**
- **Transparent background toggle**
- **Error correction selector:** L | M | Q | H
- **Size slider:** 100–1000 px
- **Padding slider:** adjusts quiet zone around the code
- **Logo upload button:** uploads an image file; separate **Logo size slider** and **Logo margin slider** appear after upload

### Step-by-Step

1. Navigate to https://delphi.tools/tools/qr-genny
2. Click the mode tab: **Single**, **vCard Builder**, or **Batch**
3. **Single mode:** select the content type from the **Content type** dropdown (URL, Email, Phone, WiFi, SMS, or Geo), then type or paste content into the **Content** field
   **vCard Builder:** fill in the structured contact fields (Name, Phone, Email, Organisation, URL, Address)
   **Batch mode:** paste one entry per line into the text area
4. Optionally click a **Quick style** button (e.g. **Rounded**) to apply a preset, then adjust individual options as needed
5. Choose **Dot type**, **Eye style**, and **Pupil style** from their respective selectors
6. Set **Foreground** and **Background** colours using the colour pickers; enable **Transparent background** if needed
7. Set **Error correction** level (H recommended when adding a logo)
8. Adjust **Size** and **Padding** sliders to the desired values
9. To add a logo: click **Upload logo**, select an image file, then set **Logo size** and **Logo margin** with the sliders that appear
10. The QR code preview updates live in the preview panel
11. Click **Download PNG**, **Download SVG**, or **Copy** to get the result
    In Batch mode, click **Download ZIP** to get all codes in a single archive

### Output

- **Single / vCard:** QR code preview image; downloadable as PNG, SVG, or copied to clipboard
- **Batch:** ZIP archive (generated via jszip) containing one PNG per entry

### Options

See Inputs section above. Error correction levels: L (7%), M (15%), Q (25%), H (30%) — use H when a logo covers part of the code.

## CLI Mode (Node.js)

### Underlying Library

`qr-code-styling` 1.9.2 — requires `jsdom` and `canvas` polyfills for Node.js use.

### Recipe

```js
// install: npm install qr-code-styling jsdom canvas
const { createCanvas } = require('canvas');
const { JSDOM } = require('jsdom');
const QRCodeStyling = require('qr-code-styling');
const fs = require('fs');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  type: 'canvas',
  data: 'https://example.com',
  dotsOptions: { color: '#000000', type: 'rounded' },
  cornersSquareOptions: { type: 'extra-rounded' },
  cornersDotOptions: { type: 'dot' },
  backgroundOptions: { color: '#ffffff' },
  qrOptions: { errorCorrectionLevel: 'H' },
});

// Render to PNG buffer
qrCode.getRawData('png').then((buffer) => {
  fs.writeFileSync('qrcode.png', buffer);
  console.log('Saved qrcode.png');
});
```

### Wrapper Script

`${CLAUDE_SKILL_DIR}/scripts/generate-qr.mjs`

### Notes

- `qr-code-styling` was built for browser use; the `jsdom` + `canvas` setup above is the minimum shim needed for Node.js.
- The `type: 'canvas'` option is required when running outside a browser; `type: 'svg'` may not render correctly with the jsdom shim.
- For batch generation, loop over an array of inputs and write each output to a numbered file, then zip with the `jszip` or `archiver` package.
- Transparent background: set `backgroundOptions: { color: 'transparent' }` and save as PNG (not SVG) to preserve transparency.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
