import { getProjectConfig, slugify } from './config.js';
import { projectEntityTypes } from './projectEntities.js';
import { storyTagsInProject } from './storyTags.js';

// Every tag used in a project, as [slug, label] pairs sorted by label:
// entities' tags (every type, D-086), the project's own, and its stories'
// at any level (D-175). The tag index and the wiki index both list these.
export async function projectTags(project) {
  const projectConfig = await getProjectConfig(project);
  const allEntities = (await projectEntityTypes(project)).flatMap((t) => t.entries);

  const tagMap = new Map();
  const note = (tag) => {
    const slug = slugify(String(tag));
    if (slug && !tagMap.has(slug)) tagMap.set(slug, String(tag));
  };
  for (const entity of allEntities) (entity.data.tags ?? []).forEach(note);
  (projectConfig.tags ?? []).forEach(note);
  for (const { tags } of (await storyTagsInProject(project)).values()) {
    for (const [slug, label] of tags) if (!tagMap.has(slug)) tagMap.set(slug, label);
  }

  return [...tagMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
}
