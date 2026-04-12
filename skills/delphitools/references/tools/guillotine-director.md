# Guillotine Director

**Category:** Print and Production
**URL:** https://delphi.tools/tools/guillotine-director
**Status:** new

## What It Does

Guides an operator through a step-by-step guillotine cutting workflow for imposed print sheets. Uses a fixed preset of 2x A4 landscape on SRA3 portrait with 3mm bleed and provides four illustrated cutting steps with checkboxes.

## When to Use

- You have printed an imposed sheet with 2x A4 landscape pages on SRA3 portrait stock with 3mm bleed and need step-by-step cutting guidance.
- You are training a new operator on the correct cutting sequence for this imposition.
- You want a checklist to ensure no cutting step is skipped or done out of order.

## Browser Mode

### Inputs

- No file upload or text input is required.
- **Step checkboxes** — one checkbox per cutting step; check each off as it is completed.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/guillotine-director
2. The preset card shows: Sheet 320x450mm, Product 297x210mm, Bleed 3mm, Layout 1x2, Margins 8.5mm (W) / 9mm (H).
3. Click the "Start Cutting" button.
4. **Step 1 of 4 — "Trim the first margin"**: Align the long edge (450mm) with the fence. Measure from fence to the crop mark closest to you. Expected distance ~311.5mm. Enter your measurement in the mm field and click "Next Step".
5. **Step 2 of 4 — "Trim the second margin"**: Rotate the sheet. Align the long edge with the fence again. Measure and cut the opposite margin. Click "Next Step".
6. **Step 3 of 4 — "Separate the products"**: Cut along the centre line to split the two A4 pages apart. Click "Next Step".
7. **Step 4 of 4 — "Trim the bleed"**: Trim the 3mm bleed from the remaining edges of each product. Click "Next Step" to complete.
8. The progress bar at the bottom shows all 4 steps: each has a numbered circle that fills as you complete it.

### Output

- **Step diagrams** — visual illustration of the sheet and cut line for each step.
- **Progress indicator** — checkboxes show which steps are complete.

### Options

- No configurable options. The preset (2x A4 landscape on SRA3 portrait, 3mm bleed) is fixed.

## CLI Mode (Node.js)

N/A — interactive checklist with diagrams; no programmatic API. Use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
