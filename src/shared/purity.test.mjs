// D-161: everything in src/shared/ is pure — plain JavaScript that runs
// unchanged in Node, the desktop app's webview, a browser and a server.
// So a shared file may only import other shared files: no `fs`, `path`,
// `node:*`, Astro, Tauri, npm packages, or anything outside this folder.
// The app imports these files directly; one stray import would break it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sources = readdirSync(here).filter((f) => /\.(mjs|js)$/.test(f) && !/\.test\.mjs$/.test(f));

test('src/shared has files to check', () => {
  assert.ok(sources.length > 0);
});

for (const file of sources) {
  test(`${file} imports only other shared files`, () => {
    const text = readFileSync(join(here, file), 'utf-8');
    const specifiers = [
      ...text.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm),
      ...text.matchAll(/^\s*export\s[^'"]*\sfrom\s+['"]([^'"]+)['"]/gm),
      ...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
      ...text.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g),
    ].map((m) => m[1]);
    const outside = specifiers.filter((s) => !/^\.\/[\w.-]+\.m?js$/.test(s));
    assert.deepEqual(outside, [], `${file} imports something outside src/shared/: ${outside.join(', ')}`);
  });
}
