import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { nameStory } from '../shared/names.mjs';
import { scenesDir } from './vault.mjs';
import { warnOnce } from './warnOnce.js';

// A story's names (D-180), read from its folders on disk: every scene's
// slug, every arc's and chapter's address and number. The site's pages and
// the relationships index all ask here, so a scene has one address
// whichever page links to it. Drafts and empty containers count, so an
// address doesn't change when a scene is published.

// Every scene (a folder holding index.md) and every arc or chapter (any
// other folder) in a story's scenes folder, as paths within it.
export function storyFolders(root) {
  const scenes = [];
  const containers = [];
  const walk = (dir, rel) => {
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (existsSync(join(full, 'index.md'))) scenes.push(path);
      else {
        containers.push(path);
        walk(full, path);
      }
    }
  };
  walk(root, '');
  return { scenes, containers };
}

const cache = new Map();

export function storyNames(project, story) {
  const key = `${project}/${story}`;
  if (cache.has(key)) return cache.get(key);
  const { scenes, containers } = storyFolders(scenesDir(project, story));
  const names = nameStory(scenes, containers);
  for (const { kind, slug, paths } of names.repeats) {
    warnOnce(
      `⚠️  ${key}: ${paths.length} ${kind === 'scene' ? 'scenes' : 'arcs or chapters'} share the name "${slug}" (${paths.join(', ')}). ` +
        `The first keeps it as its web address; the others use their full folder names until the story's numbering is tidied.`,
    );
  }
  cache.set(key, names);
  return names;
}
