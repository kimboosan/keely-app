// Moving a vault to the project-first layout (D-166): everything a project
// owns goes into `src/content/projects/{project}/`, and `src/data/` keeps only
// what's site-wide.
//
// planLayoutMigration only reads, so the author can review every move first.
// applyLayoutMigration keeps a copy of the old `src/content` and `src/data`,
// then moves and edits, undoing all of it if anything fails. It never runs on
// its own: the author asks for it (`npm run migrate-layout -- --apply`, or the
// app's offer).
//
// Files are only moved, except for two retired fields, which are removed as
// single lines so nothing else in the file changes: an entity's `project`
// and a story's `slug`. The folder decides both now.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, rmdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import matter from 'gray-matter';
import { parse } from 'smol-toml';

const HISTORY = 'Keely History';
const BACKUP = `${HISTORY}/before-layout-update`;
const OLD_PROJECTS = 'src/data/projects';
const OLD_STORIES = 'src/content/stories';
const NEW_PROJECTS = 'src/content/projects';

const foldersIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : [];

const namesIn = (dir) => (existsSync(dir) ? readdirSync(dir).filter((name) => name !== '.DS_Store') : []);

export function needsLayoutMigration(vault) {
  return existsSync(join(vault, OLD_PROJECTS));
}

// { moves: [{ from, to }], edits: [{ file, field }], notes, problems }, with
// vault-relative paths. Any problem means nothing can be applied.
export function planLayoutMigration(vault) {
  const moves = [];
  const edits = [];
  const notes = [];
  const problems = [];
  const move = (from, to) => moves.push({ from, to });

  // Where history for a scene or entity goes, if the vault has any.
  const moveHistory = (from, to) => {
    if (existsSync(join(vault, HISTORY, from))) move(`${HISTORY}/${from}`, `${HISTORY}/${to}`);
  };

  const projects = foldersIn(join(vault, OLD_PROJECTS));
  const storyFolders = new Map(); // content folder name → { project, story }

  for (const project of projects) {
    move(`${OLD_PROJECTS}/${project}`, `${NEW_PROJECTS}/${project}`);

    for (const story of foldersIn(join(vault, OLD_PROJECTS, project, 'stories'))) {
      const tomlPath = join(vault, OLD_PROJECTS, project, 'stories', story, 'story.toml');
      let contentName = story;
      try {
        const manifest = parse(readFileSync(tomlPath, 'utf-8'));
        if (typeof manifest.slug === 'string') {
          contentName = manifest.slug;
          edits.push({ file: `${NEW_PROJECTS}/${project}/stories/${story}/story.toml`, field: 'slug' });
        }
      } catch {
        problems.push(`${project}/${story}: story.toml can't be read.`);
        continue;
      }
      const clash = storyFolders.get(contentName);
      if (clash) {
        problems.push(`Two stories use the scenes in ${OLD_STORIES}/${contentName}: ${clash.project}/${clash.story} and ${project}/${story}.`);
        continue;
      }
      storyFolders.set(contentName, { project, story });
    }
  }

  for (const contentName of foldersIn(join(vault, OLD_STORIES))) {
    const owner = storyFolders.get(contentName);
    if (!owner) {
      problems.push(`${OLD_STORIES}/${contentName} doesn't belong to any project's story.`);
      continue;
    }
    const target = `${NEW_PROJECTS}/${owner.project}/stories/${owner.story}`;
    const beside = namesIn(join(vault, OLD_PROJECTS, owner.project, 'stories', owner.story));
    for (const name of namesIn(join(vault, OLD_STORIES, contentName))) {
      if (beside.includes(name)) problems.push(`${OLD_STORIES}/${contentName}/${name} would land on a file of the same name.`);
      else move(`${OLD_STORIES}/${contentName}/${name}`, `${target}/${name}`);
    }
    moveHistory(`recovery/${contentName}`, `recovery/${owner.project}/${owner.story}`);
    moveHistory(`versions/stories/${contentName}`, `versions/${owner.project}/stories/${owner.story}`);
  }

  const entityTypes = foldersIn(join(vault, 'src/content')).filter((name) => name !== 'stories' && name !== 'projects');
  for (const type of entityTypes) {
    for (const slug of foldersIn(join(vault, 'src/content', type))) {
      const indexPath = join(vault, 'src/content', type, slug, 'index.md');
      let field;
      try {
        field = matter(readFileSync(indexPath, 'utf-8')).data.project;
      } catch {
        problems.push(`src/content/${type}/${slug} has no readable index.md.`);
        continue;
      }
      const listed = (Array.isArray(field) ? field : [field]).filter((name) => typeof name === 'string' && name.trim());
      const project = listed[0]?.trim();
      if (!project) {
        problems.push(`src/content/${type}/${slug} doesn't say which project it belongs to.`);
      } else if (!projects.includes(project)) {
        problems.push(`src/content/${type}/${slug} belongs to "${project}", which isn't a project here.`);
      } else {
        if (listed.length > 1) notes.push(`${type}/${slug} lists several projects; it goes to "${project}", the first (D-159).`);
        move(`src/content/${type}/${slug}`, `${NEW_PROJECTS}/${project}/${type}/${slug}`);
        edits.push({ file: `${NEW_PROJECTS}/${project}/${type}/${slug}/index.md`, field: 'project' });
        moveHistory(`versions/${type}/${slug}`, `versions/${project}/${type}/${slug}`);
      }
    }
  }

  if (namesIn(join(vault, HISTORY, 'deleted')).length > 0) {
    problems.push('Deleted items can\'t be carried over. Restore them or remove them for good first.');
  }
  if (existsSync(join(vault, BACKUP))) {
    problems.push(`${BACKUP} already exists. Move it somewhere else first.`);
  }
  for (const { to } of moves) {
    if (existsSync(join(vault, to))) problems.push(`${to} already exists.`);
  }
  return { moves, edits, notes, problems };
}

