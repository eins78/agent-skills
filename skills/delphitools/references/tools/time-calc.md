# Time Calculator

**Category:** Calculators
**URL:** https://delphi.tools/tools/time-calc
**Status:** stable

## What It Does

Converts Unix timestamps to human-readable dates, performs date arithmetic, and converts timestamps across timezones using `Intl.DateTimeFormat`.

## When to Use

- You have a Unix timestamp (seconds or milliseconds) and need the corresponding UTC or local date/time.
- You need to calculate the difference between two dates or add/subtract a duration from a known date.
- You are converting a date and time into a specific timezone for display or logging purposes.

## Browser Mode

### Inputs

- **Timestamp or date input field** — enter a Unix timestamp (e.g. `1712534400`) or an ISO 8601 date string (e.g. `2024-04-08T00:00:00Z`).
- **Timezone selector** — choose the target timezone for conversion output.

### Step-by-Step

1. Navigate to https://delphi.tools/tools/time-calc
2. Click the timestamp or date input field and type or paste your value.
   - For a Unix timestamp: enter the integer value (seconds since epoch).
   - For a date: enter an ISO 8601 string such as `2024-04-08T12:00:00Z`.
3. The output panel updates instantly with the converted date and time values.
4. To convert to a specific timezone, click the timezone selector and choose the desired timezone.
5. The output updates to show the date and time in the selected timezone.

### Output

Converted date and time values, including UTC representation, local time, and the selected timezone, along with the Unix timestamp (both seconds and milliseconds forms).

### Options

- **Timezone selector** — choose any IANA timezone (e.g. `America/New_York`, `Europe/Zurich`) to see the time in that zone.

## CLI Mode (Node.js)

N/A — custom implementation, use Browser Mode.

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/CLI), what went wrong, expected vs actual. Ask the user for approval before filing.
