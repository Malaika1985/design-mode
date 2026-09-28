#!/usr/bin/env node
/**
 * Dependency-free lint: syntax-check every shipped JS file.
 *
 * design-mode has zero runtime dependencies on purpose, and that is worth
 * keeping for the dev tooling too - a linter config is not worth a
 * node_modules tree for ~700 lines of code.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'bin', 'test', 'tools'];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(mjs|js)$/.test(entry.name) ? [full] : [];
  });
}

const files = DIRS.flatMap((dir) => walk(path.join(root, dir)));
let failed = 0;

for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    failed++;
    console.error(`FAIL ${path.relative(root, file)}`);
    console.error(String(error.stderr || error.message).trim());
  }
}

console.log(`${files.length - failed}/${files.length} files OK`);
process.exit(failed ? 1 : 0);
