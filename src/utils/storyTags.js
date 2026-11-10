import { readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseToml } from 'smol-toml';
import { getReaderScenes } from './readerScenes.js';
import { getStoriesForProject, getStoryConfig, slugify } from './config.js';
import { scenesDir } from './vault.mjs';

// Every tag each of a project's stories carries, at any level (D-175): the
// story's own (story.toml), its arcs' and chapters' (_meta.toml), and its
// scenes'. Only what a reader can reach counts — published scenes, and the
// arcs and chapters that hold them — so a draft's tags never show.
//
// Returns Map(storySlug → { title, tags: Map(tagSlug → label) }), in the
// project's story order. A tag's label is its first spelling met.
export async function storyTagsInProject(project) {
  const scenes = (await getReaderScenes()).filter((s) => s.id.startsWith(`${project}/`));
  const stories = new Map();

  for (const story of getStoriesForProject(project)) {
    const tags = new Map();
    const add = (tag) => {
      const slug = slugify(String(tag));
      if (slug && !tags.has(slug)) tags.set(slug, String(tag));
    };

    getStoryConfig(project, story.slug).tags.forEach(add);

    // A scene's id is `{project}/{story}/scenes/{arc…}/{scene}`; the folders
    // between are the arcs and chapters that hold it.
    const containers = new Set();
    for (const scene of scenes.filter((s) => s.id.startsWith(`${project}/${story.slug}/scenes/`))) {
      (scene.data.tags ?? []).forEach(add);
      const folders = scene.id.split('/').slice(3, -1);
      folders.forEach((_, i) => containers.add(folders.slice(0, i + 1).join('/')));
    }
    for (const container of containers) {
      try {
        const meta = parseToml(readFileSync(join(scenesDir(project, story.slug), container, '_meta.toml'), 'utf-8'));
        (meta.tags ?? []).forEach(add);
      } catch {
        // No _meta.toml, or unreadable: the container adds no tags.
      }
    }

    stories.set(story.slug, { title: story.title, tags });
  }
  return stories;
}
