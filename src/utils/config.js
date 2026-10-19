import { DATA } from './vault.mjs';
import { readFileSync, readdirSync } from 'fs';
import { parse } from 'smol-toml';

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(raw) {
  const d = raw instanceof Date
    ? new Date(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate())
    : (() => {
        const [y, m, day] = raw.split('-').map(Number);
        return new Date(y, m - 1, day);
      })();
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getPublisherConfig() {
  const raw = readFileSync(`${DATA}/publisher.toml`, 'utf-8');
  return parse(raw);
}

export function getAuthors() {
  const raw = readFileSync(`${DATA}/authors.toml`, 'utf-8');
  const parsed = parse(raw);
  return parsed.authors ?? [];
}

const VALID_RATINGS = ['Not Rated', 'General Audiences', 'Teen and Up', 'Mature', 'Explicit'];

const { genres: VALID_GENRES } = JSON.parse(readFileSync(`${DATA}/genres.json`, 'utf-8'));

function assertValidGenre(genre, context) {
  if (!genre) {
    throw new Error(`[Keely] ${context} is missing required field: genre`);
  }
  if (!VALID_GENRES.includes(genre)) {
    throw new Error(
      `[Keely] ${context} has invalid genre "${genre}". Valid values: ${VALID_GENRES.join(', ')}`
    );
  }
}

export function getProjects() {
  const projectsPath = `${DATA}/projects`;
  const projectFolders = readdirSync(projectsPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  return projectFolders.map(slug => {
    const raw = readFileSync(`${projectsPath}/${slug}/project.toml`, 'utf-8');
    const config = parse(raw);

    assertValidGenre(config.genre, `project "${slug}"`);
    if (!config.rating) {
      console.warn(`[Keely] WARNING: project "${slug}" is missing required field: rating`);
    } else if (!VALID_RATINGS.includes(config.rating)) {
      console.warn(`[Keely] WARNING: project "${slug}" has invalid rating "${config.rating}". Valid values: ${VALID_RATINGS.join(', ')}`);
    }

    return {
      slug,
      title: config.title,
      tagline: config.tagline,
      cover: config.cover ?? null,
      banner: config.banner ?? null,
      genre: config.genre ?? null,
      subgenre: config.subgenre ?? [],
      rating: config.rating ?? null,
    };
  });
}

export function getProjectConfig(projectSlug) {
  const raw = readFileSync(`${DATA}/projects/${projectSlug}/project.toml`, 'utf-8');
  return parse(raw);
}

export function getStoriesForProject(projectSlug) {
  const storiesPath = `${DATA}/projects/${projectSlug}/stories`;
  const storyFolders = readdirSync(storiesPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  return storyFolders.map(slug => {
    const raw = readFileSync(`${storiesPath}/${slug}/story.toml`, 'utf-8');
    const config = parse(raw);

    assertValidGenre(config.genre, `story "${slug}" in project "${projectSlug}"`);
    if (!config.rating) {
      console.warn(`[Keely] WARNING: story "${slug}" in project "${projectSlug}" is missing required field: rating`);
    } else if (!VALID_RATINGS.includes(config.rating)) {
      console.warn(`[Keely] WARNING: story "${slug}" in project "${projectSlug}" has invalid rating "${config.rating}". Valid values: ${VALID_RATINGS.join(', ')}`);
    }

    return {
      slug,
      title: config.title,
      tagline: config.tagline,
      completion_status: config.completion_status,
      genre: config.genre ?? null,
      subgenre: config.subgenre ?? [],
      rating: config.rating ?? null,
    };
  });
}

export function getStoryConfig(projectSlug, storySlug) {
  const projectRaw = readFileSync(`${DATA}/projects/${projectSlug}/project.toml`, 'utf-8');
  const projectConfig = parse(projectRaw);
  
  const storyRaw = readFileSync(`${DATA}/projects/${projectSlug}/stories/${storySlug}/story.toml`, 'utf-8');
  const storyConfig = parse(storyRaw);

  return {
    ...projectConfig,
    ...storyConfig,
    reader_defaults: {
      ...projectConfig.reader_defaults,
      ...storyConfig.reader_defaults,
    },
  };
}