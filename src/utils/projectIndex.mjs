// The computed indexes (`npm run index`, in .keely-cache/) as one project
// sees them (D-159): an entity belongs to exactly one project, and its
// links, appearances and mentions stay inside it.
import { readFileSync } from 'fs';
import { CACHE } from './vault.mjs';
import { getProjectConfig } from './config.js';

// The project's own entities, by slug — what `[[slug]]` can resolve to on
// that project's pages.
export function readEntityIndex(project) {
  const index = JSON.parse(readFileSync(`${CACHE}/entities.json`, 'utf-8'));
  return index[project] ?? {};
}

// Another project, for [[project/slug]] links (D-164): its title and its
// entities, or null if there's no such project.
export function readOtherProject(project) {
  const index = JSON.parse(readFileSync(`${CACHE}/entities.json`, 'utf-8'));
  if (!index[project]) return null;
  return { title: getProjectConfig(project).title, entityIndex: index[project] };
}

// relationships.json with every scene and member reference narrowed to the
// project's own stories and characters.
export function readRelationships(project) {
  const all = JSON.parse(readFileSync(`${CACHE}/relationships.json`, 'utf-8'));
  const mine = (byEntity) =>
    Object.fromEntries(Object.entries(byEntity ?? {}).map(([slug, refs]) => [slug, refs.filter((r) => r.project === project)]));
  return {
    ...all,
    characterScenes: mine(all.characterScenes),
    locationScenes: mine(all.locationScenes),
    mentionedIn: mine(all.mentionedIn),
    groupMembers: mine(all.groupMembers),
    groupRelationships: all.groupRelationships[project] ?? {},
  };
}
