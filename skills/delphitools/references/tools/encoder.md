# Encoder

**Category:** Calculators
**URL:** https://delphi.tools/tools/encoder
**Status:** stable

## What It Does

Encodes and decodes text using Base64 and URL encoding, and computes MD5, SHA-1, SHA-256, and SHA-512 hashes — all in one tool with three tabs.

## When to Use

- You need to Base64-encode a string (e.g. for an Authorization header) or decode a Base64 payload.
- You need to URL-encode a query string or decode a percent-encoded URL.
- You need to generate a hash of a string for verification, caching, or comparison purposes.

## Browser Mode (Default)

### Inputs

Each tab has its own text area:
- **Base64 tab** — text area for input + encode/decode toggle.
- **URL Encoding tab** — text area for input + encode/decode toggle.
- **Hashing tab** — text area for the string to hash (no toggle needed; all four algorithms run simultaneously).

### Step-by-Step

1. Navigate to https://delphi.tools/tools/encoder
2. Click the tab for the operation you need: "Base64", "URL Encoding", or "Hashing".

**For Base64:**
3. Click the encode/decode toggle to set the direction ("Encode" or "Decode").
4. Click the text area and type or paste your input.
5. The result appears instantly in the output area below. Click the Copy button to copy it.

**For URL Encoding:**
3. Click the encode/decode toggle to set the direction ("Encode" or "Decode").
4. Click the text area and type or paste your input string or URL.
5. The result appears instantly. Click the Copy button to copy it.

**For Hashing:**
3. Click the text area and type or paste the string to hash.
4. All four hash outputs (MD5, SHA-1, SHA-256, SHA-512) appear simultaneously.
5. Click the Copy button next to any hash algorithm row to copy that hash value.

### Output

- **Base64 / URL Encoding**: a single encoded or decoded string with a Copy button.
- **Hashing**: four labelled rows — MD5, SHA-1, SHA-256, SHA-512 — each with its hash value and a Copy button.

### Options

- Encode/decode toggle (Base64 and URL Encoding tabs) — switches the conversion direction.

## Advanced Mode (Node.js/CLI)

For Base64: use Node.js built-ins.

```js
// Encode
Buffer.from('hello world').toString('base64')
// Decode
Buffer.from('aGVsbG8gd29ybGQ=', 'base64').toString('utf8')
```

For URL encoding: use built-ins.

```js
encodeURIComponent('hello world & more') // encode
decodeURIComponent('hello%20world%20%26%20more') // decode
```

For hashing: use `crypto-js`.

```js
const CryptoJS = require('crypto-js')
CryptoJS.MD5('hello').toString()
CryptoJS.SHA1('hello').toString()
CryptoJS.SHA256('hello').toString()
CryptoJS.SHA512('hello').toString()
```

Wrapper script: `${CLAUDE_SKILL_DIR}/scripts/encode.mjs`

---

**Found an issue with this reference?** Report it at [eins78/agent-skills](https://github.com/eins78/agent-skills/issues) (not the upstream DelphiTools repo). Include: tool name, mode (Browser/Advanced), what went wrong, expected vs actual. Ask the user for approval before filing.
