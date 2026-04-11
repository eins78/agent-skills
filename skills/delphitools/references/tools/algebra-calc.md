# Algebra Calculator

**Category:** Calculators
**URL:** https://delphi.tools/tools/algebra-calc
**Status:** stable

## What It Does

Performs symbolic algebra and calculus operations on mathematical expressions, returning LaTeX-rendered results. Supports simplification, expansion, factoring, equation solving, differentiation, and integration.

## When to Use

- Simplifying, expanding, or factoring a polynomial or trigonometric expression
- Solving an equation or system of equations for a variable
- Computing a derivative or indefinite integral symbolically

## Browser Mode

### Inputs

- **Operation tabs:** Simplify | Expand | Factor | Solve | d/dx | integral
- **Expression text field:** accepts expressions using `x^2`, `sin(x)`, `sqrt(x)`, `pi`, `e`
- **Example buttons:** pre-filled expression snippets shown below the text field (click to load)

### Step-by-Step

1. Navigate to https://delphi.tools/tools/algebra-calc
2. Click the operation tab that matches what you want: **Simplify**, **Expand**, **Factor**, **Solve**, **d/dx**, or **integral**
3. Click the expression text field (labelled "Enter expression") and type your expression (e.g. `(x+1)^2 - x^2`)
4. Optionally click one of the **Example** buttons to load a sample expression
5. Click the **Calculate** button (or press Enter)
6. Read the result in the output panel below the button

### Output

A LaTeX-rendered result displayed via KaTeX. Copy the rendered math or the raw expression string from the output panel.

### Options

- **Operation tab** (Simplify / Expand / Factor / Solve / d/dx / integral): selects which operation is applied
- **Expression syntax reference** link next to the text field: opens a quick-reference for supported syntax (`x^2`, `sin(x)`, `sqrt(x)`, `pi`, `e`, etc.)

## CLI Mode (Node.js)

### Underlying Library

`nerdamer` 1.1.13 (CommonJS)

### Recipe

```js
// install: npm install nerdamer
const nerdamer = require('nerdamer');
require('nerdamer/Algebra');
require('nerdamer/Calculus');
require('nerdamer/Solve');

// Expand
const expanded = nerdamer('(x+1)^2 - x^2').expand().toString();
console.log(expanded); // => "1+2*x"

// Simplify
const simplified = nerdamer('2*x + 3*x').toString();
console.log(simplified); // => "5*x"

// Factor
const factored = nerdamer.factor('x^2 - 1').toString();
console.log(factored); // => "(x-1)*(x+1)"

// Solve
const solutions = nerdamer.solve('x^2 - 4', 'x');
console.log(solutions.toString()); // => "[2,-2]"

// Derivative (d/dx)
const deriv = nerdamer('diff(x^3 + sin(x), x)').toString();
console.log(deriv); // => "3*x^2+cos(x)"

// Integral
const integral = nerdamer('integrate(x^2, x)').toString();
console.log(integral); // => "x^3/3"
```

### Wrapper Script

`${CLAUDE_SKILL_DIR}/scripts/algebra.mjs`

### Notes

- All four `require` calls are mandatory: load `nerdamer` first, then `Algebra`, `Calculus`, and `Solve` in that order before using those operations.
- nerdamer returns strings in its own notation, not LaTeX; call `.toTeX()` instead of `.toString()` to get LaTeX output.
- Numerical approximations: wrap result with `nerdamer.convertToLaTeX(...)` or call `.evaluate()` to get a decimal.
- nerdamer does not support implicit multiplication (write `2*x`, not `2x`).

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
