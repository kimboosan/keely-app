// Every file in the vault the site can't be made from, because it can't be
// read (Epic 2M, 4C). The build stops at the first one, with a message only
// a developer could use; this lists them all, so the desktop app can name
// them before the author tries to put the site online.
//
// findUnreadable() → [{ file, what }]
//   file: the file's path inside the vault's `src/`
//   what: what it is, in the author's words ("A scene in Family Feud: 01-the-order")
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';
import { parse as parseToml } from 'smol-toml';
import { DATA, VAULT, projectDir, projectSlugs, scenesDir, storyDir, storySlugs } from './vault.mjs';

function folders(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

// Whether a file reads, and if so what it holds.
function readToml(file) {
  try {
    return { ok: true, data: parseToml(readFileSync(file, 'utf-8')) };
  } catch {
    return { ok: false };
  }
}

function readsAsMarkdown(file) {
  try {
    matter(readFileSync(file, 'utf-8'));
    return true;
  } catch {
    return false;
  }
}

export function findUnreadable() {
  const found = [];
  const add = (file, what) => found.push({ file: relative(join(VAULT, 'src'), file), what });

  for (const [name, what] of [['publisher.toml', 'Your site’s settings'], ['authors.toml', 'Your list of authors']]) {
    const file = join(DATA, name);
    if (existsSync(file) && !readToml(file).ok) add(file, `${what}: ${name}`);
  }

  for (const project of projectSlugs()) {
    const projectFile = join(projectDir(project), 'project.toml');
    if (existsSync(projectFile) && !readToml(projectFile).ok) add(projectFile, `A project’s settings: ${project}/project.toml`);

    // Entries: every folder but `stories` is an entity type (D-166).
    for (const type of folders(projectDir(project)).filter((name) => name !== 'stories')) {
      for (const slug of folders(join(projectDir(project), type))) {
        const file = join(projectDir(project), type, slug, 'index.md');
        if (existsSync(file) && !readsAsMarkdown(file)) add(file, `An entry in ${type}: ${slug}`);
      }
    }

    for (const story of storySlugs(project)) {
      const storyFile = join(storyDir(project, story), 'story.toml');
      const read = existsSync(storyFile) ? readToml(storyFile) : { ok: true, data: {} };
      if (!read.ok) add(storyFile, `A story’s settings: ${story}/story.toml`);
      const storyTitle = (read.ok && typeof read.data.title === 'string' && read.data.title.trim()) || story;

      // Scenes are folders holding an index.md; arcs and chapters hold scenes.
      const walk = (dir) => {
        for (const name of folders(dir)) {
          const folder = join(dir, name);
          const scene = join(folder, 'index.md');
          if (existsSync(scene)) {
            if (!readsAsMarkdown(scene)) add(scene, `A scene in ${storyTitle}: ${name}`);
            continue;
          }
          const meta = join(folder, '_meta.toml');
          if (existsSync(meta) && !readToml(meta).ok) add(meta, `An arc or chapter’s settings in ${storyTitle}: ${name}/_meta.toml`);
          walk(folder);
        }
      };
      walk(scenesDir(project, story));
    }
  }
  return found;
}
