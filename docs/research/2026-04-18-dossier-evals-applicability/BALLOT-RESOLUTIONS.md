# Ballot resolutions — post-return clarifications

Short notes on points that were underspecified in the returned ballot and were resolved by a follow-up round between Max and the homebot. These are NOT new decisions; they refine the stack choice so the follow-up PR can start without re-asking.

## DEC-2 (b) `evalite` + free-text "use bun if possible" → shape (i)

**Resolved 2026-04-18 via Telegram.**

> yes, (i) - bun as runtime and package manager. in case of any incompatibilities switch to node.
> — Max, message_id 2009

**Concretely:**

- Package manager: `bun install` (not `pnpm`)
- Runtime: `bun` (not `node`)
- Test framework: `evalite` (Vitest-based, unchanged)
- Invocation: `bun x evalite` or `bun run <script>` wrapping `evalite`
- Fallback: if `bun` + `evalite` + `@anthropic-ai/sdk` show any incompatibility, switch to `node` + `pnpm`. The fallback is a stack swap, not a DEC re-open.

## DEC-3 (c) FULL coverage — 16 scorers

**Not resolved here — left as-decided.** The dossier noted that 8 LLM-as-judge scorers × API cost per run is material. Suggest the follow-up PR wires all 16 but gates the expensive judge scorers behind a `--full` flag so local iteration stays cheap. Exact cost-control shape is a delegate decision, not a ballot redo.
