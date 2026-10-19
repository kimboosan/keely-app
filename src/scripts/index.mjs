// Builds everything the generator computes from the vault before a dev
// server or production build reads it — the one list of index steps.
// `npm run index` runs this, and so does the desktop app, directly with
// `node`: a packaged app bundles Node but can't count on npm (D-096).
//
// Each step is a module that does its work on import, so importing them
// in order runs them in order; a step that throws stops the rest and
// exits non-zero, same as the old `&&` chain.
await import('./build-entity-index.mjs');
await import('./build-relationships.mjs');
await import('./copy-scene-images.mjs');
