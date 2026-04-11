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

## Browser Mode (Default)

### Inputs

- No file upload or text input is required.
- **Step checkboxes** — one checkbox per cutting step; check each off as it is completed.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/guillotine-director
2. The fixed preset is displayed: 2x A4 landscape imposed on SRA3 portrait with 3mm bleed.
3. Review the four cutting steps shown in sequence. Each step includes a diagram illustrating the cut position and direction.
4. Perform the physical cut described in Step 1: **Trim first margin** — cut along the first outer edge.
5. Check the checkbox for Step 1 to mark it complete.
6. Perform the cut described in Step 2: **Trim second margin** — cut along the opposite outer edge.
7. Check the checkbox for Step 2.
8. Perform the cut described in Step 3: **Separate products** — cut along the centre line to split the two A4 pages apart.
9. Check the checkbox for Step 3.
10. Perform the cut described in Step 4: **Trim bleed** — cut the 3mm bleed from the remaining edges of each product.
11. Check the checkbox for Step 4.
12. All steps checked — the workflow is complete.

### Output

- **Step diagrams** — visual illustration of the sheet and cut line for each step.
- **Progress indicator** — checkboxes show which steps are complete.

### Options

- No configurable options. The preset (2x A4 landscape on SRA3 portrait, 3mm bleed) is fixed.

## Advanced Mode (Node.js/CLI)

N/A — interactive checklist with diagrams; no programmatic API. Use Browser Mode.
