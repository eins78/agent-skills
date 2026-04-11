#!/usr/bin/env node
// Wrapper: Base64, URL encoding, and hashing (same as DelphiTools Encoding Tools)
// Reference: ${CLAUDE_SKILL_DIR}/references/tools/encoder.md
//
// Usage:
//   node encode.mjs base64 "Hello World"
//   node encode.mjs base64-decode "SGVsbG8gV29ybGQ="
//   node encode.mjs url "Hello World"
//   node encode.mjs hash "Hello World"

import { createHash } from 'crypto';

const args = process.argv.slice(2);
const mode = args[0];
const input = args.slice(1).join(' ');

if (!mode || mode === '--help' || mode === '-h') {
  console.log(`Usage: node encode.mjs MODE INPUT

Modes:
  base64          Encode text to Base64
  base64-decode   Decode Base64 to text
  url             URL-encode text
  url-decode      URL-decode text
  hash            Generate MD5, SHA-1, SHA-256, SHA-512 hashes

Examples:
  node encode.mjs base64 "Hello World"
  node encode.mjs base64-decode "SGVsbG8gV29ybGQ="
  node encode.mjs url "hello world & more"
  node encode.mjs url-decode "hello%20world%20%26%20more"
  node encode.mjs hash "Hello World"`);
  process.exit(0);
}

if (!input) {
  console.error('Error: Input text is required.');
  process.exit(1);
}

switch (mode) {
  case 'base64':
    console.log(Buffer.from(input).toString('base64'));
    break;

  case 'base64-decode':
    console.log(Buffer.from(input, 'base64').toString('utf8'));
    break;

  case 'url':
    console.log(encodeURIComponent(input));
    break;

  case 'url-decode':
    console.log(decodeURIComponent(input));
    break;

  case 'hash':
    console.log(`MD5:    ${createHash('md5').update(input).digest('hex')}`);
    console.log(`SHA-1:  ${createHash('sha1').update(input).digest('hex')}`);
    console.log(`SHA-256: ${createHash('sha256').update(input).digest('hex')}`);
    console.log(`SHA-512: ${createHash('sha512').update(input).digest('hex')}`);
    break;

  default:
    console.error(`Error: Unknown mode "${mode}". Use --help for usage.`);
    process.exit(1);
}
