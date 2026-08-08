# REVIEW lenses — dispatching the three reviewers

The REVIEW stage runs between SYNTHESIZE and DELIVER. It exists because the
checklist that preceded it was a *rule*: DELIVER said to run it, and "did I run
it?" could be answered affirmatively without the work being done. The gate at
`review-artifact-present.sh` closes that, and this file is what the gate assumes
you did.

## The one rule that makes this work

**The reviewers must not receive the research conversation.**

Not the transcript, not a summary of your reasoning, not "here's what I found and
why". Only the artifacts named in the table below.

This is the whole mechanism, and it is worth being precise about why. The defect
this stage was built for — an insight closing with an unresearched absence claim —
was invisible to its author because the author half-remembered reading the
relevant sources and the claim *felt* safe. A reviewer holding that reasoning
inherits the feeling. A reviewer holding only the document asks the question the
reader asks: **was I shown the basis for this?**

Dispatching a subagent gives you fresh context by construction. Do not undo that
by pasting your notes into the prompt.

## The three lenses

Dispatch all three in a single message so they run concurrently. They are
independent; there is nothing to serialize.

| Lens | Receives | Must not receive |
|---|---|---|
| **Shape** | the original request/brief + the dossier | the research, the sources |
| **Support** | the dossier + `sources/` | the research, the brief |
| **Insights** | the dossier, and nothing else | everything else |

### Why Insights is deliberately starved

Handing the Insights reviewer `sources/` would let it verify a claim the *document*
never cited — and then pass something the reader cannot verify. "Was the reader
shown the basis for this?" is a question about the document's face, so the reviewer
must be limited to the document's face.

This is the lens that catches stance defects, and its blindness is the reason it
can.

### Why Support does not get the brief

A reviewer that knows what the reader wanted starts judging whether claims are
*relevant*, which is Shape's job, and stops tracing whether they are *supported*.
Each lens is narrow so that it goes deep.

## Prompts

Substitute the real paths. Keep the "do not infer" clause — it is what stops a
reviewer from reconstructing the author's reasoning and re-acquiring the blind
spot.

### Shape

> Read the brief at `<path>` and the dossier at `<path>`. You have not seen the
> research and must not infer it.
>
> Judge only whether this is the document the brief asked for:
> 1. **Genre.** Does a research request get a survey that lets the reader
>    conclude, or a decision request get ranked options and a recommendation? A
>    mismatch is the only finding that means rebuilding rather than editing —
>    report it first.
> 2. **Skimmability.** Can a reader find a topic from the headings alone? Section
>    headings should name subjects, not state conclusions.
> 3. **Order.** Does anything adjudicate before the reader has the evidence?
> 4. **Key Facts box.** Is every field accurate against the body, and are the
>    fields the ones this genre calls for?
>
> Report findings only. Do not fix anything. If the document matches the brief,
> say so and stop — do not manufacture findings to seem useful.

### Support

> Read the dossier at `<path>` and the archived sources in `<path>/sources/`.
> You have not seen the research and must not infer it.
>
> Trace claims to sources:
> 1. **Uncited assertions.** Any factual claim with no citation.
> 2. **Citation mismatch.** Any claim whose cited source does not actually say it,
>    or says it more weakly.
> 3. **Absence claims.** Any statement that something *has not* happened, *is not*
>    discussed, or has been *ignored*. These require having searched. Flag every
>    one and say whether the sources show a search was done.
> 4. **Dated claims.** Anything whose truth depends on a date, checked against the
>    stated research window.
>
> Where `sources/` is thin or a capture failed, say the claim is unverifiable from
> the archive rather than calling it unsupported — those are different findings.
>
> Report findings only. Do not fix anything.

### Insights

> Read the dossier at `<path>`. You have only this document. You do not have the
> research, the sources, or the brief, and you must not infer them. Judge the
> document exactly as a reader holding it would.
>
> For the `## Insights` section, check three directions:
> 1. **Inversion.** Would removing an insight change a finding or a
>    recommendation? If yes, it is a buried finding sitting below the conclusion
>    where the reader never reaches it. It belongs in the body.
> 2. **Reachability.** Is each insight teased from the body at least once, at a
>    paragraph end rather than mid-argument?
> 3. **Stance.** Does any insight assert something this document never
>    established — about the subject, the state of a debate, or what someone has
>    failed to notice? **Check the last sentence of each insight hardest.** That is
>    where a paragraph of sound facts turns into a verdict the reader was not shown
>    the basis for. Absence claims are the usual shape.
>
> Then apply the stance check to the whole document: in a research-genre dossier
> there is no assessment section, so any verdict anywhere is suspect.
>
> Report findings only. Do not fix anything.

## Scaling

| Dossier | Reviewers |
|---|---|
| Anything a human will read — Kindle, shared file, ballot attached | all three |
| Short or internal (under ~200 lines, no `sources/`) | one combined reviewer running all three lenses |

Review is never skipped. "This one is internal" is precisely the reasoning that
skips review on the dossier that then gets forwarded — and the cost of one
combined reviewer is small enough that the exemption buys nothing worth having.

## The artifact

Write `review-YYYY-MM-DD.md` into the dossier folder. The gate parses it, so the
two marked lines are load-bearing:

```markdown
# Review — <Dossier Title>

**Dossier:** DOSSIER-Title-2026-08-08.md
**Lenses run:** shape, support, insights
**Reviewers:** three fresh-context subagents

### F1 — insight I4 closes on an unresearched absence claim
**Lens:** insights
**Finding:** I4's final sentence states the public debate has proceeded
"without much reference" to the Vela monument. Nothing in the document
establishes that a search was done.
**Disposition:** fixed — replaced with the documented asymmetry; moved the
open question to "What could not be determined"

### F2 — S4 cited for a stronger claim than it makes
**Lens:** support
**Finding:** The body reads the source as establishing X; the archived page
says X is "likely".
**Disposition:** waived — the body already hedges in the preceding sentence,
which the reviewer did not have in view
```

When nothing is found, write `**Findings:** none` and no `### F` headings. That
passes the gate — an empty review is a real outcome, and inventing findings to
look thorough is its own defect.

**Every finding needs `**Disposition:** fixed — …` or `**Disposition:** waived — …`
with a reason after the dash.** The gate counts headings against dispositions and
blocks the commit if they differ.

## Waiving is legitimate

A fresh-context reviewer will sometimes flag a correctly-cited claim it could not
verify — that is the direct cost of the isolation that makes it useful. Forcing a
"fix" there would make the dossier worse.

What the gate requires is a **decision**, not agreement. Writing "waived because X"
is the work; it is harder to fake than "checklist run", which is the whole reason
this replaced the checklist.

## What this stage cannot do

It cannot prove the review is *current*. A dossier rewritten after review leaves
the gate satisfied, and no file-level check can detect that — the gate warns when a
dossier was edited more than 14 days after its review and otherwise stays quiet.
This checks that review *happened* and was *dispositioned*. Keeping it honest about
its own limit is why it is a narrow gate rather than a broad one that would need
exceptions.
