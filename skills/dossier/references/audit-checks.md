# Audit Checks

Every check below has a runnable script in `.claude-plugin/hooks/`. The scripts are the source of truth; this file documents when to run each and what it enforces. Hook wiring (see `plugin.json`) calls the scripts automatically on Write/Edit of dossier files. Run them manually during synthesis with:

```bash
bash .claude-plugin/hooks/dossier-<check>.sh <dossier.md>
```

All scripts use `#!/usr/bin/env bash` with `set -euo pipefail`, quote all expansions, and avoid `for x in $unquoted` loops.

## Gates (exit 1 on violation)

### Citation integrity — `dossier-citation-audit.sh`

**What.** Every `[Xn]` footnote reference in the body has a matching definition in `## Sources`.

**Pattern.** `[A-Z]+[0-9]+` inside square brackets. Markdown link text like `[GitHub](url)` does not match (requires uppercase letters + digits).

**When.** At the end of §4 SYNTHESIZE, before delivery. On every Write/Edit of a `DOSSIER-*.md` path via hook.

**Example failure.**

```
ERROR: orphan citations in a11y-dossier.md (used in body, not defined in Sources):
  [G6]
```

### Forbidden words — `dossier-forbidden-words.sh`

**What.** The declared framing mode's wordlist does not appear in the dossier (case-insensitive), except on lines tagged `<!-- allow-forbidden -->`.

**Mode resolution.** (1) CLI arg `$2`, (2) YAML frontmatter `framing-mode:`, (3) HTML comment `<!-- dossier-framing-mode: <mode> -->`. If none, the gate skips — SKILL.md §0 makes declaration mandatory separately.

**When.** Before DELIVER. On every Write/Edit of a `DOSSIER-*.md` path via hook.

**Wordlists.** Defined in `framing-modes.md`; the script keeps a parallel copy — changes require updating both files (the Common Mistakes table in SKILL.md flags drift).

### Ballot filename — `dossier-ballot-filename.sh`

**What.** A file whose name contains `BALLOT` matches `DOSSIER-<slug>-BALLOT-<reviewer>.md`. Single-file two-column ballots are rejected.

**When.** On Write/Edit of any file containing `BALLOT`.

### Section order — `dossier-section-order.sh`

**What.** Two rules:

1. A §Glossary / §Key Concepts / §Terminology section (if present) appears **before** §Executive Summary / §Management Summary.
2. §Sources (if present) is the **last** H2 section.

**Rationale.** Glossary is read-support (needed before terms appear); sources are trust-support (consulted when a claim is questioned). The asymmetry is deliberate. Do not move glossary to the back by analogy with sources.

**When.** Before DELIVER. On every Write/Edit of a `DOSSIER-*.md` path via hook.

## Rules with partial gate support

### Dated-claim scan — `dossier-dated-claim-scan.sh`

**What.** Lists every dated claim matching ISO dates, "closes N Month YYYY", "Month DD, YYYY", and "released/launched/shipped/published in YYYY". Exit 0 — always passes.

**Why a gate can't enforce this.** The script cannot decide whether a date is still accurate; only the agent can re-verify against a primary source accessed today. The listing is the gate: every listed line gets a verification decision (re-checked, updated, or removed).

**When.** At the start of §4 SYNTHESIZE, and again before DELIVER if the session has spanned a boundary in time (multi-day, delegated).

### Anti-option guidance (rule only)

Not scripted. `not recommended`, `for completeness`, `maintenance trap`, `obviously wrong` in a ballot options list cost reviewer ticking-time without changing outcomes. SKILL.md's Common Mistakes table flags this; reviewers catch the remainder.

### Time-horizon-per-DEC (rule only)

Not scripted — semantic. One DEC = one decision surface = one time-horizon. Mixing launch-day and 12-month-out items in one multi-select DEC forces reviewers to context-switch. SKILL.md calls this out explicitly in the ballot section.

### Reconciliation in sessionlog (rule only)

Not scripted — convention. Agreement summary and the per-DEC grid live in the sessionlog where the discussion happened, not in a separate reconciliation artefact. SKILL.md's ballot section spells this out.

## Running all checks at once

No wrapper script ships — the hook wiring in `plugin.json` runs the gates per-event. To audit a dossier manually before commit:

```bash
f=research/2026-04-18-example/DOSSIER-Example-2026-04-18.md
bash .claude-plugin/hooks/dossier-citation-audit.sh "$f"
bash .claude-plugin/hooks/dossier-forbidden-words.sh "$f"
bash .claude-plugin/hooks/dossier-section-order.sh "$f"
bash .claude-plugin/hooks/dossier-dated-claim-scan.sh "$f"
# ballot check applies to each ballot file separately:
bash .claude-plugin/hooks/dossier-ballot-filename.sh DOSSIER-Example-BALLOT-Max.md
```

Non-zero exit from any of the gates means do not deliver until resolved.
