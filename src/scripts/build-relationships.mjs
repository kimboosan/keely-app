import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const STORIES_DIR = './src/content/stories';
const CHARACTERS_DIR = './src/content/characters';
const GROUPS_DIR = './src/content/groups';
const OUTPUT = './src/data/relationships.json';

const characterScenes = {};
const locationScenes = {};
const groupMembers = {};

// Discover all scene folders across all stories
function getSceneFolders(storiesDir) {
  const results = [];
  const storyFolders = readdirSync(storiesDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const storyEntry of storyFolders) {
    const storySlug = storyEntry.name;
    const scenesDir = join(storiesDir, storySlug, 'scenes');
    try {
      readdirSync(scenesDir);
    } catch {
      continue; // no scenes folder, skip
    }
    collectScenes(scenesDir, scenesDir, storySlug, results);
  }
  return results;
}

function collectScenes(dir, baseDir, storySlug, results) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.slice(baseDir.length + 1).replace(/\\/g, '/');
    try {
      readFileSync(join(fullPath, 'index.md'), 'utf-8');
      results.push({ folder: entry.name, fullPath, slug: relativePath, storySlug });
    } catch {
      collectScenes(fullPath, baseDir, storySlug, results);
    }
  }
}

const sceneFolders = getSceneFolders(STORIES_DIR);

// Build scene relationships
for (const { folder, fullPath, slug, storySlug } of sceneFolders) {
  const filePath = join(fullPath, 'index.md');
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const { data } = matter(raw);
  if (data.status !== 'published') continue;

  const sceneRef = { slug, storySlug, title: data.title || folder };

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

// Build mentioned_in from prose wiki-links
const mentionedIn = {};

for (const { folder, fullPath, slug, storySlug } of sceneFolders) {
  const filePath = join(fullPath, 'index.md');
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const { data, content } = matter(raw);
  if (data.status !== 'published') continue;

  const sceneRef = { slug, storySlug, title: data.title || folder };
  const wikiLinks = [...content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(m => m[1].trim());

  for (const wikiSlug of wikiLinks) {
    if (!mentionedIn[wikiSlug]) mentionedIn[wikiSlug] = [];
    const already = mentionedIn[wikiSlug].some(s => s.slug === slug);
    if (!already) mentionedIn[wikiSlug].push(sceneRef);
  }
}

// Build group membership
const characterFolders = readdirSync(CHARACTERS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const folder of characterFolders) {
  const filePath = join(CHARACTERS_DIR, folder, 'index.md');
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const { data } = matter(raw);
  if (!data.groups) continue;

  const memberRef = { slug: folder, name: data.name || folder };

  for (const groupSlug of data.groups) {
    if (!groupMembers[groupSlug]) groupMembers[groupSlug] = [];
    groupMembers[groupSlug].push(memberRef);
  }
}

// Build group relationship mirrors
const groupRelationships = {};

const groupFolders = readdirSync(GROUPS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const folder of groupFolders) {
  const filePath = join(GROUPS_DIR, folder, 'index.md');
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const { data } = matter(raw);

  if (data.opposed_to?.length) {
    if (!groupRelationships[folder]) groupRelationships[folder] = { opposed_to: [], allied_with: [] };
    for (const slug of data.opposed_to) {
      if (!groupRelationships[folder].opposed_to.includes(slug)) {
        groupRelationships[folder].opposed_to.push(slug);
      }
      if (!groupRelationships[slug]) groupRelationships[slug] = { opposed_to: [], allied_with: [] };
      if (!groupRelationships[slug].opposed_to.includes(folder)) {
        groupRelationships[slug].opposed_to.push(folder);
      }
    }
  }

  if (data.allied_with?.length) {
    if (!groupRelationships[folder]) groupRelationships[folder] = { opposed_to: [], allied_with: [] };
    for (const slug of data.allied_with) {
      groupRelationships[folder].allied_with.push(slug);
      if (!groupRelationships[slug]) groupRelationships[slug] = { opposed_to: [], allied_with: [] };
      if (!groupRelationships[slug].allied_with.includes(folder)) {
        groupRelationships[slug].allied_with.push(folder);
      }
    }
  }
}

const relationships = { characterScenes, locationScenes, groupMembers, groupRelationships, mentionedIn };
writeFileSync(OUTPUT, JSON.stringify(relationships, null, 2));
console.log('Relationships index built.');