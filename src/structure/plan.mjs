// Planning a story restructure (D-157, D-180, D-181). Pure: no files are
// read or written here. Given the story as it is (from readStory) and the
// order the author wants, it works out every folder rename and move, and
// the path any new item will take. Every plan writes D-181 names: arcs,
// chapters and scenes numbered as the app numbers them, across the whole
// story, and interludes for anything in between. A scene's name is its
// address, so a renumber changes no link; links are rewritten only when a
// story still uses names from before D-180 (`[[05-breakdown]]` →
// `[[breakdown]]`), or when a repeated name has to be made unique.
//
// The desired order is a nested list mirroring the story's tree:
//   [{ id: "arc-01-setup", children: [{ id: "arc-01-setup/01-the-order" }, …] },
//    { new: { kind: "scene", bare: "the-fax" } }, …]
// Existing items are named by their current id (path); every one must
// appear exactly once. `new` items are being created at that position —
// the engine reserves their path, and the caller creates them afterwards.

import { StructureError } from './errors.mjs';
import { folderName, MAX_INTERLUDES, nameStory, UNTITLED } from './names.mjs';

// What may contain what (D-157, D-181). Containers nest at most root → arc
// → chapter → scene; an interlude holds scenes only.
const ALLOWED_CHILDREN = {
  root: ['scene', 'arc', 'chapter', 'interlude'],
  arc: ['scene', 'chapter', 'interlude'],
  chapter: ['scene'],
  interlude: ['scene'],
  scene: [],
};

// Within a folder the order is fixed by kind, as folder names sort (D-181):
// loose scenes, then arcs (and interludes among them), then chapters (and
// interludes among them).
const RANK = { scene: 0, arc: 1, chapter: 2 };

