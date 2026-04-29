# @eins78/agent-skills

## 2.5.0

### Minor Changes

- [#43](https://github.com/eins78/agent-skills/pull/43) [`5a76700`](https://github.com/eins78/agent-skills/commit/5a7670028b0fb0e097cb36156d7b7a4e556e9711) - Introduce `ballot` skill (v1.0.0) and evolve `dossier` with a preflight gate, clickable citations, and reviewer checklists.

  **`ballot` (new, v1.0.0).** Standalone per-reviewer decision-ballot skill for decisions that happen async — reviewed over chat, on a PR, on a train, after the session ends. Works for single-decider async and multi-reviewer panels alike; reviewer count is incidental to the trigger. Ships with template, conventions doc (one file per decider, empty checkboxes, no anti-options, Must/Should/Could tiers, reconciliation in sessionlog), and an 8-item reviewer checklist. One mechanical gate survives: `ballot-filename.sh` enforces the `DOSSIER-<slug>-BALLOT-<Reviewer>.md` naming pattern. Use cases: ADRs, architecture calls, hiring panels, vendor selection, household decisions, PR review handoffs.

  **`dossier` (evolved).** Step-0 preflight gate — verify the research request is Specific, Unambiguous, and Well-understood; ask before starting if not. Balanced against over-interrogation: "the bar is 'the answer isn't obvious from context,' not 'I want to be extra sure.'" Key Facts box in the template (one screen: who decides, decision model, deadline, hard constraints, audience, 3–5 load-bearing claims). Clickable reference-link citations (`claim [S1][ref-S1]` with `[ref-S1]: url` defined in §Sources — renders as a click-through in GitHub, Obsidian, Bitbucket, and Confluence; backwards-compatible with bare `[Xn]`). Asymmetric template order: Glossary stays at the top (read-support), Sources stays at the end (trust-support). Commercial-bias source-flagging integrated into the reviewer checklist (pattern from the `@young.mete` Threads contribution). New 8-item reviewer checklist replaces the earlier grep-based audit hooks — those were overfit to the a11y-extension session and did not generalize across dossier styles.

  **Hooks.** One mechanical gate (`ballot-filename.sh`), wired PostToolUse on Write|Edit through `dossier-hook-dispatcher.sh` (alerting level, not blocking — the file is on disk when the hook fires; PreToolUse upgrade is future work). Seven pattern-matching hooks that shipped during development were removed as overfit: `dossier-citation-audit.sh`, `dossier-forbidden-words.sh`, `dossier-section-order.sh`, `dossier-dated-claim-scan.sh`, `ballot-anti-option.sh`, `ballot-cover-archaeology.sh`, and `dossier-framing-declared.sh`. The `framing-mode` classification convention (`oss`/`commercial`/`hiring`/`vendor`/`personal`) was removed alongside the last hook — same anti-pattern as the grep gates. Replaced by judgment-capable reviewer checklists at `skills/dossier/references/review-checklist.md` and `skills/ballot/references/review-checklist.md`.

  Minor bump for dossier (1.0.1 → 1.1.0); ballot ships directly at 1.0.0. Plugin minor bump. No breaking changes — existing `dossier` files remain valid; `[Xn]` citations still work but are not clickable until upgraded to `[Sn][ref-Sn]`.

  <!--
  bumps:
    skills:
      dossier: minor
  -->

- [#45](https://github.com/eins78/agent-skills/pull/45) [`bf78f1b`](https://github.com/eins78/agent-skills/commit/bf78f1b088aad959a9d74b4b4017a27b5681fcb3) - Add `evals/` harness for `dossier` + `ballot` skill reviewer-checklists — 16 scorers (10 mechanical + 6 LLM-as-judge), cost-gated via `EVAL_MODE=full`. Runs locally via `pnpm evals`; no CI wiring.

  <!--
  bumps:
    skills: {}
  -->

- [#48](https://github.com/eins78/agent-skills/pull/48) [`7134d48`](https://github.com/eins78/agent-skills/commit/7134d48be633e0c390f3c4af5dca1d1ef4582a61) - Add `pdf-zine` skill — wrapper for the [`pdf2zine`](https://github.com/eins78/pdf2zine) CLI, which converts a PDF into a fold-and-print booklet (A4 sheets, double-sided short-edge flip, fold to A5) using `bookletimposer` and `qpdf` in Docker. Discovery-first description so agents reach for `pdf2zine` instead of hand-rolling Ghostscript or `pdfjam` imposition scripts. Covers the three CLI flags (`--keep-cover`, `--keep-format`, `--` pass-through) and common pitfalls. A `references/bookletimposer-native.md` doc covers the non-Docker path (apt / from-source `bookletimposer`) for users without Docker.

  Skill name is `pdf-zine` (hyphenated); the wrapped CLI binary remains `pdf2zine`.

  Ships at v1.0.0. Plugin minor bump.

  <!--
  bumps:
    skills:
      pdf-zine: minor
  -->

## 2.4.1

### Patch Changes

- [`ec71cb1`](https://github.com/eins78/agent-skills/commit/ec71cb1ee54f5d1a8966fd665ebb93625aa06916) - dossier: add commercial bias flagging guidance from [`@young.mete` Threads post](https://www.threads.com/@young.mete/post/DXPjx_JDuMR)

  Adds source quality heuristic: explicitly flag commercial incentives in dossier
  output rather than silently down-weighting biased sources. Updates
  `sources-by-domain.md` (new Commercial Bias Flagging subsection, expanded Lowest
  tier) and `SKILL.md` (new EVALUATE step bullet).

  <!--
  bumps:
    skills:
      dossier: patch
  -->

## 2.4.0

### Minor Changes

- [#40](https://github.com/eins78/agent-skills/pull/40) [`549cfe3`](https://github.com/eins78/agent-skills/commit/549cfe36615e0353fd704c24b5622322fea0fc50) - `chrome-browser`: expand and consolidate Chrome automation flags — disable password checks, AI mode badge, tab organization, autofill, media routing, background networking, and other UI distractions. Flags organized by category with inline comments.

  <!--
  bumps:
    skills:
      chrome-browser: minor
  -->

## 2.3.1

### Patch Changes

- [#38](https://github.com/eins78/agent-skills/pull/38) [`e27a458`](https://github.com/eins78/agent-skills/commit/e27a4584d58a241f03902b56df232e63ac27ffc3) - Release pipeline: include version in commit message and PR title (e.g. `release: 2.3.0` instead of `chore: release`)

## 2.3.0

### Minor Changes

- [#33](https://github.com/eins78/agent-skills/pull/33) [`5b01b37`](https://github.com/eins78/agent-skills/commit/5b01b375ea74c21dc04413087e8d1fc8d1de465c) - Promote `typescript-strict-patterns` to stable 1.0.0 — graduates from 1.0.0-beta.1 pre-release

  <!--
  bumps:
    skills:
  -->

### Patch Changes

- [#36](https://github.com/eins78/agent-skills/pull/36) [`8dad438`](https://github.com/eins78/agent-skills/commit/8dad438e5717b4521b97a14ed869c396879de5bb) - Fix unbound variable error in `bump-skill-versions.sh` when no skill version bumps are present in changesets

## 2.2.0

### Minor Changes

- [#26](https://github.com/eins78/agent-skills/pull/26) [`a9a9ebc`](https://github.com/eins78/agent-skills/commit/a9a9ebcd22ad1758306862e96bd3baf84f3ffa6f) - Add `lab-notes` skill — structured experiment management with Rigorous + Freeform modes, append-only running logs, and formal verdicts

  <!--
  bumps:
    skills:
      lab-notes: minor
  -->

- [#27](https://github.com/eins78/agent-skills/pull/27) [`ab6b1ec`](https://github.com/eins78/agent-skills/commit/ab6b1ec45915cc778cbaa4e29d8c200ede294c89) - Add `pandoc` skill for document format conversion — teaches agents to use pandoc (60+ input, 80+ output formats) instead of writing ad-hoc conversion scripts. Includes curated manual reference, installation guide, and advanced topics (Lua filters, citations, slides, templates).

  <!--
  bumps:
    skills:
      pandoc: minor
  -->

### Patch Changes

- [#28](https://github.com/eins78/agent-skills/pull/28) [`eea8e9b`](https://github.com/eins78/agent-skills/commit/eea8e9becbf749fa538d69ab631ba0b7d61b59ca) - dossier: remove Telegram-specific delivery instruction (delivery is orchestrator's responsibility)

  <!--
  bumps:
    skills:
      dossier: patch
  -->
