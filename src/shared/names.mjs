// Story folder names — the one place their format is read and written,
// shared by the restructure engine, the generator's pages and the app.
// Pure: no files.
//
// D-181 (current): every number is the number the app shows.
//   arc        arc-NN-name          e.g. arc-02-crisis
//   chapter    chapter-NN-name      e.g. chapter-03-what-comes-next
//   scene      NN-name              e.g. 09-whats-going-on
//   interlude  arc-NN.K-name        e.g. arc-01.1-quiet-night
//              chapter-NN.K-name    e.g. chapter-03.1-a-letter-home
//
// Arcs are numbered 1…N across the story, chapters 1…N across the story,
// scenes 1…N across the whole story. Within a folder the order is fixed by
// kind, as names sort: loose scenes, then arcs, then chapters. Anything in
// between goes in an interlude, which holds scenes and takes the number of
// the arc or chapter it follows (00 before the first) plus .1 to .9. An
// interlude isn't counted as an arc or chapter; its word ("arc" or
// "chapter") says which level it sits at. Plain alphabetical folder order is
// reading order everywhere: Finder, Obsidian, the generator.
//
// A scene's slug — its link target and web address — is its name without
// the number (`breakdown`, D-180); an arc's, chapter's or interlude's
// address is its kind and name (`arc-crisis`, `interlude-quiet-night`).
//
// Older formats, still read until a story is updated:
//   marker       (D-158)  arcs and chapters `PP[t]_kind-NN-name`, where PP
//                         is the number of the last scene before them
//   by-position  (D-180)  `NN_kind-name` and `NN-name`, each folder
//                         numbering its own contents from 01
//   Before D-158 names had D-181's shape already (no interludes).

const SCENE = /^(\d+)(?:-(.*))?$/;
const CURRENT = /^(arc|chapter)-(\d+)(?:\.(\d))?(?:-(.*))?$/;
const MARKER = /^(\d+)([a-z]*)_(arc|chapter)-(\d+)(?:-(.*))?$/;
const BY_POSITION = /^(\d+)_(arc|chapter)(?:-(.*))?$/;
const UNNUMBERED = /^(arc|chapter)-(.*)$/;

// What a folder name says.
//   { kind: 'scene', number, width, bare }
//   { kind: 'arc' | 'chapter' | 'interlude', level, number, numberText,
//     width, interlude, bare, format, marker, markerWidth, tie, position }
// or null when it isn't a scene, arc, chapter or interlude name.
//   level      'arc' or 'chapter': the level it sits at (its own kind, for
//              an arc or chapter)
//   number     an arc's or chapter's own number; for an interlude, the
//              number of the arc or chapter it follows
//   interlude  1…9 for an interlude, 0 otherwise
//   format     'current' | 'marker' | 'by-position'
// `format` in the options reads an ambiguous name a given way: `03_chapter-
// 24-hours` fits both older formats, and only the whole story can say which
// it is (storyFormat).
export function parseFolderName(name, { isScene, format } = {}) {
  if (isScene) {
    const m = name.match(SCENE);
    return m
      ? { kind: 'scene', number: Number(m[1]), width: m[1].length, bare: m[2] ?? '' }
      : { kind: 'scene', number: null, width: 0, bare: name };
  }
  const base = { marker: null, markerWidth: 0, tie: '', position: null, interlude: 0 };
  const c = name.match(CURRENT);
  if (c) {
    const interlude = c[3] === undefined ? 0 : Number(c[3]);
    return {
      ...base,
      kind: interlude ? 'interlude' : c[1],
      level: c[1],
      number: Number(c[2]),
      numberText: c[2],
      width: c[2].length,
      interlude,
      bare: c[4] ?? '',
      format: 'current',
    };
  }
  const m = format === 'by-position' ? null : name.match(MARKER);
  if (m) {
    return {
      ...base,
      kind: m[3],
      level: m[3],
      number: Number(m[4]),
      numberText: m[4],
      width: m[4].length,
      bare: m[5] ?? '',
      marker: Number(m[1]),
      markerWidth: m[1].length,
      tie: m[2] ?? '',
      format: 'marker',
    };
  }
  const p = name.match(BY_POSITION);
  if (p) {
    return { ...base, kind: p[2], level: p[2], number: null, numberText: '', width: 0, bare: p[3] ?? '', position: Number(p[1]), format: 'by-position' };
  }
  const u = name.match(UNNUMBERED);
  if (u) return { ...base, kind: u[1], level: u[1], number: null, numberText: '', width: 0, bare: u[2], format: 'current' };
  return null;
}

