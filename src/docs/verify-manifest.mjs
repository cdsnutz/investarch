#!/usr/bin/env node
/**
 * Verifies src/docs/FILE_MANIFEST.md against the working tree.
 *
 *   node src/docs/verify-manifest.mjs
 *
 * Prints both counts, lists any file on disk that the manifest omits and any
 * manifest entry with no file behind it, and exits non-zero on drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const manifestPath = path.join(here, 'FILE_MANIFEST.md');
const SKIP = new Set(['node_modules', '.git', 'dist', '.DS_Store']);

const walk = (dir, base = '') =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const rel = base ? `${base}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(path.join(dir, entry.name), rel) : [rel];
  });

const declared = new Set(
  [...fs.readFileSync(manifestPath, 'utf8').matchAll(/^- `([^`]+)`/gm)].map((m) => m[1])
);
const present = new Set(walk(root));

const missing = [...present].filter((f) => !declared.has(f)).sort();
const stale = [...declared].filter((f) => !present.has(f)).sort();

console.log(`manifest: ${declared.size} entries · working tree: ${present.size} files`);

if (!missing.length && !stale.length) {
  console.log('OK — the manifest matches the working tree exactly.');
  process.exit(0);
}

if (missing.length) {
  console.log(`\nON DISK, NOT IN MANIFEST (${missing.length}) — add these:`);
  missing.forEach((f) => console.log(`  ${f}`));
}

if (stale.length) {
  console.log(`\nIN MANIFEST, NOT ON DISK (${stale.length}) — remove these:`);
  stale.forEach((f) => console.log(`  ${f}`));
}

process.exit(1);