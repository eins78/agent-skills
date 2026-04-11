# Scientific Calculator

**Category:** Calculators
**URL:** https://delphi.tools/tools/sci-calc
**Status:** stable

## What It Does

A scientific calculator with a button grid, keyboard input, DEG/RAD toggle, constants picker, and a history log, covering trigonometry, logarithms, powers, roots, factorial, and modulo.

## When to Use

- You need to evaluate a mathematical expression involving trigonometric functions, logarithms, or powers.
- You want to quickly compute a result using physical or mathematical constants (pi, e, etc.) without typing them out.
- You need a running history of recent calculations to reference or reuse intermediate results.

## Browser Mode (Default)

### Inputs

- **Calculator button grid** — click buttons for digits, operators, and functions (sin, cos, tan, log, ln, sqrt, powers, factorial, mod, pi, e).
- **DEG/RAD toggle** — switch between degrees and radians for trigonometric functions.
- **Constants picker** — select a constant (pi, e, etc.) to insert it into the expression.
- **Keyboard input** — type the expression directly using the keyboard; the display updates live.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/sci-calc
2. Select the angle mode using the DEG/RAD toggle (default is DEG).
3. Enter your expression using the button grid, keyboard input, or a combination:
   - Click function buttons (e.g. "sin", "log", "sqrt") to insert them at the cursor.
   - Click the constants picker to insert pi or e.
   - Type digits and operators directly from the keyboard.
4. Press the "=" button or the Enter key to evaluate the expression.
5. The result appears in the display. The history log below records previous calculations.
6. Click any entry in the history log to recall that result into the input.

### Output

- The calculated result in the main display.
- A history log listing all previous expressions and their results for the current session.

### Options

- **DEG/RAD toggle** — controls whether sin/cos/tan interpret angles in degrees or radians.
- **Constants picker** — inserts named constants without manual typing.

## Advanced Mode (Node.js/CLI)

Use the `mathjs` library for programmatic evaluation:

```js
const { evaluate } = require('mathjs')

evaluate('sqrt(16) + 2^3')          // 12
evaluate('sin(90 deg)')              // 1
evaluate('log(100, 10)')             // 2
evaluate('factorial(5)')             // 120
evaluate('12 mod 5')                 // 2
evaluate('pi * e')                   // 8.539734222673566
```

No wrapper script included — `mathjs` is trivial to use inline.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
