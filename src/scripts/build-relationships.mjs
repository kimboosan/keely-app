import { CACHE, PROJECTS, projectDir, projectSlugs, scenesDir, storyDir, storySlugs } from '../utils/vault.mjs';
import { parse as parseToml } from 'smol-toml';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';
import { computeRelationships } from '../shared/relationships.mjs';
import { getProjectConfig } from '../utils/config.js';
import { storyNames } from '../utils/storyNames.mjs';

// Reads each project's scenes and entities and hands them to the shared
// relationship rules (D-176), which the app's Entity Hub uses too. This
// file only reads files and writes the result for the pages.

const OUTPUT = `${CACHE}/relationships.json`;

const foldersIn = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
};

// A TOML file's contents; a missing or unreadable one is empty.
const readToml = (file) => {
  try {
    return parseToml(readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
};

// A story's scenes in reading order (folders holding index.md), and its
// arcs and chapters (the folders between), recursing.
function scenesOf(project, storySlug) {
  const base = scenesDir(project, storySlug);
  const found = [];
  const containers = [];
  const walk = (dir) => {
    for (const name of foldersIn(dir)) {
      const full = join(dir, name);
      const path = full.slice(base.length + 1).replace(/\\/g, '/');
      if (existsSync(join(full, 'index.md'))) found.push({ folder: name, full, path });
      else {
        containers.push({ path, data: readToml(join(full, '_meta.toml')) });
        walk(full);
      }
    }
  };
  walk(base);
  return { scenes: found, containers };
}

// The scene's cast and location fields hold bare slugs (`astra`), which is
// what the app writes and these lists match on. A link (`[[astra]]`) is the
// one mistake that fails silently, since older docs showed it: say so,
// rather than read both forms (D-174). Drafts too, so it's caught early.
const SLUG_FIELDS = ['pov_character', 'characters_in_scene', 'scene_location', 'also_at'];
function noteBracketedSlugs(data, file) {
  for (const field of SLUG_FIELDS) {
    for (const value of [].concat(data[field] ?? [])) {
      const slug = typeof value === 'string' && value.trim().match(/^\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/)?.[1].trim();
      if (slug) {
        console.warn(
          `⚠️  ${file}: ${field} lists "[[${slug}]]". Write it as ${slug}, without the brackets, or this scene won't show on ${slug}'s page.`
        );
      }
    }
  }
}

const characterScenes = {};
const locationScenes = {};
const mentionedIn = {};
const groupMembers = {};
const groupRelationships = {};
const featuredIn = {};
const merge = (into, from, project) => {
  for (const [slug, refs] of Object.entries(from)) (into[slug] ??= []).push(...refs.map((r) => ({ ...r, project })));
};

for (const project of projectSlugs()) {
  const scenes = [];
  const stories = [];
  for (const storySlug of storySlugs(project)) {
    const { scenes: storyScenes, containers: found } = scenesOf(project, storySlug);
    // Addresses and arc and chapter numbers, as the pages give them (D-180).
    const names = storyNames(project, storySlug);
    const containers = found.map((c) => ({ ...c, ...names.containers.get(c.path), format: names.format }));
    // `featuring` on the story and its arcs and chapters (D-172).
    stories.push({ slug: storySlug, data: readToml(join(storyDir(project, storySlug), 'story.toml')), containers });
    for (const { folder, full, path } of storyScenes) {
      const file = join(full, 'index.md');
      const { data, content } = matter(readFileSync(file, 'utf-8'));
      noteBracketedSlugs(data, relative(PROJECTS, file));
      scenes.push({ storySlug, slug: names.scenes.get(path) ?? folder, path, data, body: content });
    }
  }

  // Every entity, any type: each folder in the project but `stories`.
  const entities = [];
  for (const type of foldersIn(projectDir(project)).filter((name) => name !== 'stories')) {
    for (const slug of foldersIn(join(projectDir(project), type))) {
      const file = join(projectDir(project), type, slug, 'index.md');
      if (!existsSync(file)) continue;
      const { data, content } = matter(readFileSync(file, 'utf-8'));
      entities.push({ type, slug, data, body: content });
    }
  }

  let autoLink = false;
  try {
    autoLink = getProjectConfig(project).auto_link === true;
  } catch {
    // No readable project.toml: no short names link themselves.
  }
  const clashes = new Set();
  const r = computeRelationships({
    scenes,
    stories,
    entities,
    autoLink,
    onClash: (shortName, slugs) => {
      if (clashes.has(shortName)) return;
      clashes.add(shortName);
      console.warn(
        `⚠️  "${shortName}" is the short name of more than one entity in ${project} (${slugs.join(', ')}), so it doesn't link itself. Give each its own short name, or link with [[…]].`
      );
    },
  });

  merge(characterScenes, r.appearsIn, project);
  merge(locationScenes, r.atLocation, project);
  merge(mentionedIn, r.mentionedIn, project);
  merge(groupMembers, r.groupMembers, project);
  groupRelationships[project] = r.groupRelations;
  featuredIn[project] = r.featuredIn;
}

const relationships = { characterScenes, locationScenes, groupMembers, groupRelationships, mentionedIn, featuredIn };
writeFileSync(OUTPUT, JSON.stringify(relationships, null, 2));
console.log('Relationships index built.');
