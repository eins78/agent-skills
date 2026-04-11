# Paper Sizes

**Category:** Typography and Text
**URL:** https://delphi.tools/tools/paper-sizes
**Status:** stable

## What It Does

Provides a reference table of standard paper sizes across A, B, C, and ANSI series, showing dimensions in mm, cm, and inches. Optionally accepts a PDF upload to read and display its page dimensions.

## When to Use

- You need to look up the exact dimensions of a standard paper size (e.g. A4, B5, Letter, Legal).
- You have a PDF and want to confirm what paper size its pages are.
- You need to generate a blank PDF at a specific standard size using pdf-lib.

## Browser Mode

### Inputs

- **Series tabs** — switches between A series, B series, C series, and ANSI series.
- **Search field** — type a size name (e.g. "A4", "Letter") to filter the table.
- **PDF upload button** — optional; upload a PDF file to read its page dimensions.
- **Generate blank PDF button** — creates a blank PDF at the selected size.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/paper-sizes
2. Click a series tab (A, B, C, or ANSI) to browse that series, or type in the search field to filter across all series.
3. The table shows each size name with its dimensions in mm, cm, and inches (portrait orientation).
4. To check a PDF's page size, click the PDF upload button and select a PDF file. The tool reads the page dimensions and highlights the matching row in the table.
5. To generate a blank PDF, select a row by clicking it, then click the Generate blank PDF button. A PDF is created using pdf-lib and downloaded.

### Output

- **Size table** — columns: Size name, Width (mm), Height (mm), Width (cm), Height (cm), Width (in), Height (in).
- **Highlighted row** — when a PDF is uploaded, the matching standard size row is highlighted.
- **Downloaded blank PDF** — a blank PDF file at the chosen dimensions when the generate button is used.

### Options

- Series tabs filter the table to A, B, C, or ANSI series.
- Search field filters rows by name across all series.

## CLI Mode (Node.js)

N/A — pdf-lib is available in Node.js if you only need to generate blank PDFs programmatically, but the reference table and PDF dimension detection require Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
