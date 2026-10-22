// Planning a story restructure (D-157, D-158). Pure: no files are read or
// written here. Given the story as it is (from readStory) and the order the
// author wants, it works out every folder rename and move, every link
// that has to follow a renamed scene, and the path any new item will take.
//
// The desired order is a nested list mirroring the story's tree:
//   [{ id: "arc-01-setup", children: [{ id: "arc-01-setup/01-the-order" }, …] },
//    { new: { kind: "scene", bare: "the-fax" } }, …]
// Existing items are named by their current id (path); every one must
// appear exactly once. `new` items are being created at that position —
// the engine reserves their path, and the caller creates them afterwards.

import { StructureError } from './errors.mjs';
import { containerFolderName, parseFolderName, sceneFolderName, tieLetters } from './names.mjs';

// What may contain what (D-157). Containers nest at most root → arc →
// chapter → scene.
const ALLOWED_CHILDREN = {
  root: ['scene', 'arc', 'chapter'],
  arc: ['scene', 'chapter'],
  chapter: ['scene'],
  scene: [],
};

// Within a container, scenes, arcs and chapters may sit in any order
// (D-158): arc and chapter folders carry a position marker, so plain
// alphabetical order is reading order whatever the mix.

const KIND_LABEL = { scene: 'scene', arc: 'arc', chapter: 'chapter' };
// A new item's bare name, as the app's slug rule makes it: lowercase
// letters (any alphabet), numbers and hyphens — or empty, when a title has
// no letters or numbers and the folder is just its number.
const BARE_NAME = /^(?:[\p{Ll}\p{Lo}\p{N}][\p{Ll}\p{Lo}\p{N}_-]*)?$/u;

function digits(n) {
  return String(n).length;
}


function indexTree(tree) {
  const byId = new Map();
  (function visit(nodes) {
    for (const node of nodes) {
      byId.set(node.id, node);
      if (node.children) visit(node.children);
    }
  })(tree);
  return byId;
}

// Rewrites every [[slug]] / [[slug|display]] in one pass, each slug looked
// up once — so renames can never chain (01-x → 02-x → 03-x).
export function rewriteLinks(text, renames) {
  const changes = [];
  const result = text.replace(/\[\[([^\]|]+?)(\s*\|[^\]]*)?\]\]/g, (match, slug, display) => {
    const to = renames.get(slug.trim());
    if (!to) return match;
    changes.push([slug.trim(), to]);
    return `[[${to}${display ?? ''}]]`;
  });
  return { text: result, changes };
}

export function planRestructure(story, desired, { storySlug } = {}) {
  const current = indexTree(story.tree);
  const seen = new Set();
  const placed = []; // { kind, node?, newItem?, parentPath, children? } in reading order
  const counts = { scene: 0, arc: 0, chapter: 0 };

  // 1. Validate the desired tree and record each item's place in it.
  function place(items, parentKind, parentLabel) {
    if (!Array.isArray(items)) {
      throw new StructureError('bad-request', 'The new order for this story is incomplete.');
    }
    const out = [];
    for (const item of items) {
      let kind;
      let node = null;
      if (item && item.new) {
        kind = item.new.kind;
        if (!ALLOWED_CHILDREN.root.includes(kind)) {
          throw new StructureError('bad-request', `"${kind}" isn't a kind of item a story can contain.`);
        }
        if (!BARE_NAME.test(item.new.bare ?? '')) {
          throw new StructureError(
            'bad-name',
            `"${item.new.bare}" can't be used in a folder name.`
          );
        }
      } else {
        node = current.get(item?.id);
        if (!node) throw new StructureError('bad-request', `The new order mentions "${item?.id}", which isn't in this story.`);
        if (seen.has(node.id)) throw new StructureError('bad-request', `The new order lists "${node.id}" twice.`);
        seen.add(node.id);
        kind = node.kind;
      }
      if (!ALLOWED_CHILDREN[parentKind].includes(kind)) {
        throw new StructureError(
          'not-allowed',
          `A ${KIND_LABEL[kind]} can't go inside ${parentLabel}: chapters hold only scenes, and arcs hold chapters and scenes.`
        );
      }
      counts[kind] += 1;
      const entry = { kind, node, newItem: item.new ?? null, number: counts[kind] };
      if (kind !== 'scene') {
        const label = node ? `"${node.name}"` : `the new ${kind}`;
        entry.children = place(item.children ?? [], kind, label);
      } else if (item.children && item.children.length) {
        throw new StructureError('not-allowed', "A scene can't contain other items.");
      }
      out.push(entry);
    }
    return out;
  }
  const ordered = place(desired, 'root', 'the story');

  const missing = [...current.keys()].filter((id) => !seen.has(id));
  if (missing.length) {
    throw new StructureError('bad-request', `The new order leaves out "${missing[0]}". Every scene, arc and chapter must stay in the story.`);
  }

  // 2. Number widths: at least 2, at least the digits of the count, and
  // never narrower than the widest number the story already uses for that
  // kind (an author who chose three digits keeps them).
  const width = {};
  for (const kind of ['scene', 'arc', 'chapter']) {
    let existing = 0;
    for (const node of current.values()) if (node.kind === kind) existing = Math.max(existing, node.width);
    width[kind] = Math.max(2, digits(counts[kind]), existing);
  }

  // 3. Final names and paths, in reading order.
  const relocations = [];
  const newItems = [];
  const sceneRenames = new Map(); // old scene folder name → new (the slug)
  const finalPaths = new Map(); // old id → new path
  // A container's position marker is the number of the last scene before
  // it in reading order (0 if none); siblings sharing one get tie letters.
  let scenesSoFar = 0;
  (function assign(entries, parentPath) {
    let lastMarker = null;
    let tieIndex = 0;
    for (const entry of entries) {
      const bare = entry.node ? entry.node.bare : entry.newItem.bare;
      let name;
      if (entry.kind === 'scene') {
        scenesSoFar = entry.number;
        name = sceneFolderName(entry.number, width.scene, bare);
        lastMarker = null;
      } else {
        const marker = scenesSoFar;
        tieIndex = marker === lastMarker ? tieIndex + 1 : 0;
        lastMarker = marker;
        name = containerFolderName(entry.kind, marker, width.scene, tieLetters(tieIndex), entry.number, width[entry.kind], bare);
      }
      const path = parentPath ? `${parentPath}/${name}` : name;
      if (entry.node) {
        finalPaths.set(entry.node.id, path);
        if (path !== entry.node.id) relocations.push({ kind: entry.kind, from: entry.node.id, to: path });
        if (entry.kind === 'scene' && name !== entry.node.name) sceneRenames.set(entry.node.name, name);
      } else {
        newItems.push({ kind: entry.kind, bare, path });
      }
      if (entry.children) assign(entry.children, path);
    }
  })(ordered, '');

  // 4. Links that have to follow renamed scenes — only within this story
  // (scene slugs are unique only within a story; D-135, D-157).
  const linkRewrites = [];
  for (const [id, text] of story.contents) {
    const { changes } = rewriteLinks(text, sceneRenames);
    if (changes.length) linkRewrites.push({ scene: finalPaths.get(id), was: id, count: changes.length, changes });
  }

  const summary = summarize(relocations, newItems, linkRewrites, finalPaths, current);
  return {
    version: 1,
    story: storySlug ?? null,
    fingerprint: story.fingerprint,
    relocations,
    newItems,
    sceneRenames: Object.fromEntries(sceneRenames),
    linkRewrites,
    summary,
  };
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function parentOf(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i);
}

