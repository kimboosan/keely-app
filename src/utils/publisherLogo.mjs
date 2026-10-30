// The publisher logo's address for the site header — the one place that rule
// lives.
//
// publisher.toml's `logo` is a path relative to src/data/ (format spec,
// publisher manifest), so the logo lives with the author's own files. It's
// found the same way the About page finds author portraits: from an
// `import.meta.glob('@vault/data/...')` result, via findImage (D-148), so
// Astro processes it like any other image.
//
// Older setups (Keely 0.6–0.7's docs) put the file in the generator's
// public/images/ instead. That still works, with a build note that it
// should move.
import { existsSync } from 'fs';
import { findImage } from './findImage.js';
import { warnOnce } from './warnOnce.js';

// The logo to show: `{ image }` (Astro image metadata, which the layout
// shrinks to header size), `{ url }` for the old public/images/ location
// (served as is, sized by CSS), or null when there's none (the header then
// shows the publisher's name as text). `dataImages` is the layout's
// `import.meta.glob('@vault/data/**/…', { eager: true })`.
export function publisherLogo(logo, dataImages) {
  if (typeof logo !== 'string' || !logo.trim()) return null;
  const path = logo.trim();
  const image = findImage(dataImages, `data/${path}`);
  if (image) return { image };
  if (existsSync(`./public/images/${path}`)) {
    warnOnce(
      `⚠️  Publisher logo "${path}" is in the generator's public/images/ folder. It still works, but it belongs with your own files: move it to src/data/${path}.`,
    );
    return { url: `/images/${path}` };
  }
  warnOnce(`⚠️  Publisher logo "${path}" not found in src/data/ — the header shows your name instead.`);
  return null;
}
