# Gradient Genny

**Category:** Colour
**URL:** https://delphi.tools/tools/gradient-genny
**Status:** new

## What It Does

Creates CSS gradients in three modes: Linear (colour stops with position sliders), Corners (four corner colour pickers), and Mesh (a 2x2 or 3x3 grid of draggable colour points). Outputs a live CSS string and a downloadable PNG.

## When to Use

- You need a CSS gradient string to use in a stylesheet or design token.
- You want to design a mesh gradient with multiple colour control points.
- You need to export a gradient as a PNG image for use in a raster context.

## Browser Mode (Default)

### Inputs

- **Mode selector** — three modes: Linear, Corners, Mesh.
- **Linear mode inputs**:
  - Colour stop pickers — click each stop to change its colour.
  - Position sliders — drag each stop to change its position along the gradient axis.
  - Angle slider — sets the gradient direction in degrees (0°–360°).
  - Drag-to-reorder — drag stops to change their order.
- **Corners mode inputs**:
  - Four colour pickers, one for each corner (top-left, top-right, bottom-left, bottom-right).
- **Mesh mode inputs**:
  - Grid size toggle — switch between 2x2 and 3x3.
  - Colour point pickers — click each grid point to change its colour.
  - Drag colour points — drag points to reposition them.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/gradient-genny
2. Select a mode using the mode selector: Linear, Corners, or Mesh.
3. **Linear mode**: Click colour stops to set colours, drag stops to set positions, adjust the angle slider for direction.
4. **Corners mode**: Click each of the four corner colour pickers to set corner colours.
5. **Mesh mode**: Choose 2x2 or 3x3, then click each grid point to set its colour. Drag points to reposition them.
6. The gradient preview updates live as you make changes.
7. Click Copy CSS to copy the CSS gradient string. The output respects the global colour notation setting (hex, hsl, etc.).
8. Click Download PNG to save the current gradient preview as a PNG file.

### Output

- **Live preview** — the gradient renders in real time as inputs change.
- **CSS string** — copy button outputs the gradient as a CSS `background` or `background-image` value.
- **PNG download** — exports the rendered gradient as a .png file.

### Options

- Mode selector: Linear, Corners, or Mesh.
- Angle slider (Linear mode only): 0°–360°.
- Grid size (Mesh mode only): 2x2 or 3x3.
- Global colour notation setting affects the format of the copied CSS string.

## Advanced Mode (Node.js/CLI)

N/A — uses custom Canvas rendering and @dnd-kit drag interactions that require a browser DOM. Use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
