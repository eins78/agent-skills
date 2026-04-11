# Placeholder Genny

**Category:** Images and Assets
**URL:** https://delphi.tools/tools/placeholder-genny
**Status:** stable

## What It Does

Generates placeholder images for mockups and wireframes at a specified size and colour. Outputs a downloadable PNG and an SVG data URI for inline use in HTML or CSS.

## When to Use

- You need a placeholder image at a specific pixel size during design or development.
- You want a placeholder with a custom background and text colour instead of a generic grey block.
- You need an SVG data URI to use directly as a `src` or `background-image` value in code.

## Browser Mode (Default)

### Inputs

- **Width input** — numeric field for the image width in pixels.
- **Height input** — numeric field for the image height in pixels.
- **Background colour picker** — click to choose the background fill colour.
- **Text colour picker** — click to choose the colour of the dimension label text overlaid on the image.
- **Custom text input** — optional; type custom label text to display instead of the default dimension string (e.g. "Hero Image").

### Step-by-Step

1. Navigate to https://delphi.tools/tools/placeholder-genny
2. Enter the desired width in the Width input field (in pixels).
3. Enter the desired height in the Height input field (in pixels).
4. (Optional) Click the background colour picker to choose a background colour.
5. (Optional) Click the text colour picker to choose a text label colour.
6. (Optional) Type a label in the Custom text input to override the default dimension label.
7. The placeholder image preview updates live in the preview area.
8. Click the Download PNG button to save the placeholder as a .png file.
9. Click the Copy SVG Data URI button to copy the SVG data URI string to the clipboard.

### Output

- **Image preview** — live preview of the placeholder at the specified dimensions and colours.
- **PNG download** — the Download PNG button saves the placeholder as a .png file.
- **SVG data URI** — the Copy SVG Data URI button copies a data URI string suitable for use as an `src` attribute or CSS `background-image` value.

### Options

- Width and height fields: set pixel dimensions.
- Background colour picker: set the fill colour.
- Text colour picker: set the label text colour.
- Custom text input: override the default dimension label.

## Advanced Mode (Node.js/CLI)

N/A — uses custom Canvas rendering for PNG generation. Use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
