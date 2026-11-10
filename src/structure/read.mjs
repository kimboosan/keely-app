// Reading a story's structure for the restructure engine (D-157, D-181).
//
// A story's scenes folder holds scenes (folders with an index.md) and
// containers (arcs, chapters and interludes: folders without one), nested
// at most root → arc → chapter → scene, with interludes holding scenes.
// Folder names follow names.mjs: alphabetical order is reading order. The
// engine reads siblings by the *value* of their names, which is the same
// order whenever numbers are padded evenly, and repairs it where they
// aren't (two-digit numbering that reached "100-…", which sorts between
// "10-…" and "11-…"): a tidy pads them evenly.
//
// D-181 (and names from before D-158): loose scenes, then arcs and arc-level
// interludes, then chapters and chapter-level interludes; each by number,
// an interlude right after the arc or chapter it follows. Stories still
// named the D-158 or D-180 way read by their position markers or places,
// until their author updates them.
//
// Every function here takes the folder it works on — never a vault
// location from module-level settings — so one process can serve many
// vaults (the Phase 3 hosted tier).

import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { StructureError } from './errors.mjs';
import { compareNames, parseFolderName, storyFormat } from './names.mjs';

export { compareNames };

const RANK = { scene: 0, arc: 1, chapter: 2 };

// Reading order of two sibling folders.
function compareSiblings(a, b) {
  if (a.format === 'marker' || b.format === 'marker' || a.format === 'by-position' || b.format === 'by-position') {
    const position = (n) => (n.kind === 'scene' ? n.number : n.format === 'by-position' ? n.position : n.marker) ?? Infinity;
    return (
      position(a) - position(b) ||
      (a.kind === 'scene' ? 0 : 1) - (b.kind === 'scene' ? 0 : 1) ||
      compareNames(a.tie ?? '', b.tie ?? '') ||
      compareNames(a.name, b.name)
    );
  }
  const rank = (n) => RANK[n.kind === 'interlude' ? n.level : n.kind];
  return (
    rank(a) - rank(b) ||
    (a.number ?? Infinity) - (b.number ?? Infinity) ||
    (a.interlude ?? 0) - (b.interlude ?? 0) ||
    compareNames(a.name, b.name)
  );
}

// The story's tree, its scenes' file contents, and a fingerprint of both.
//
//   tree:     [{ kind, id, name, number, width, bare, children? }] — and,
//             for arcs, chapters and interludes, level/interlude/format and
//             the older formats' marker/tie/position (names.mjs)
//             `id` is the node's path relative to the scenes folder — unique
//             even if two folders share a name in different containers.
//   contents: Map of scene id → its index.md text (for link rewriting)
//   format:   'current', 'marker' or 'by-position' (storyFormat), which
//             also decides how an ambiguous arc or chapter name is read
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
        nodes.push({ id: path, name: entry.name, scene: true });
        continue;
      }
      nodes.push({ id: path, name: entry.name, children: await walk(full, path) });
    }
    return nodes;
  }

  // Names are read once the whole story is known: an arc or chapter name
  // can fit two formats, and the story says which (storyFormat).
  function parse(nodes, format) {
    return nodes
      .map((node) => {
        if (node.scene) return { id: node.id, name: node.name, ...parseFolderName(node.name, { isScene: true }) };
        const parsed = parseFolderName(node.name, { format });
        if (!parsed || parsed.kind === 'scene') {
          throw new StructureError(
            'unknown-folder',
            `Keely can't reorder this story: the folder "${node.id}" isn't a scene, an arc, a chapter or an interlude.`
          );
        }
        return { id: node.id, name: node.name, ...parsed, children: parse(node.children, format) };
      })
      .sort(compareSiblings);
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

  const raw = await walk(scenesRoot, '');
  const format = storyFormat([...contents.keys()]);
  const tree = parse(raw, format);
  const hash = createHash('sha256');
  for (const path of listing.sort(compareNames)) hash.update(`${path}\n`);
  for (const [id, text] of [...contents].sort(([a], [b]) => compareNames(a, b))) hash.update(`${id}\n${text}\n`);
  return { tree, contents, format, fingerprint: hash.digest('hex') };
}
