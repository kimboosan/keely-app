import { existsSync, readFileSync } from 'fs';
import { parse as parseToml } from 'smol-toml';
import { getReaderScenes } from './readerScenes.js';
import { getStoryConfig, VALID_RATINGS } from './config.js';
import { scenesDir } from './vault.mjs';
import { url } from './url.js';
import { warnOnce } from './warnOnce.js';
import { containerLabel } from '../structure/names.mjs';
import { storyNames } from './storyNames.mjs';

// A story in reading order (D-158, D-170): the one place scene pages, arc
// and chapter pages and the story page learn what comes before and after
// what. Only what a reader can reach is included: published scenes, and
// the arcs and chapters that hold them.
//
//   hierarchy  the story as it sits on disk, nested, for the navigation:
//              { type: 'arc' | 'chapter' | 'interlude', level, slug, href,
//                label, children } — an interlude's `level` says whether
//              it sits among arcs or among chapters (D-181)
//              and { type: 'scene', scene, sceneNumber, slug, folder }
//              — `slug` is the scene's address and link target, `folder`
//              its folder name (an old-style link may still use it)
//   sequence   the same, flat, in reading order: each arc or chapter just
//              before its first scene, so Next and Previous pass through
//              its page (D-170)
//
// Every arc, chapter and scene carries `trail`: the arcs and chapters
// above it, outermost first, as { href, label } with site paths, for the
// header's breadcrumbs (D-177).
//
// Every arc, chapter and scene also carries `rated`: the nearest rating
// that covers it — its own (arcs and chapters), else its arc's or
// chapter's, else null, meaning the story's — with whose it is, for the
// adult-content notice (D-173 as amended): { rating, title }.
//
// Addresses and numbers come from storyNames (D-180): a scene lives at its
// name (`breakdown`), an arc or chapter at its kind and name
// (`arc-crisis`), and arcs and chapters are counted in reading order.

const nonEmpty = (v) => (typeof v === 'string' && v.trim() ? v : undefined);

// A container's _meta.toml: title (D-158), and summary, rating and tags
// (D-170, D-175). Missing or unreadable: none of them.
function readMeta(project, story, path) {
  const file = `${scenesDir(project, story)}/${path}/_meta.toml`;
  if (!existsSync(file)) return {};
  try {
    const meta = parseToml(readFileSync(file, 'utf-8'));
    return {
      title: nonEmpty(meta.title),
      summary: nonEmpty(meta.summary),
      rating: nonEmpty(meta.rating),
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    };
  } catch {
    return {};
  }
}

const cache = new Map();

export async function storyReading(project, story) {
  const key = `${project}/${story}`;
  if (cache.has(key)) return cache.get(key);

  const storyRating = getStoryConfig(project, story).rating;
  const names = storyNames(project, story);
  const scenes = (await getReaderScenes())
    .filter((s) => s.id.startsWith(`${key}/scenes/`))
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  const hierarchy = [];
  const sequence = [];
  const containers = new Map();
  for (const [index, scene] of scenes.entries()) {
    const parts = scene.id.split('/').slice(3);
    let siblings = hierarchy;
    let path = '';
    let rated = null;
    let trail = [];
    for (const folder of parts.slice(0, -1)) {
      path = path ? `${path}/${folder}` : folder;
      let node = containers.get(path);
      if (!node) {
        const meta = readMeta(project, story, path);
        const named = names.containers.get(path);
        const slug = named?.slug ?? folder;
        node = {
          type: named?.kind ?? 'chapter',
          level: named?.level ?? 'chapter',
          slug,
          href: url(`/${project}/stories/${story}/${slug}`),
          label: containerLabel(folder, meta.title, named?.number, { format: names.format }),
          meta,
          trail,
          children: [],
        };
        node.rated = VALID_RATINGS.includes(meta.rating) ? { rating: meta.rating, title: node.label } : rated;
        if (meta.rating && !VALID_RATINGS.includes(meta.rating)) {
          warnOnce(`⚠️  ${key}: ${node.label} has the rating "${meta.rating}", which isn't one of ${VALID_RATINGS.join(', ')}.`);
        } else if (meta.rating && storyRating && VALID_RATINGS.indexOf(meta.rating) > VALID_RATINGS.indexOf(storyRating)) {
          warnOnce(`⚠️  ${key}: ${node.label} is rated ${meta.rating}, above the story's ${storyRating}. A story is rated by its highest-rated part.`);
        }
        containers.set(path, node);
        siblings.push(node);
        sequence.push(node);
      }
      siblings = node.children;
      rated = node.rated;
      trail = [...node.trail, { href: `/${project}/stories/${story}/${node.slug}`, label: node.label }];
    }
    const folder = parts.at(-1);
    const slug = names.scenes.get(parts.join('/')) ?? folder;
    const item = { type: 'scene', scene, sceneNumber: index + 1, slug, folder, rated, trail };
    siblings.push(item);
    sequence.push(item);
  }

  const reading = { hierarchy, sequence };
  cache.set(key, reading);
  return reading;
}
