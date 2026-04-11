#!/usr/bin/env node
// Wrapper: Symbolic algebra using nerdamer (same library as DelphiTools Algebra Calculator)
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/algebra-calc.md
//
// Usage:
//   node algebra.mjs simplify "(x+1)^2 - x^2"
//   node algebra.mjs solve "x^2 - 5*x + 6 = 0"
//
// Requires: npm install nerdamer@1

const args = process.argv.slice(2);
const operation = args[0];
const expression = args[1];
const variable = args[2] || 'x';

if (!operation || operation === '--help' || operation === '-h') {
  console.log(`Usage: node algebra.mjs OPERATION EXPRESSION [VARIABLE]

Operations:
  simplify    Simplify an expression
  expand      Expand an expression
  factor      Factor an expression
  solve       Solve an equation (use = for equality)
  diff        Differentiate with respect to VARIABLE (default: x)
  integrate   Integrate with respect to VARIABLE (default: x)

Requires: npm install nerdamer@1

Examples:
  node algebra.mjs simplify "(x+1)^2 - x^2"
  node algebra.mjs expand "(x+1)^3"
  node algebra.mjs factor "x^2 - 4"
  node algebra.mjs solve "x^2 - 5*x + 6 = 0"
  node algebra.mjs diff "sin(x)*x^2" x
  node algebra.mjs integrate "x^2" x

Syntax: x^2 (power), sqrt(x), sin(x), cos(x), log(x), pi, e, abs(x)`);
  process.exit(0);
}

if (!expression) {
  console.error('Error: Expression is required.');
  process.exit(1);
}

let nerdamer;
try {
  const mod = await import('nerdamer');
  await import('nerdamer/Algebra.js');
  await import('nerdamer/Calculus.js');
  await import('nerdamer/Solve.js');
  nerdamer = mod.default;
} catch {
  console.error('Error: nerdamer not installed. Run: npm install nerdamer@1');
  process.exit(1);
}

let result;
switch (operation) {
  case 'simplify':
    result = nerdamer(expression).expand().toString();
    break;
  case 'expand':
    result = nerdamer.expand(expression).toString();
    break;
  case 'factor':
    result = nerdamer.factor(expression).toString();
    break;
  case 'solve':
    result = nerdamer.solveEquations(expression).toString();
    break;
  case 'diff':
    result = nerdamer.diff(expression, variable).toString();
    break;
  case 'integrate':
    result = nerdamer.integrate(expression, variable).toString();
    break;
  default:
    console.error(`Error: Unknown operation "${operation}". Use --help.`);
    process.exit(1);
}

console.log(result);
