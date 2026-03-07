---
name: tracer-bullets
description: >-
  Use when facing technical uncertainty or building a large feature with a natural
  core-plus-extras decomposition. Guides building one thin vertical slice end-to-end
  before widening. Standalone strategy — works with or without Plot workflow.
globs: []
license: MIT
metadata:
  author: eins78
  repo: https://github.com/eins78/skills
  version: 1.0.0-beta.1
compatibility: Designed for Claude Code and Cursor. Works standalone or as a Plot sibling skill.
---

# Tracer Bullets

Build one thin vertical slice through all system layers before widening. Tracer bullets are production code — not prototypes, not spikes. They validate architecture through real integration, then become the foundation for remaining work.

Critical in AI-assisted development, where agents build horizontal layers in isolation and discover integration issues late.

## When to Use

- Solution is NOT a well-trodden path — no established docs, tutorials, or prior art in the codebase
- Feature is large AND has a natural decomposition: MVP core + features on top + nice-to-haves
- Multiple system layers that haven't been integrated before in this codebase
- Uncertainty about whether the proposed architecture will actually work

## When NOT to Use

- Simple CRUD with well-documented patterns
- Single-layer changes (only touches API, only touches UI)
- Small scope where the whole feature IS the thin slice
- Technology and integration patterns are already proven in this codebase

## Process

### Step 1: Identify the Slice

- Which layers does this feature touch? (e.g., DB → API → WebSocket → Client)
- What is the thinnest path through all of them?
- What does proving this path validate?

One request, one flow, one happy path.

### Step 2: Define the Tracer

```
Tracer: Single SSE connection with disconnect detection
Layers: API → WebSocket → EventSource → Client UI
Proves: Backpressure mechanism works across the full connection lifecycle
```

### Step 3: Build It

- Touch every layer, implement the minimum in each
- Real code, not mocks — the point is to prove real integration
- No error handling, no edge cases, no polish
- Test immediately — does one request flow through all layers?

### Step 4: Evaluate and Widen

1. **Record findings** — what worked, what surprised, what needs revision
2. **Next step:** if validating a design, refine the plan. If during implementation, merge the tracer and build on it.
3. **Widen** — add error handling, edge cases, features. Each step builds on the proven foundation.

## Anti-Patterns

- **Building one layer first** — horizontal, not vertical. Delays integration feedback.
- **Throwaway tracer** — tracers are production code. They carry forward.
- **Over-engineered tracer** — if it has error handling and edge cases, it's too wide.
- **Skipping layers** — a tracer that skips a layer proves nothing about integration.
- **Mocking integration points** — real integration is the whole point.

## Plot Integration

When used within the Plot workflow, tracer bullets integrate at two lifecycle positions. Plans can define a `### Tracer` subsection in `## Branches`:

```markdown
### Tracer
- `feature/<slug>-tracer` — <thin slice description>
  Layers: <layer> → <layer> → <layer>
  Proves: <what this validates>
  Status: Not started | In progress | Complete
```

**Pre-approval (Phase: Draft):** Stay on the `idea/<slug>` branch. Build the tracer alongside plan files. Update `Status:` to `Complete`, add a `## Tracer Results` section with findings. Refine the plan, then proceed to review/approve. Tracer code carries forward when the plan PR merges.

**Post-approval (Phase: Approved):** Create `feature/<slug>-tracer` branch from main. Merge the thin slice before creating remaining implementation branches.

`/plot-approve` step 2b suggests a tracer bullet when uncertainty or feature size warrants it.
