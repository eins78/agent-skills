# Audit Checks

Every check below has a runnable script in `.claude-plugin/hooks/`. Hook wiring (see `plugin.json`) calls the dispatcher on every Write/Edit; the dispatcher routes to per-file-type checks. This file documents what each check enforces and why.

All scripts use `#!/usr/bin/env bash` with `set -euo pipefail`, quote all expansions, and avoid `for x in $unquoted` loops.

**Rigor level.** Hooks fire `PostToolUse` — exit 2 feeds stderr back to Claude, but the file is already on disk. Alerting-level, not true blocking. PreToolUse upgrade (content inspection + `permissionDecision: "deny"`) is documented future work; the cheapest candidate is `ballot-filename.sh` since the filename is in `tool_input.file_path` before write.

## Dossier gates (run on `DOSSIER-*.md`, non-ballot)

### Framing-mode declared — `dossier-framing-declared.sh`

**What.** A `framing-mode:` YAML-frontmatter field exists (or an `<!-- dossier-framing-mode: ... -->` HTML-comment fallback).

**Why.** Without a declaration, the forbidden-word gate silently exits 0 — a dossier can bypass all vocabulary enforcement by omitting the field. This gate closes the declaration-vs-consequence split; declaration itself is now enforced.

**When.** On every Write/Edit of a non-ballot `DOSSIER-*.md` via hook.

### Citation integrity — `dossier-citation-audit.sh`

**What.** Every `[Xn]` footnote reference in the body has a matching definition in `## Sources`.

**Pattern.** `[A-Z]+[0-9]+` inside square brackets. Markdown link text like `[GitHub](url)` does not match (requires uppercase letters + digits).

**No-op guard.** A dossier with zero `[Xn]` refs emits a stderr warning and exits 0. The warning prompts the author to confirm inline-hyperlink-only was deliberate (otherwise refs may have been written as `[Xn]` but never defined).

**When.** On every Write/Edit of a `DOSSIER-*.md` path via hook.

### Forbidden words — `dossier-forbidden-words.sh`

**What.** The declared framing mode's wordlist does not appear in the dossier (case-insensitive), except on lines tagged `<!-- allow-forbidden -->`.

**Wordlists.** Read from `skills/dossier/references/framing-modes.yaml` at runtime via `yq`. Single source of truth — the YAML is the place to add or remove words.

**Mode resolution.** (1) CLI arg `$2`, (2) YAML frontmatter `framing-mode:`, (3) HTML comment `<!-- dossier-framing-mode: <mode> -->`. If none, the gate skips (`dossier-framing-declared` handles declaration separately). Template-placeholder syntax (`{oss | commercial | ...}`) is also skipped.

**When.** On every Write/Edit of a `DOSSIER-*.md` path via hook.

### Section order — `dossier-section-order.sh`

**What.** Two rules:

1. A §Glossary / §Key Concepts / §Terminology section (if present) appears **before** §Executive Summary / §Management Summary.
2. §Sources (if present) is the **last** H2 section.

**Rationale.** Glossary is read-support (needed before terms appear); sources are trust-support (consulted when a claim is questioned). The asymmetry is deliberate — do not move glossary to the back by analogy with sources.

**When.** On every Write/Edit of a `DOSSIER-*.md` path via hook.

## Ballot gates (run on `DOSSIER-*BALLOT*.md`)

Owned by the `ballot` skill. Summary only; full rationale at `skills/ballot/references/ballot-conventions.md`.

- **`ballot-filename.sh`** — filename must match `DOSSIER-<slug>-BALLOT-<reviewer>.md`. Single-file two-column ballots rejected.
- **`ballot-anti-option.sh`** — option rows with "not recommended", "for completeness", "obviously wrong", or "maintenance trap" require a `<!-- justify: ... -->` comment within 3 lines.
- **`ballot-cover-archaeology.sh`** — cover block (everything before the first `### `) may not contain "updated YYYY-MM-DD", "changes since", "previous version", or "ballot updated".

## Listing-only (never fails)

### Dated-claim scan — `dossier-dated-claim-scan.sh`

**What.** Lists every dated claim matching ISO dates, "closes N Month YYYY", "Month DD, YYYY", and "released/launched/shipped/published in YYYY". Exit 0 always.

**Why a gate can't enforce this.** The script cannot decide whether a date is still accurate; only the agent can re-verify against a primary source accessed today. The listing is the alert: every listed line gets a verification decision (re-checked, updated, or removed).

**When.** At the start of SYNTHESIZE, and again before DELIVER if the session has spanned a boundary in time (multi-day, delegated).

## Conventions enforced as rules only

These live in `skills/dossier/SKILL.md` §Common Mistakes or `skills/ballot/SKILL.md` §Conventions — no hook ships for them because they are semantic or too fragile to machine-check.

- **Time-horizon-per-DEC** — one DEC = one decision surface = one time-horizon. Mixing "launch-day" and "12-month-out" items in one multi-select forces reviewers to context-switch. Convention in the ballot skill.
- **Reconciliation in sessionlog** — not in a third file. Ballots are durable artefacts; reconciliation is a session output. Convention in the ballot skill.
- **Must-tier blocks delivery** — a hook that detects unticked Must items at delivery time would require parsing reviewer intent; too fragile. Prose rule; flag in sessionlog if blocked.
