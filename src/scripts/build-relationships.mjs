import { CACHE, projectDir, projectSlugs, scenesDir, storySlugs } from '../utils/vault.mjs';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { autoLinkShortNames } from '../shared/wikiLinks.mjs';
import { getProjectConfig } from '../utils/config.js';

const OUTPUT = `${CACHE}/relationships.json`;

const characterScenes = {};
const locationScenes = {};
const groupMembers = {};

// Discover all scene folders across all projects' stories
function getSceneFolders() {
  const results = [];
  for (const project of projectSlugs()) {
    for (const storySlug of storySlugs(project)) {
      const scenes = scenesDir(project, storySlug);
      try {
        readdirSync(scenes);
      } catch {
        continue; // no scenes folder, skip
      }
      collectScenes(scenes, scenes, project, storySlug, results);
    }
  }
  return results;
}

function collectScenes(dir, baseDir, project, storySlug, results) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.slice(baseDir.length + 1).replace(/\\/g, '/');
    try {
      readFileSync(join(fullPath, 'index.md'), 'utf-8');
      results.push({ folder: entry.name, fullPath, slug: relativePath, storySlug, project });
    } catch {
      collectScenes(fullPath, baseDir, project, storySlug, results);
    }
  }
}

const sceneFolders = getSceneFolders();

// Build scene relationships
for (const { folder, fullPath, storySlug, project } of sceneFolders) {
  const filePath = join(fullPath, 'index.md');
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const { data } = matter(raw);
  if (data.status !== 'published') continue;

  // `slug` is the scene's own folder name — its web address (scene pages
  // are /stories/<story>/scenes/<folder>, whatever arc or chapter holds
  // it). Only unique within a story, so compare it with storySlug.
  const sceneRef = { slug: folder, storySlug, project, title: data.title || folder };

  const characters = data.characters_in_scene || [];
  for (const slug of characters) {
    if (!characterScenes[slug]) characterScenes[slug] = [];
    characterScenes[slug].push(sceneRef);
  }

  if (data.scene_location) {
    const loc = data.scene_location;
    if (!locationScenes[loc]) locationScenes[loc] = [];
    locationScenes[loc].push(sceneRef);
  }
}

// Build mentioned_in from prose wiki-links — including short names that
// link themselves in projects with `auto_link` on (D-160), so Mentioned In
// matches what readers see. The entity index (built just before this step)
// gives each project's short names; a short name two entities share is
// noted here, once per build.
const mentionedIn = {};
const entityIndex = JSON.parse(readFileSync(`${CACHE}/entities.json`, 'utf-8'));
const autoLinkProjects = new Set(
  projectSlugs().filter((project) => {
    try {
      return getProjectConfig(project).auto_link === true;
    } catch {
      return false;
    }
  }),
);
const clashesNoted = new Set();
function withAutoLinks(content, project) {
  if (!autoLinkProjects.has(project)) return content;
  return autoLinkShortNames(content, entityIndex[project] ?? {}, {
    onClash: (shortName, slugs) => {
      const key = `${project}\u0000${shortName}`;
      if (clashesNoted.has(key)) return;
      clashesNoted.add(key);
      console.warn(
        `⚠️  "${shortName}" is the short name of more than one entity in ${project} (${slugs.join(', ')}), so it doesn't link itself. Give each its own short name, or link with [[…]].`
      );
    },
  });
}

for (const { folder, fullPath, storySlug, project } of sceneFolders) {
  const filePath = join(fullPath, 'index.md');
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const { data, content } = matter(raw);
  if (data.status !== 'published') continue;

  // `slug` is the scene's own folder name — its web address (scene pages
  // are /stories/<story>/scenes/<folder>, whatever arc or chapter holds
  // it). Only unique within a story, so compare it with storySlug.
  const sceneRef = { slug: folder, storySlug, project, title: data.title || folder };
  const wikiLinks = [...withAutoLinks(content, sceneRef.project).matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(m => m[1].trim());

  for (const wikiSlug of wikiLinks) {
    if (!mentionedIn[wikiSlug]) mentionedIn[wikiSlug] = [];
    const already = mentionedIn[wikiSlug].some(s => s.slug === folder && s.storySlug === storySlug && s.project === project);
    if (!already) mentionedIn[wikiSlug].push(sceneRef);
  }
}

// Build group membership and group relationship mirrors, one project at a
// time: a slug only means something inside its own project (D-166).
const groupRelationships = {};

const foldersIn = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  } catch {
    return []; // a project with none of these yet
  }
};

for (const project of projectSlugs()) {
  const charactersDir = join(projectDir(project), 'characters');
  for (const folder of foldersIn(charactersDir)) {
    const filePath = join(charactersDir, folder, 'index.md');
    let raw;
    try {
      raw = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const { data } = matter(raw);
    if (!data.groups) continue;

    const memberRef = { slug: folder, name: data.name || folder, project };

    for (const groupSlug of data.groups) {
      if (!groupMembers[groupSlug]) groupMembers[groupSlug] = [];
      groupMembers[groupSlug].push(memberRef);
    }
  }

  const mirrors = (groupRelationships[project] = {});
  const groupsDir = join(projectDir(project), 'groups');
  for (const folder of foldersIn(groupsDir)) {
    const filePath = join(groupsDir, folder, 'index.md');
    let raw;
    try {
      raw = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const { data } = matter(raw);

    if (data.opposed_to?.length) {
      if (!mirrors[folder]) mirrors[folder] = { opposed_to: [], allied_with: [] };
      for (const slug of data.opposed_to) {
        if (!mirrors[folder].opposed_to.includes(slug)) {
          mirrors[folder].opposed_to.push(slug);
        }
        if (!mirrors[slug]) mirrors[slug] = { opposed_to: [], allied_with: [] };
        if (!mirrors[slug].opposed_to.includes(folder)) {
          mirrors[slug].opposed_to.push(folder);
        }
      }
    }

    if (data.allied_with?.length) {
      if (!mirrors[folder]) mirrors[folder] = { opposed_to: [], allied_with: [] };
      for (const slug of data.allied_with) {
        mirrors[folder].allied_with.push(slug);
        if (!mirrors[slug]) mirrors[slug] = { opposed_to: [], allied_with: [] };
        if (!mirrors[slug].allied_with.includes(folder)) {
          mirrors[slug].allied_with.push(folder);
        }
      }
    }
  }
}

const relationships = { characterScenes, locationScenes, groupMembers, groupRelationships, mentionedIn };
writeFileSync(OUTPUT, JSON.stringify(relationships, null, 2));
console.log('Relationships index built.');