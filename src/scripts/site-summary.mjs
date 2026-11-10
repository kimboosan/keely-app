// What a real build would put online (D-168), for the app's review before
// an update: per project, its wiki entries, and per story, how many scenes
// go out and how many stay behind. The rule is the build's own
// (published.mjs), so the review can't disagree with the site.
//
// `node src/scripts/site-summary.mjs --json` prints one line of JSON last:
// `{ ok: true, projects: [{ slug, title, wikiEntries, stories: [{ slug, title, published, heldBack }] }] }`,
// or, when files can't be read, `{ ok: true, projects: [], unreadable: [{ file, what }] }`: every one
// of them, so the app can name them all (Epic 2M, 4C). The site can't be made until they're fixed.
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { CACHE, scenesDir } from '../utils/vault.mjs';
import { getProjects, getStoriesForProject } from '../utils/config.js';
import { isPublished } from '../utils/published.mjs';
import { findUnreadable } from '../utils/unreadable.mjs';

// First, before anything that would stop at the first unreadable file.
const unreadable = findUnreadable();
if (unreadable.length > 0) {
  console.log(JSON.stringify({ ok: true, projects: [], unreadable }));
  process.exit(0);
}

// Wiki entries come from the entity index, the same list the site's pages use.
await import('./build-entity-index.mjs');
const entities = JSON.parse(readFileSync(`${CACHE}/entities.json`, 'utf-8'));

// A scene is a folder holding an index.md; arcs and chapters hold scenes.
function sceneFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const file = join(dir, entry.name, 'index.md');
      return existsSync(file) ? [file] : sceneFiles(join(dir, entry.name));
    });
}

try {
  const projects = getProjects().map((project) => ({
    slug: project.slug,
    title: project.title ?? project.slug,
    wikiEntries: Object.keys(entities[project.slug] ?? {}).length,
    stories: getStoriesForProject(project.slug).map((story) => {
      const scenes = sceneFiles(scenesDir(project.slug, story.slug)).map((file) => matter(readFileSync(file, 'utf-8')).data);
      const published = scenes.filter(isPublished).length;
      return { slug: story.slug, title: story.title ?? story.slug, published, heldBack: scenes.length - published };
    }),
  }));
  console.log(JSON.stringify({ ok: true, projects }));
} catch (err) {
  console.error(err);
  console.log(JSON.stringify({ ok: false, error: { code: 'failed', message: 'Keely couldn’t read your stories to see what would go online.' } }));
  process.exitCode = 1;
}
