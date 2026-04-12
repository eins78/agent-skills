# Browser Automation Patterns for DelphiTools

Reusable Playwright MCP patterns for Browser Automation Mode (the primary mode) when interacting with DelphiTools at https://delphi.tools.

## Navigate to a Tool

```
mcp__playwright__browser_navigate url="https://delphi.tools/tools/{tool-id}"
```

Wait for the page to load, then use `mcp__playwright__browser_snapshot` to see the current UI state.

## Pattern 1: Text Input

**Used by:** colour-converter, contrast-checker, tailwind-shades, harmony-genny, px-to-rem, line-height-calc, typo-calc, base-converter, time-calc, unit-converter, encoder, regex-tester, sci-calc, algebra-calc, word-counter, qr-genny, code-genny, meta-tag-genny

**Steps:**
1. Take a snapshot to find the text input field's `ref` attribute
2. Use `mcp__playwright__browser_fill_form` with the field ref and value
3. Take another snapshot to read the output

## Pattern 2: File Upload

**Used by:** social-cropper, matte-generator, scroll-generator, watermarker, svg-optimiser, image-converter, image-splitter, image-tracer, image-clipper, artwork-enhancer, background-remover, favicon-genny, pdf-preflight, imposer, zine-imposer, font-explorer, colorblind-sim

**Steps:**
1. Take a snapshot to find the file input area (usually labelled "Drop file here" or "click to select")
2. Use `mcp__playwright__browser_file_upload` with the file path
3. Wait for processing (take a snapshot after a few seconds)
4. The tool will show results — take a snapshot to verify

**Note:** SVG Optimiser also accepts paste into a textarea (Pattern 1) as an alternative to file upload.

## Pattern 3: Colour Picker / Hex Input

**Used by:** contrast-checker, tailwind-shades, harmony-genny, matte-generator, gradient-genny, watermarker, qr-genny, placeholder-genny

**Steps:**
1. Take a snapshot to find the hex input field's ref
2. Use `mcp__playwright__browser_fill_form` with the hex value (e.g., "#3b82f6")
3. The tool updates in real-time — take a snapshot to see results

## Pattern 4: Tab / Mode Selection

**Used by:** encoder (Base64/URL/Hash), qr-genny (Single/vCard/Batch), algebra-calc (Simplify/Expand/Factor/Solve/d-dx/integral), imposer (layout types)

**Steps:**
1. Take a snapshot to find the tab trigger's ref (look for TabsTrigger elements)
2. Use `mcp__playwright__browser_click` on the desired tab ref
3. Take a snapshot — the content area updates with the new mode

## Pattern 5: Slider Adjustment

**Used by:** qr-genny (size, padding), image-converter (quality), imposer (margins, gutter), watermarker (opacity, scale)

**Steps:**
1. Take a snapshot to find the slider's ref
2. Use `mcp__playwright__browser_click` on the slider ref to focus it
3. Use `mcp__playwright__browser_press_key` with "ArrowRight" or "ArrowLeft" to adjust
4. Take a snapshot to verify the new value

## Pattern 6: Download Result

**Used by:** Most tools that produce output files

**Steps:**
1. Take a snapshot to find the download button's ref (usually labelled "Download" with the file type)
2. Use `mcp__playwright__browser_click` on the download button ref
3. The file saves to the browser's default downloads directory

## Pattern 7: Copy Result

**Used by:** colour-converter, encoder, meta-tag-genny, contrast-checker, tailwind-shades, harmony-genny, regex-tester, algebra-calc

**Steps:**
1. Take a snapshot to find the copy button's ref (usually a clipboard icon next to the output)
2. Use `mcp__playwright__browser_click` on the copy button ref
3. The text is now in the clipboard

## Pattern 8: Button Selection (Radio-style)

**Used by:** qr-genny (dot style, eye style), imposer (orientation, duplex), algebra-calc (operation type)

**Steps:**
1. Take a snapshot to find the button group
2. Use `mcp__playwright__browser_click` on the desired option's ref
3. Take a snapshot to confirm selection (active button is visually highlighted)

## General Tips

- **Always take a snapshot first** before interacting with any element. The UI ref attributes change between page loads.
- **Wait after file uploads** — large files or ML models (background-remover) take time to process.
- **The sidebar is collapsible** — if it obscures content, look for the "Toggle Sidebar" button.
- **Dark mode** — there's a "Toggle theme" button in the top-right corner.
