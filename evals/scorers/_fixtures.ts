import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_ROOT = resolve(__dirname, "..", "fixtures");

export interface DocInput {
  content: string;
  filename: string;
}

export function readFixture(relativePath: string): string {
  return readFileSync(resolve(FIXTURES_ROOT, relativePath), "utf-8");
}

/** Build a DocInput from a fixture path */
export function fixtureDoc(relativePath: string): DocInput {
  return {
    content: readFixture(relativePath),
    filename: relativePath.split("/").pop() ?? relativePath,
  };
}

/** Build a DocInput with a custom filename (needed for filename-pattern scorer) */
export function fixtureDocWithName(relativePath: string, filename: string): DocInput {
  return { content: readFixture(relativePath), filename };
}

/** Single evalite data row: input doc + expected score (1 = pass criterion, 0 = fail criterion) */
export interface EvalRow {
  input: DocInput;
  expected: 0 | 1;
}

export function passRow(relativePath: string): EvalRow {
  return { input: fixtureDoc(relativePath), expected: 1 };
}

export function failRow(relativePath: string): EvalRow {
  return { input: fixtureDoc(relativePath), expected: 0 };
}
