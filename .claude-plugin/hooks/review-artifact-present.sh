#!/usr/bin/env bash
# review-artifact-present.sh — the REVIEW-stage gate.
#
# Takes a path to a main dossier file (argv, for CLI-testability) and verifies
# that its folder holds a review artifact in which every finding carries a
# disposition. Exits 1 with an explanation on stderr when it does not.
#
# WHAT THIS CHECKS, AND WHAT IT DELIBERATELY DOES NOT
#
# It checks a *file-level fact*: does a review artifact exist next to this
# dossier, and does every finding in it record what was decided. That is the
# same shape as sources-index-consistency.sh (does a directory match its own
# index) and deliberately NOT the shape of the six grep-gates removed on
# 2026-04-18, which matched document prose and were overfit as a result.
#
# It does NOT check that the review is semantically current. No file-level
# check can. A rewrite of the dossier after review leaves this gate satisfied.
# Staleness is surfaced as a warning, never as a block — see below.
#
# WHY THERE IS NO MTIME GATE
#
# The obvious check — "the review must be newer than the dossier" — is wrong,
# and it took writing this script to see it. The correct workflow is review →
# findings → fix the dossier, which necessarily leaves the dossier newer than
# the review that prompted the fixes. An mtime gate would therefore fire on
# every properly-executed review and pass only when the author changed nothing.
# It would invert the behaviour it is meant to enforce.

set -euo pipefail

dossier="${1:-}"

if [[ -z "$dossier" ]]; then
  echo "usage: review-artifact-present.sh <path-to-dossier.md>" >&2
  exit 2
fi

name=$(basename "$dossier")
dir=$(dirname "$dossier")

# Self-gate: main dossiers only. Ballots are reviewed as part of the dossier
# they accompany, and follow-ups get their own review when they are their own
# document.
if [[ "$name" != DOSSIER-*.md ]]; then
  exit 0
fi
if [[ "$name" == *-BALLOT-*.md ]]; then
  exit 0
fi

# Find review artifacts: review-YYYY-MM-DD.md alongside the dossier.
shopt -s nullglob
artifacts=("$dir"/review-*.md)
shopt -u nullglob

if [[ ${#artifacts[@]} -eq 0 ]]; then
  cat >&2 <<EOF
REVIEW GATE: no review artifact for $name

  Expected: $dir/review-<YYYY-MM-DD>.md

  The REVIEW stage runs three fresh-context subagents (Shape, Support,
  Insights) over the finished dossier and records their findings with a
  disposition each. See references/review-lenses.md for the lens prompts and
  the artifact format.

  This gate exists because DELIVER's "run the checklist" instruction is a rule,
  not a gate: it can be answered affirmatively without the work being done.
EOF
  exit 1
fi

# Newest artifact by filename (dates sort lexically in ISO form).
artifact=$(printf '%s\n' "${artifacts[@]}" | sort | tail -1)

# Every finding needs a disposition. Findings are "### F<n> — title" headings;
# dispositions are "**Disposition:** fixed|waived — <reason>" lines.
findings=$(grep -c '^### F[0-9]' "$artifact" || true)
disposed=$(grep -cE '^\*\*Disposition:\*\* (fixed|waived) — .+' "$artifact" || true)

if [[ "$findings" -ne "$disposed" ]]; then
  cat >&2 <<EOF
REVIEW GATE: $(basename "$artifact") has $findings finding(s) but $disposed disposition(s)

  Every finding needs a line of the form:
    **Disposition:** fixed — <what changed>
    **Disposition:** waived — <why this is not a defect>

  Waiving is a legitimate outcome. A fresh-context reviewer sometimes flags a
  correctly-cited claim it could not verify, and forcing a "fix" there would
  make the dossier worse. What the gate requires is a decision, not agreement.
EOF
  exit 1
fi

# Staleness is a warning, never a block — see the header note. A dossier
# rewritten well after its review is the case this cannot prove, so it says so
# rather than pretending otherwise.
if [[ -f "$dossier" ]]; then
  artifact_date=$(basename "$artifact" .md | sed 's/^review-//')
  if [[ "$artifact_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    artifact_epoch=$(date -j -f "%Y-%m-%d" "$artifact_date" "+%s" 2>/dev/null || echo 0)
    dossier_epoch=$(stat -f %m "$dossier" 2>/dev/null || echo 0)
    if [[ "$artifact_epoch" -gt 0 && "$dossier_epoch" -gt 0 ]]; then
      age_days=$(( (dossier_epoch - artifact_epoch) / 86400 ))
      if [[ "$age_days" -gt 14 ]]; then
        echo "REVIEW GATE (warning): $name was edited ${age_days} days after $(basename "$artifact"). Re-review if the changes were substantive." >&2
      fi
    fi
  fi
fi

exit 0