// The field's line, plus the indented or list lines that belong to it. Only
// inside the frontmatter, and nothing else in the file changes.
export function removeFrontmatterField(text, field) {
  const lines = text.split('\n');
  const end = lines.indexOf('---', 1);
  const start = lines.findIndex((line, i) => i > 0 && i < end && line.startsWith(`${field}:`));
  if (start === -1) return text;
  let stop = start + 1;
  while (stop < end && /^(\s+\S|-\s)/.test(lines[stop])) stop += 1;
  lines.splice(start, stop - start);
  return lines.join('\n');
}

export function removeTomlKey(text, key) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => new RegExp(`^${key}\\s*=`).test(line));
  if (start === -1) return text;
  lines.splice(start, 1);
  return lines.join('\n');
}

const removeField = (text, { file, field }) =>
  file.endsWith('.toml') ? removeTomlKey(text, field) : removeFrontmatterField(text, field);

function removeIfEmpty(dir) {
  rmSync(join(dir, '.DS_Store'), { force: true });
  if (existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir);
}

export function applyLayoutMigration(vault, plan = planLayoutMigration(vault), { failAfterSteps } = {}) {
  if (plan.problems.length > 0) throw new Error(plan.problems.join('\n'));

  cpSync(join(vault, 'src/content'), join(vault, BACKUP, 'content'), { recursive: true });
  cpSync(join(vault, 'src/data'), join(vault, BACKUP, 'data'), { recursive: true });

  const moved = [];
  const edited = [];
  let steps = 0;
  const step = () => {
    steps += 1;
    if (failAfterSteps !== undefined && steps > failAfterSteps) throw new Error('Forced failure.');
  };

  try {
    for (const { from, to } of plan.moves) {
      step();
      mkdirSync(dirname(join(vault, to)), { recursive: true });
      renameSync(join(vault, from), join(vault, to));
      moved.push({ from, to });
    }
    for (const edit of plan.edits) {
      step();
      const path = join(vault, edit.file);
      const before = readFileSync(path, 'utf-8');
      edited.push({ path, before });
      writeFileSync(path, removeField(before, edit));
    }
  } catch (err) {
    for (const { path, before } of edited.reverse()) writeFileSync(path, before);
    for (const { from, to } of moved.reverse()) renameSync(join(vault, to), join(vault, from));
    for (const { to } of plan.moves) removeEmptyParents(vault, to);
    rmSync(join(vault, BACKUP), { recursive: true, force: true });
    throw err;
  }

  // What's left is empty folders the moves came out of.
  for (const { from } of plan.moves) removeEmptyParents(vault, from);
  return { moved: moved.length, edited: edited.length, backup: BACKUP };
}

// Up from a moved item, stopping at `src/content`, `src/data` or the history
// folder itself, which stay.
function removeEmptyParents(vault, path) {
  for (let dir = dirname(path); !['src/content', 'src/data', HISTORY, '.'].includes(dir); dir = dirname(dir)) {
    removeIfEmpty(join(vault, dir));
  }
}
