// Where the generator finds an author's work, and where it keeps what it
// computes. The only place either location is decided (D-148).
//
// The vault is the folder holding `src/content` and `src/data` (D-085).
// `KEELY_VAULT` points at it; unset, it's this generator's own folder —
// KimBoo's setup and the Netlify build, which keep working unchanged. The
// desktop app sets it when it runs the generator against an author's vault.
//
// Computed files (entity index, relationships, custom-type list) live in
// the generator's own `.keely-cache/`, never in the vault: the vault holds
// only what the author wrote (Computed-vs-Authored principle).
//
// Both defaults are relative to the folder the generator is started in, so
// it must always be started from its own folder — Astro requires that too.
// Finding this file's own location instead doesn't work: Astro bundles this
// file into the built pages, where that location is inside `dist/`.
import { mkdirSync } from 'fs';
import { resolve } from 'path';

export const VAULT = resolve(process.env.KEELY_VAULT ?? '.');
export const CONTENT = `${VAULT}/src/content`;
export const DATA = `${VAULT}/src/data`;
export const CACHE = resolve('./.keely-cache');

// Not in git — created on first use so no writer has to remember to.
mkdirSync(CACHE, { recursive: true });