// Plain name comparison: reading order, as the generator orders scene ids.
export function compareNames(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

const lastPart = (path) => path.split('/').pop();
const parentOf = (path) => path.split('/').slice(0, -1).join('/');

// Which format a story's folders are in, from the paths (within its scenes
// folder) of every scene in it: 'current' (D-181, and names from before
// D-158), 'marker' (D-158) or 'by-position' (D-180). An arc or chapter name
// with "_" is one of the older two; D-180's is told by a name that fits only
// its shape, or by scene numbers starting again in a folder. A story of
// scenes alone is always 'current': its names read the same in every format.
export function storyFormat(scenePaths) {
  let underscore = false;
  const numbers = new Set();
  let repeated = false;
  for (const path of scenePaths) {
    const number = parseFolderName(lastPart(path), { isScene: true }).number;
    if (number !== null && numbers.has(number)) repeated = true;
    if (number !== null) numbers.add(number);
    for (const folder of path.split('/').slice(0, -1)) {
      if (CURRENT.test(folder)) continue;
      if (!MARKER.test(folder) && BY_POSITION.test(folder)) return 'by-position';
      if (MARKER.test(folder)) underscore = true;
    }
  }
  if (!underscore) return 'current';
  return repeated ? 'by-position' : 'marker';
}

// Every name a story's folders give it, from the paths, within its scenes
// folder, of all its scenes and all its arcs, chapters and interludes —
// drafts and empty containers included, so an address doesn't depend on
// what's published.
//
//   scenes      Map path → slug: the name without its number (`breakdown`),
//               or the folder name when there's no name
//   containers  Map path → { kind, level, slug, number }: slug
//               `arc-crisis`, `interlude-quiet-night`; number counted per
//               kind in reading order (Arc 1, Arc 2 …), null for an
//               interlude; level 'arc' or 'chapter' (an interlude's level)
//   repeats     [{ kind, slug, paths }] — a name used twice in the story.
//               The first in reading order keeps it; a later one is
//               addressed by its full folder name until the story is tidied.
//   format      storyFormat()
export function nameStory(scenePaths, containerPaths = []) {
  const format = storyFormat(scenePaths);
  const scenes = new Map();
  const containers = new Map();
  const repeats = [];

  const claim = (taken, wanted, fallback, path) => {
    if (!taken.has(wanted)) {
      taken.set(wanted, [path]);
      return wanted;
    }
    taken.get(wanted).push(path);
    let slug = fallback;
    for (let n = 2; taken.has(slug); n += 1) slug = `${fallback}-${n}`;
    taken.set(slug, [path]);
    return slug;
  };

  const sceneSlugs = new Map();
  for (const path of [...scenePaths].sort(compareNames)) {
    const folder = lastPart(path);
    const { bare } = parseFolderName(folder, { isScene: true });
    scenes.set(path, claim(sceneSlugs, bare || folder, folder, path));
  }

  const containerSlugs = new Map();
  const counts = { arc: 0, chapter: 0 };
  for (const path of [...containerPaths].sort(compareNames)) {
    const folder = lastPart(path);
    const parsed = parseFolderName(folder, { format });
    if (!parsed || parsed.kind === 'scene') continue;
    let number = null;
    if (parsed.kind !== 'interlude') {
      counts[parsed.kind] += 1;
      number = counts[parsed.kind];
    }
    const wanted = parsed.bare ? `${parsed.kind}-${parsed.bare}` : parsed.kind;
    containers.set(path, { kind: parsed.kind, level: parsed.level, slug: claim(containerSlugs, wanted, folder, path), number });
  }

  for (const [taken, kind] of [[sceneSlugs, 'scene'], [containerSlugs, 'container']]) {
    for (const [slug, paths] of taken) if (paths.length > 1) repeats.push({ kind, slug, paths });
  }
  return { format, scenes, containers, repeats };
}

// The arcs, chapters and interludes a list of scene paths passes through,
// each once.
export function containersOf(scenePaths) {
  const found = new Set();
  for (const path of scenePaths) {
    for (let p = parentOf(path); p; p = parentOf(p)) found.add(p);
  }
  return [...found];
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

// A folder's name, D-181. Only the restructure engine writes these.
//   scene      folderName('scene', 9, 2, 'whats-going-on')      09-whats-going-on
//   arc        folderName('arc', 2, 2, 'crisis')                arc-02-crisis
//   interlude  folderName('interlude', 1, 2, 'quiet-night',
//                         { level: 'arc', index: 1 })          arc-01.1-quiet-night
// For an interlude, `number` is the number of the arc or chapter it follows.
export function folderName(kind, number, width, bare, { level, index } = {}) {
  if (kind === 'scene') return `${pad(number, width)}-${bare}`;
  if (kind === 'interlude') return `${level}-${pad(number, width)}.${index}-${bare}`;
  return `${kind}-${pad(number, width)}-${bare}`;
}

// The most interludes one spot can hold: ".10" would sort before ".2".
export const MAX_INTERLUDES = 9;

// The name a blank title gets, so every scene, arc, chapter and interlude
// has an address (D-180).
export const UNTITLED = 'untitled';

export function humanize(bare) {
  return bare.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// A scene's display title: its own `title`, or else its folder name made
// readable ("05-chapter-2" → "Chapter 2"), as the spec promises. A folder
// that's only a number ("05") becomes "Scene 5". One rule for the app's
// outline and every page of the reader site.
export function sceneTitle(title, folderName) {
  if (typeof title === 'string' && title.trim()) return title;
  const { number, bare } = parseFolderName(folderName, { isScene: true });
  if (bare) return humanize(bare);
  return number === null ? folderName : `Scene ${number}`;
}

// "Arc 1: Evacuation", "Chapter 3: Breakdown" — `number` is the count from
// nameStory; `title` (e.g. from _meta.toml) replaces the humanized name
// when given. Without a count, the folder's own number is used as written.
// An interlude is its title alone ("A Letter Home"), or "Interlude"
// (D-181); screens mark it as an interlude themselves. `format` as for
// parseFolderName.
export function containerLabel(name, title, number, { format } = {}) {
  const parsed = parseFolderName(name, { format });
  if (!parsed) return title ?? name;
  if (parsed.kind === 'interlude') return title ?? (parsed.bare && parsed.bare !== UNTITLED ? humanize(parsed.bare) : 'Interlude');
  const kind = parsed.kind === 'arc' ? 'Arc' : 'Chapter';
  const text = title ?? humanize(parsed.bare);
  const shown = number ?? (parsed.number === null ? null : Number(parsed.numberText));
  return shown === null ? `${kind}: ${text}` : `${kind} ${shown}: ${text}`;
}
