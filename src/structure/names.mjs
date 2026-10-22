// Story folder names (D-158) — the one place their format is read and
// written, shared by the restructure engine and the generator's pages.
// Pure: no files.
//
//   scene      NN-bare-name                e.g. 05-breakdown
//   container  PP[t]_kind-NN-bare-name     e.g. 04_chapter-03-breakdown
//
// Scenes are numbered 1…N in reading order across the story; the folder
// name is the scene's slug, link target and web-address segment (D-035,
// D-067). Arcs and chapters carry a readable number (each kind 1…N across
// the story) and, in front, a position marker PP: the number of the last
// scene before them in reading order (00 if none), joined by "_" — which
// sorts after "-", so a container always sorts right after that scene. Two
// sibling containers with no scene between them share a marker and are
// told apart by a tie letter (04_, 04a_, 04b_ …). With this, scenes, arcs
// and chapters can sit in any order, and plain alphabetical folder order is
// reading order everywhere: Finder, Obsidian, the generator.
//
// Before D-158 containers had no marker (`chapter-03-breakdown`) and could
// only follow a container's loose scenes, arcs before chapters. Those
// names are still read, so existing stories keep working until their
// author chooses to tidy them into the new format.

const SCENE = /^(\d+)(?:-(.*))?$/;
const CONTAINER = /^(?:(\d+)([a-z]*)_)?(arc|chapter)-(\d+)(?:-(.*))?$/;
const CONTAINER_UNNUMBERED = /^(arc|chapter)-(.*)$/;

// What a folder name says.
//   { kind: 'scene', number, width, bare }
//   { kind: 'arc' | 'chapter', number, width, bare, marker, markerWidth, tie, legacy }
// or null when it isn't a scene, arc or chapter name. `legacy` marks a
// container named the pre-D-158 way (no marker).
export function parseFolderName(name, { isScene } = {}) {
  if (isScene) {
    const m = name.match(SCENE);
    return m
      ? { kind: 'scene', number: Number(m[1]), width: m[1].length, bare: m[2] ?? '' }
      : { kind: 'scene', number: null, width: 0, bare: name };
  }
  const m = name.match(CONTAINER);
  if (m) {
    return {
      kind: m[3],
      number: Number(m[4]),
      numberText: m[4],
      width: m[4].length,
      bare: m[5] ?? '',
      marker: m[1] === undefined ? null : Number(m[1]),
      markerWidth: m[1]?.length ?? 0,
      tie: m[2] ?? '',
      legacy: m[1] === undefined,
    };
  }
  const u = name.match(CONTAINER_UNNUMBERED);
  if (u) return { kind: u[1], number: null, numberText: '', width: 0, bare: u[2], marker: null, markerWidth: 0, tie: '', legacy: true };
  return null;
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

export function sceneFolderName(number, width, bare) {
  return bare ? `${pad(number, width)}-${bare}` : pad(number, width);
}

export function containerFolderName(kind, marker, markerWidth, tie, number, width, bare) {
  const head = `${pad(marker, markerWidth)}${tie}_${kind}-${pad(number, width)}`;
  return bare ? `${head}-${bare}` : head;
}

// The tie letter for the k-th (0-based) of consecutive sibling containers
// sharing a marker: '', 'a' … 'z', then 'za' … — each sorts after the one
// before it and before the next marker.
export function tieLetters(k) {
  if (k === 0) return '';
  return 'z'.repeat(Math.floor((k - 1) / 26)) + String.fromCharCode(97 + ((k - 1) % 26));
}

export function humanize(bare) {
  return bare.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// "Arc 01: Evacuation", "Chapter 03: Breakdown" — from the folder name,
// with the number as the folder writes it (as labels always have), and
// `title` (e.g. from _meta.toml) in place of the humanized bare name when
// given. The position marker is never shown.
export function containerLabel(name, title) {
  const parsed = parseFolderName(name);
  if (!parsed) return title ?? name;
  const kind = parsed.kind === 'arc' ? 'Arc' : 'Chapter';
  const text = title ?? humanize(parsed.bare);
  return parsed.number === null ? `${kind}: ${text}` : `${kind} ${parsed.numberText}: ${text}`;
}
