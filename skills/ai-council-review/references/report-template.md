# Report Template

Structure for `report.md` written into the run directory at synthesis time.
Sections in this order; omit a section only when it is genuinely empty.

```markdown
# Council Review: <what was reviewed>

<one-paragraph overall assessment and recommendation>

## Run

| | |
|---|---|
| Reviewed | <description from request-meta.json> |
| Rubric / preset | <rubric> / <preset> |
| Council | <M> of <roster size> members delivered (<list failed members, if any>) |
| Cost | actual $X.XX (estimated $Y.YY) |
| Run dir | <RUN_DIR> |

## Verdict matrix

| Member | Verdict | Findings | Summary (1 line) |
|---|---|---|---|
| <model> | request_changes | 4 | <its own summary, compressed> |
...one row per delivered member; failed members listed as "— failed: <reason>"

## Findings

Ranked by: verified > severity > agreement > confidence.

### 1. <title>  `<severity>` — <N>/<M> members — VERIFIED
- **Where**: <file:lines or section>
- **Raised by**: <members>
- **Issue**: <merged description, best wording wins>
- **Verification**: <what you checked in the repo, with the confirming lines quoted>
- **Suggested fix**: <best suggestion across members, attributed if notable>

### 2. ... (same shape; verification line says REFUTED→appendix, or UNCERTAIN + what would settle it)

## Contested

### <title>
- **Position A** (<members>): <strongest form>
- **Position B** (<members>): <strongest form>
- **Adjudication**: <repo-informed call, marked "verified" or "judgment">

## Minority reports

<verified or plausible 1/M findings that did not make the top list but deserve eyes>

## Recommended actions

1. <ordered, concrete, smallest-first — what the human should actually do>

## Appendix

### Refuted findings
- <title> (<members>) — refuted because <mechanism>

### Per-member summaries
- **<model>**: <its full summary verbatim>

### Estimate calibration
estimated $Y.YY vs actual $X.XX (<+/-Z%>)
```