// A new item's bare name, as the app's slug rule makes it: lowercase
// letters (any alphabet), numbers and hyphens — or empty, when a title has
// no letters or numbers; it is then named "untitled" (D-180).
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
          throw new StructureError('bad-name', `"${item.new.bare}" can't be used in a folder name.`);
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
          `A${kind === 'arc' || kind === 'interlude' ? 'n' : ''} ${kind} can't go inside ${parentLabel}: chapters and interludes hold only scenes, and arcs hold chapters, interludes and scenes.`
        );
      }
      const entry = { kind, node, newItem: item.new ?? null };
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
    throw new StructureError('bad-request', `The new order leaves out "${missing[0]}". Every scene, arc, chapter and interlude must stay in the story.`);
  }

  // 2. Each interlude's level — among arcs or among chapters — from where it
  // sits: the arc or chapter before it in its folder, else the one after,
  // else its folder (inside an arc: chapters; at the top: arcs, if the story
  // has any). Then the fixed order within each folder (D-181).
  const storyHasArcs = (function hasArc(entries) {
    return entries.some((e) => e.kind === 'arc' || (e.children && hasArc(e.children)));
  })(ordered);
  (function check(entries, parentKind) {
    const levels = entries.map((e) => (e.kind === 'arc' || e.kind === 'chapter' ? e.kind : null));
    entries.forEach((entry, i) => {
      if (entry.kind !== 'interlude') return;
      const before = levels.slice(0, i).reverse().find(Boolean);
      const after = levels.slice(i + 1).find(Boolean);
      entry.level = before ?? after ?? (parentKind === 'root' && storyHasArcs ? 'arc' : 'chapter');
    });
    let highest = 0;
    let highestKind = null;
    for (const entry of entries) {
      const rank = RANK[entry.kind === 'interlude' ? entry.level : entry.kind];
      if (rank < highest) {
        const where = parentKind === 'root' ? "at the story's top level" : 'inside an arc';
        const message =
          entry.kind === 'scene'
            ? `A scene can't come after ${highestKind === 'arc' ? 'an arc' : highestKind === 'chapter' ? 'a chapter' : 'an interlude'} ${where}: scenes there come first. To put scenes in between, add an interlude and move them into it.`
            : `An arc can't come after a chapter ${where}: arcs come first. To put something before the first arc, use an interlude.`;
        throw new StructureError('not-allowed', message);
      }
      highest = Math.max(highest, rank);
      if (entry.kind !== 'scene') highestKind = entry.kind;
      if (entry.children) check(entry.children, entry.kind);
    }
  })(ordered, 'root');

  // 3. Names (D-180): unique within the story — scenes among scenes, arcs,
  // chapters and interludes among their own kind. Existing items claim
  // theirs first, in the story's current order, so an item's name doesn't
  // depend on where it's going; a repeat, or a new item's name already used,
  // gets "-2", "-3"… A blank name becomes "untitled".
  const taken = { scene: new Set(), container: new Set() };
  const claim = (kind, bare) => {
    const pool = kind === 'scene' ? taken.scene : taken.container;
    const key = (b) => (kind === 'scene' ? b : `${kind}-${b}`);
    const wanted = bare || UNTITLED;
    let name = wanted;
    for (let n = 2; pool.has(key(name)); n += 1) name = `${wanted}-${n}`;
    pool.add(key(name));
    return name;
  };
  const finalBare = new Map(); // old id → name
  (function visit(nodes) {
    for (const node of nodes) {
      finalBare.set(node.id, claim(node.kind, node.bare));
      if (node.children) visit(node.children);
    }
  })(story.tree);

  // 4. Final names and paths (D-181): scenes, arcs and chapters each
  // numbered 1…N across the whole story in reading order; an interlude takes
  // the number of the last arc or chapter of its level before it (0 if
  // none), plus .1, .2… Each kind is padded to the digits of its own count,
  // at least two.
  const totals = { scene: 0, arc: 0, chapter: 0 };
  (function count(entries) {
    for (const e of entries) {
      if (e.kind in totals) totals[e.kind] += 1;
      if (e.children) count(e.children);
    }
  })(ordered);
  const width = Object.fromEntries(Object.entries(totals).map(([k, n]) => [k, Math.max(2, digits(n))]));
  const numbers = { scene: 0, arc: 0, chapter: 0 };
  const interludeIndex = new Map(); // "level:number" → interludes so far
  const relocations = [];
  const newItems = [];
  const sceneRenames = new Map(); // old scene folder name → new, for the app (tabs, history)
  const finalPaths = new Map(); // old id → new path
  (function assign(entries, parentPath) {
    for (const entry of entries) {
      const bare = entry.node ? finalBare.get(entry.node.id) : claim(entry.kind, entry.newItem.bare);
      let name;
      if (entry.kind === 'interlude') {
        const after = numbers[entry.level];
        const key = `${entry.level}:${after}`;
        const index = (interludeIndex.get(key) ?? 0) + 1;
        if (index > MAX_INTERLUDES) {
          throw new StructureError('not-allowed', `There can be at most ${MAX_INTERLUDES} interludes in one place. Put some of these scenes into an interlude that's already there.`);
        }
        interludeIndex.set(key, index);
        name = folderName('interlude', after, width[entry.level], bare, { level: entry.level, index });
      } else {
        numbers[entry.kind] += 1;
        name = folderName(entry.kind, numbers[entry.kind], width[entry.kind], bare);
      }
      const path = parentPath ? `${parentPath}/${name}` : name;
      if (entry.node) {
        finalPaths.set(entry.node.id, path);
        if (path !== entry.node.id) relocations.push({ kind: entry.kind, from: entry.node.id, to: path });
        if (entry.kind === 'scene' && name !== entry.node.name) sceneRenames.set(entry.node.name, name);
      } else {
        const asked = entry.newItem.bare || UNTITLED;
        newItems.push({ kind: entry.kind, bare, path, ...(bare !== asked && { asked }) });
      }
      if (entry.children) assign(entry.children, path);
    }
  })(ordered, '');

  // 5. Links that have to follow a scene's name — only within this story
  // (scene links resolve only within their own story; D-135, D-157). A link
  // may name a scene by its address before this change (its name, or a
  // repeat's folder name, per nameStory) or by its old folder name (written
  // before D-180); either becomes its name now. Nothing that is a scene's
  // name after the change is rewritten.
  const scenePaths = [...story.contents.keys()];
  const before = nameStory(scenePaths, []).scenes;
  const finalNames = new Set();
  for (const id of scenePaths) finalNames.add(finalBare.get(id));
  const linkRenames = new Map();
  for (const id of scenePaths) {
    const now = finalBare.get(id);
    for (const form of [before.get(id), current.get(id).name]) {
      if (form && form !== now && !finalNames.has(form)) linkRenames.set(form, now);
    }
  }
  const renamedScenes = scenePaths.filter((id) => before.get(id) !== finalBare.get(id)).length;
  const renamedContainers = [...current.values()].filter((n) => n.kind !== 'scene' && (n.bare || UNTITLED) !== finalBare.get(n.id)).length;

  const linkRewrites = [];
  for (const [id, text] of story.contents) {
    const { changes } = rewriteLinks(text, linkRenames);
    if (changes.length) linkRewrites.push({ scene: finalPaths.get(id), was: id, count: changes.length, changes });
  }

  // A story with arcs or chapters still named the D-158 or D-180 way. A
  // story of scenes alone reads the same in every format, so never needs it.
  const oldNames = story.format !== 'current' && [...current.values()].some((n) => n.kind !== 'scene');
  const summary = summarize({ relocations, newItems, linkRewrites, finalPaths, oldNames, renamed: renamedScenes + renamedContainers });
  return {
    version: 1,
    story: storySlug ?? null,
    fingerprint: story.fingerprint,
    relocations,
    newItems,
    sceneRenames: Object.fromEntries(sceneRenames),
    linkRenames: Object.fromEntries(linkRenames),
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

// Counts and a plain-language sentence. The app adds what the author did
// ("Moves 'The Fax' into Chapter 2"); the engine says what it will change.
// An item counts as moved when it ends up under a different arc or chapter
// (or the story root) than before, and as renumbered when only its number
// in its folder changes. An item whose path changes only because its arc or
// chapter was renumbered is neither. A story still using older names gets
// its folders updated to D-180's (`reformatted`), which the app offers as a
// step of its own before any other change.
function summarize({ relocations, newItems, linkRewrites, finalPaths, oldNames, renamed }) {
  const counts = { renumbered: { scene: 0, arc: 0, chapter: 0 }, moved: { scene: 0, arc: 0, chapter: 0 } };
  let reformatted = 0;
  for (const r of relocations) {
    if (oldNames) {
      if (baseName(r.from) !== baseName(r.to)) reformatted += 1;
      continue;
    }
    const oldParent = parentOf(r.from);
    const parentNow = oldParent ? finalPaths.get(oldParent) : '';
    if (parentNow !== parentOf(r.to)) counts.moved[r.kind] += 1;
    else if (baseName(r.from) !== baseName(r.to)) counts.renumbered[r.kind] += 1;
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
  if (reformatted) parts.push(`updates ${plural(reformatted, 'folder name', 'folder names')} to the new format`);
  for (const item of newItems) parts.push(`makes room for the new ${item.kind}`);
  let text;
  if (!parts.length && !links) text = 'Nothing to change: the story is already in this order.';
  else {
    text = parts.length ? parts.join(', ') : '';
    text = text ? text.charAt(0).toUpperCase() + text.slice(1) + '.' : '';
    if (renamed) text += ` Gives ${plural(renamed, 'item')} a new name, since the name was already used in this story or was blank.`;
    for (const item of newItems.filter((n) => n.asked)) {
      text += ` The new ${item.kind} is named "${item.bare}", since "${item.asked}" is already used in this story.`;
    }
    if (links) text += ` Updates ${plural(links, 'link')} in ${plural(linkRewrites.length, 'scene')}.`;
    text = text.trim();
  }
  return { text, moved: counts.moved, renumbered: counts.renumbered, reformatted, renamed, links, filesWithLinks: linkRewrites.length };
}