function baseName(path) {
  return path.slice(path.lastIndexOf('/') + 1);
}

// An arc's or chapter's own number ("chapter-03" → 3), ignoring its marker.
function readableNumber(path) {
  return parseFolderName(baseName(path))?.number ?? null;
}

// Counts and a plain-language sentence. The app adds what the author did
// ("Moves 'The Fax' into Chapter 2"); the engine says what it will change.
// An item counts as moved when it ends up under a different arc or chapter
// (or the story root) than before, and as renumbered when only its own
// number changes. An item whose path changes only because its arc or
// chapter was renumbered is neither.
function summarize(relocations, newItems, linkRewrites, finalPaths, current) {
  const counts = { renumbered: { scene: 0, arc: 0, chapter: 0 }, moved: { scene: 0, arc: 0, chapter: 0 } };
  // Pre-D-158 arc and chapter folders gaining a position marker: reported
  // as a format update, not as renumbering.
  let reformatted = 0;
  let markerOnly = 0;
  for (const r of relocations) {
    if (current.get(r.from)?.legacy) {
      reformatted += 1;
      continue;
    }
    const oldParent = parentOf(r.from);
    const parentNow = oldParent ? finalPaths.get(oldParent) : '';
    if (parentNow !== parentOf(r.to)) counts.moved[r.kind] += 1;
    else if (r.kind === 'scene' ? baseName(r.from) !== baseName(r.to) : readableNumber(r.from) !== readableNumber(r.to)) {
      counts.renumbered[r.kind] += 1;
    } else if (baseName(r.from) !== baseName(r.to)) {
      markerOnly += 1; // an arc or chapter whose sort position changed, not its number
    }
  }
  const links = linkRewrites.reduce((n, f) => n + f.count, 0);
  // "5 scenes and 2 chapters", "1 scene, 3 chapters and 2 arcs"
  const listOf = (byKind) => {
    const items = ['scene', 'chapter', 'arc'].filter((k) => byKind[k]).map((k) => plural(byKind[k], k));
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0];
  };
  const parts = [];
  const moved = listOf(counts.moved);
  const renumbered = listOf(counts.renumbered);
  if (moved) parts.push(`moves ${moved} to a different place`);
  if (renumbered) parts.push(`renumbers ${renumbered}`);
  if (reformatted) parts.push(`updates ${plural(reformatted, 'arc or chapter folder name', 'arc and chapter folder names')} to the new format`);
  for (const item of newItems) parts.push(`makes room for the new ${item.kind}`);
  if (!parts.length && markerOnly) {
    parts.push(`updates the sort position of ${plural(markerOnly, 'arc or chapter folder', 'arc and chapter folders')}`);
  }
  let text;
  if (!parts.length) text = 'Nothing to change: the story is already in this order.';
  else {
    text = parts.join(', ');
    text = text.charAt(0).toUpperCase() + text.slice(1) + '.';
    if (links) text += ` Updates ${plural(links, 'link')} in ${plural(linkRewrites.length, 'scene')}.`;
  }
  return { text, moved: counts.moved, renumbered: counts.renumbered, reformatted, links, filesWithLinks: linkRewrites.length };
}
