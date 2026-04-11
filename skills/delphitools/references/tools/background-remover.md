# Background Remover

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/background-remover
**Status:** beta

## What It Does

Automatically removes the background from an image using the BRIA RMBG-1.4 machine learning model, running entirely in the browser with no server upload required.

## When to Use

- You need a subject cut out from its background quickly, without uploading to a cloud service.
- You are preparing product photos, portraits, or artwork for transparent-background use in design tools.

## Browser Mode (Default)

### Inputs

- **Image upload area** — drag-and-drop or click to upload; accepts JPEG, PNG, WebP

### Step-by-Step

1. Navigate to https://delphi.tools/tools/background-remover
2. **First-time use only:** the tool downloads the BRIA RMBG-1.4 model (~180 MB) to your browser cache. This happens automatically — wait for the progress indicator to complete before uploading an image. Subsequent visits use the cached model and start instantly.
3. Click the upload area or drag your image file onto it.
4. The tool runs the ML model in the browser. Processing time depends on image size and hardware; a typical photo takes 5–30 seconds.
5. When processing is complete, a **side-by-side preview** appears:
   - Left panel: original image
   - Right panel: result with background removed, shown over a **checkerboard pattern** to indicate transparency
6. Inspect the result in the preview. If edges look rough, consider re-running with a cleaner source image (good contrast between subject and background improves accuracy).
7. Click the **Download** button to save the result as a PNG with a transparent background.

### Output

A single PNG file with the background replaced by transparency (alpha channel).

### Options

No configurable settings — the BRIA RMBG-1.4 model determines the mask automatically.

## IMPORTANT: Licensing

**The BRIA RMBG-1.4 model is licensed CC BY-NC-ND 4.0 — non-commercial use only.**

- You may NOT use this tool for commercial projects, client work, or any output that generates revenue.
- All other DelphiTools code surrounding the model is MIT licensed.
- Check https://huggingface.co/briaai/RMBG-1.4 for the current licence terms before use.

## Advanced Mode (Node.js/CLI)

Use the `@imgly/background-removal-node` package (~289 MB, models bundled):

```js
import { removeBackground } from '@imgly/background-removal-node';
import { readFileSync, writeFileSync } from 'fs';

// Input must be a Blob with an explicit MIME type
const buffer = readFileSync('input.jpg');
const blob = new Blob([buffer], { type: 'image/jpeg' });

const resultBlob = await removeBackground(blob);
const arrayBuffer = await resultBlob.arrayBuffer();
writeFileSync('output.png', Buffer.from(arrayBuffer));
```

**Note:** This is a heavy dependency (289 MB). Prefer Browser Mode for one-off use. Check `@imgly/background-removal-node` licence terms — the same CC BY-NC-ND 4.0 restriction applies to the bundled model.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
