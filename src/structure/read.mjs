// Reading a story's structure for the restructure engine (D-157, D-158).
//
// A story's scenes folder holds scenes (folders with an index.md) and
// containers (arcs and chapters: folders without one), nested at most
// root → arc → chapter → scene. Folder names follow D-158 (names.mjs):
// alphabetical order is reading order. The engine reads siblings by the
// *value* of their position — a scene's number, a container's marker; a
// scene before a container sharing its number; then tie letters — which is
// the same order whenever numbers are padded evenly, and repairs it where
// they aren't (two-digit numbering that reached "100-…", which sorts
// between "10-…" and "11-…"): a tidy pads them evenly.
//
// Containers named the pre-D-158 way (no marker) keep the old reading
// order — a container's loose scenes, then arcs, then chapters — so stories
// read exactly as they did until their author tidies them.
//
// Every function here takes the folder it works on — never a vault
// location from module-level settings — so one process can serve many
// vaults (the Phase 3 hosted tier).

import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { StructureError } from './errors.mjs';
import { parseFolderName } from './names.mjs';

// Plain name comparison, as the generator orders scene ids (`a.id < b.id`).
export function compareNames(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

const LEGACY_RANK = { scene: 0, arc: 1, chapter: 2 };

// Reading order of two sibling folders.
function compareSiblings(a, b) {
  if (a.legacy || b.legacy) {
    // Pre-D-158 containers: loose scenes, then arcs, then chapters.
    return (
      LEGACY_RANK[a.kind] - LEGACY_RANK[b.kind] ||
      (a.number ?? Infinity) - (b.number ?? Infinity) ||
      compareNames(a.name, b.name)
    );
  }
  const position = (n) => (n.kind === 'scene' ? n.number : n.marker) ?? Infinity;
  return (
    position(a) - position(b) ||
    (a.kind === 'scene' ? 0 : 1) - (b.kind === 'scene' ? 0 : 1) ||
    compareNames(a.tie ?? '', b.tie ?? '') ||
    compareNames(a.name, b.name)
  );
}

// The story's tree, its scenes' file contents, and a fingerprint of both.
//
//   tree:     [{ kind, id, name, number, width, bare, children? }] — and,
//             for arcs and chapters, marker/markerWidth/tie/legacy (names.mjs)
//             `id` is the node's path relative to the scenes folder — unique
//             even if two folders share a name in different containers.
//   contents: Map of scene id → its index.md text (for link rewriting)
//   fingerprint: changes if any folder or file in the story is added,
//             removed, renamed, or any scene's text changes. A plan is only
//             applied over the exact story it was made from.
export async function readStory(scenesRoot) {
  if (!existsSync(scenesRoot)) {
    throw new StructureError('no-story', "Keely couldn't find this story's scenes folder.");
  }
  const contents = new Map();
  const listing = [];

  async function walk(dir, rel) {
    const entries = (await readdir(dir, { withFileTypes: true })).filter((e) => !e.name.startsWith('.'));
    const nodes = [];
    for (const entry of entries) {
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      listing.push(path);
      if (!entry.isDirectory()) continue;
      const full = join(dir, entry.name);
      if (existsSync(join(full, 'index.md'))) {
        contents.set(path, await readFile(join(full, 'index.md'), 'utf-8'));
        await walkFiles(full, path); // a scene's own images and notes count too
        nodes.push({ id: path, name: entry.name, ...parseFolderName(entry.name, { isScene: true }) });
        continue;
      }
      const parsed = parseFolderName(entry.name);
      if (!parsed || parsed.kind === 'scene') {
        throw new StructureError(
          'unknown-folder',
          `Keely can't reorder this story: the folder "${path}" isn't a scene, an arc or a chapter.`
        );
      }
      nodes.push({ id: path, name: entry.name, ...parsed, children: await walk(full, path) });
    }
    return nodes.sort(compareSiblings);
  }

  // Everything inside a scene folder, for the fingerprint only.
  async function walkFiles(dir, rel) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = `${rel}/${entry.name}`;
      listing.push(path);
      if (entry.isDirectory()) await walkFiles(join(dir, entry.name), path);
    }
  }

  const tree = await walk(scenesRoot, '');
  const hash = createHash('sha256');
  for (const path of listing.sort(compareNames)) hash.update(`${path}\n`);
  for (const [id, text] of [...contents].sort(([a], [b]) => compareNames(a, b))) hash.update(`${id}\n${text}\n`);
  return { tree, contents, fingerprint: hash.digest('hex') };
}
