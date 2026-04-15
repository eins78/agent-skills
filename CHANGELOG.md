# @eins78/agent-skills

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
