# Paste Image

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/paste-image
**Status:** stable

## What It Does

Accepts an image pasted from the clipboard, allows optional cropping via resize handles, and downloads the result as a PNG file.

## When to Use

- You have copied a screenshot or image to the clipboard and want to save it as a PNG file.
- You want to crop the pasted image before saving it.
- You need a quick way to extract an image from the clipboard without opening a full image editor.

## Browser Mode (Default)

### Inputs

- **Keyboard paste** — press Ctrl+V (Windows/Linux) or Cmd+V (macOS) to paste an image from the clipboard. This is the ONLY way to load an image; there is no file picker.
- **Resize handles** — 8 handles on the crop box corners and edges; drag to resize the crop area.
- **Move handle** — drag the crop box itself to reposition it over the pasted image.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/paste-image
2. Copy an image to your clipboard (e.g. take a screenshot, or copy an image from another application).
3. Press Ctrl+V (or Cmd+V on macOS) while the page is in focus. The pasted image appears on the canvas.
4. (Optional) Drag the 8 resize handles to adjust the crop boundary. Drag the crop box to reposition it.
5. Click the Download button to save the cropped image as a PNG file.

### Output

- **PNG file download** — the cropped region of the pasted image saved as a .png file.

### Options

- Crop box with 8 resize handles and move interaction — optional; skip cropping to download the full pasted image.

## Advanced Mode (Node.js/CLI)

N/A — requires the browser Clipboard API to read image data from the clipboard. Use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
