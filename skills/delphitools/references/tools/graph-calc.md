# Graph Calculator

**Category:** Calculators
**URL:** https://delphi.tools/tools/graph-calc
**Status:** stable

## What It Does

Plots one or more mathematical functions as an interactive SVG graph in the browser. Supports standard functions, constants, and multiple simultaneous curves.

## When to Use

- Visualising a function to understand its shape, roots, or extrema
- Comparing two or more functions on the same axes
- Exporting a clean SVG graph for use in a document or presentation

## Browser Mode (Default)

### Inputs

- **Function expression field(s):** text input(s) labelled "f(x) ="; type any valid expression (e.g. `sin(x)`, `x^2 - 3`, `1/x`)
- **Add function button:** adds a second (or further) expression field below the existing one
- **Remove button (×):** appears next to each field; removes that function from the plot

### Step-by-Step

1. Navigate to https://delphi.tools/tools/graph-calc
2. Click the **f(x) =** text field and type your function expression (e.g. `x^2 - 2*x + 1`)
3. Press Enter or click anywhere outside the field to update the plot
4. To add a second function, click the **+ Add function** button and enter the second expression in the new field
5. Pan the graph by clicking and dragging; zoom with the scroll wheel or pinch gesture
6. To export, click the **Export SVG** button above the graph area; the browser downloads a `.svg` file

### Output

An interactive SVG graph rendered via the mafs library. The graph is pannable and zoomable in the browser. Exported SVG is a vector file suitable for print or web.

### Options

- **Multiple function fields:** plot as many functions as needed by clicking **+ Add function**
- **Pan and zoom:** interact directly with the graph canvas to explore different regions
- **Export SVG:** button above the graph area downloads the current view as an SVG file

## Advanced Mode (Node.js/CLI)

### Underlying Library

mafs (React component library) — requires a React DOM environment.

### Recipe

N/A — mafs renders via React DOM and cannot produce SVG output in a headless Node.js context without a full browser runtime. Use Browser Mode for all graph generation and export.

### Wrapper Script

N/A

### Notes

- mafs has no standalone server-side rendering path; do not attempt to use it with `jsdom` — the output will be incomplete.
- For programmatic SVG graph generation outside the browser, consider `function-plot` (npm) or `chart.js` with the `canvas` package as alternatives.
- The exported SVG preserves the current viewport (pan/zoom position), so pan to the region of interest before exporting.
