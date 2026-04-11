# Font Explorer

**Category:** Typography and Text
**URL:** https://delphi.tools/tools/font-explorer
**Status:** stable

## What It Does

Explores the contents of a font file. Upload a font to see its metadata table and a live text preview with a custom text input and size slider.

## When to Use

- You have a font file and want to inspect its family name, PostScript name, version, copyright, license, designer, glyph count, and units per em.
- You want to preview how a font renders at different sizes before using it in a project.
- You need to verify font metadata (e.g. license) before embedding a font in a publication.

## Browser Mode (Default)

### Inputs

- **Font file upload button** — click to select a font file (.ttf, .otf, .woff, or .woff2) from disk.
- **Preview text input** — type custom text to render in the uploaded font (default: "The quick brown fox").
- **Size slider** — drag to adjust the preview text size (e.g. 12px to 96px).

### Step-by-Step

1. Navigate to https://delphi.tools/tools/font-explorer
2. Click the font file upload button and select a .ttf, .otf, .woff, or .woff2 file.
3. The tool loads the font using the browser FontFace API and extracts its metadata.
4. The metadata table appears showing: Family name, PostScript name, Version, Copyright, License, Designer, Glyph count, Units per em.
5. The live preview area renders the default preview text in the uploaded font.
6. Type in the preview text input to change the rendered text.
7. Drag the size slider to change the preview text size.

### Output

- **Metadata table** — rows for Family name, PostScript name, Version, Copyright, License, Designer, Glyph count, Units per em.
- **Live text preview** — the custom text rendered using the uploaded font at the chosen size.

### Options

- Preview text input: change the text rendered in the preview.
- Size slider: adjust the preview font size.

## Advanced Mode (Node.js/CLI)

N/A — requires the browser FontFace API for font loading and rendering. Use Browser Mode.
