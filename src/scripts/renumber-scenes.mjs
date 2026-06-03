/**
 * renumber-scenes.mjs
 *
 * Resequences scene folder numeric prefixes to globally sequential order
 * (01, 02, 03... across the entire story) and updates all wiki-links that
 * referenced renamed slugs.
 *
 * Scene slugs are globally unique within a story — numbering resets at
 * container boundaries are not used. This ensures wiki-links like
 * [[05-breakdown]] are unambiguous regardless of which chapter the scene
 * lives in.
 *
 * Only scene folders (those containing index.md) are renumbered.
 * Container folders (arcs, chapters) are traversed but not touched.
 *
 * Usage:
 *   npm run renumber -- <story-slug>           ← dry run, no files changed
 *   npm run renumber -- <story-slug> --apply   ← applies all changes
 *
 * Note: wiki-links in src/data/ files (story.toml, project.toml author notes)
 * are not scanned. Update any scene references in those files manually.
 */

import { readdir, readFile, writeFile, rename as fsRename } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// ─── Args & setup ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const storySlug = args.find(a => !a.startsWith('--'));
const apply = args.includes('--apply');

if (!storySlug) {
  console.error('\nUsage: npm run renumber -- <story-slug> [--apply]\n');
  process.exit(1);
}

const CONTENT_ROOT = './src/content';
const scenesRoot = join(CONTENT_ROOT, 'stories', storySlug, 'scenes');

if (!existsSync(scenesRoot)) {
  console.error(`\n✗ No scenes folder found at ${scenesRoot}`);
  console.error(`  Is "${storySlug}" a valid story slug?\n`);
  process.exit(1);
}

console.log(`\nKeely — Scene renumbering`);
console.log(`Story: ${storySlug}`);
console.log(apply
  ? '⚡ APPLY MODE — folders will be renamed and wiki-links updated.\n'
  : '🔍 DRY RUN — nothing will change. Pass --apply to apply.\n'
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mark = (applied) => applied ? '✓' : '○';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isScene(dir) {
  return existsSync(join(dir, 'index.md'));
}

function stripPrefix(name) {
  return name.replace(/^\d+-/, '');
}

function withPrefix(n, bare) {
  return `${String(n).padStart(2, '0')}-${bare}`;
}

// ─── Step 1: Collect all scenes in global traversal order ─────────────────────
// Walks the entire scenes tree depth-first, alphabetically at each level.
// The order here matches the generator's traversal — it determines each
// scene's global position in the story.

async function collectScenes(dir, result = []) {
  const entries = (await readdir(dir, { withFileTypes: true }))
    .filter(e => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const e of entries) {
    const fullPath = join(dir, e.name);
    if (isScene(fullPath)) {
      result.push({ dir, name: e.name });
    } else {
      await collectScenes(fullPath, result);
    }
  }
  return result;
}

// ─── Step 2: Build rename map ─────────────────────────────────────────────────
// Each scene's numeric prefix is compared against its global position.
// A scene at global position 5 should have prefix "05". Mismatches are flagged.

async function buildRenameMap(scenesRoot) {
  const allScenes = await collectScenes(scenesRoot);
  const renames = {};  // oldSlug → newSlug  (for wiki-link updates)
  const moves   = [];  // { dir, oldName, newName }  (for folder renames)

  for (let i = 0; i < allScenes.length; i++) {
    const { dir, name } = allScenes[i];
    const expected = withPrefix(i + 1, stripPrefix(name));
    if (name !== expected) {
      renames[name] = expected;
      moves.push({ dir, oldName: name, newName: expected });
    }
  }

  return { renames, moves };
}

// ─── Step 3: Apply folder renames (two-pass) ──────────────────────────────────
// Pass 1 → temp names, Pass 2 → final names.
// Two passes prevent collisions when scenes shift into each other's positions.

async function applyFolderRenames(moves) {
  for (const { dir, oldName } of moves) {
    if (apply) await fsRename(join(dir, oldName), join(dir, `__tmp__${oldName}`));
  }
  for (const { dir, oldName, newName } of moves) {
    if (apply) await fsRename(join(dir, `__tmp__${oldName}`), join(dir, newName));
    console.log(`  ${mark(apply)} ${oldName} → ${newName}`);
  }
}

// ─── Step 4: Update wiki-links in all src/content index.md files ─────────────

async function findAllIndexFiles(dir, found = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      await findAllIndexFiles(join(dir, e.name), found);
    } else if (e.name === 'index.md') {
      found.push(join(dir, e.name));
    }
  }
  return found;
}

async function updateFileLinks(filePath, renames) {
  let content = await readFile(filePath, 'utf-8');
  let changed = false;

  for (const [oldSlug, newSlug] of Object.entries(renames)) {
    const re = new RegExp(
      `\\[\\[${escapeRegex(oldSlug)}(\\|[^\\]]+)?\\]\\]`,
      'g'
    );
    const result = content.replace(re, (_, display) =>
      display ? `[[${newSlug}${display}]]` : `[[${newSlug}]]`
    );
    if (result !== content) { content = result; changed = true; }
  }

  if (changed && apply) await writeFile(filePath, content);
  return changed;
}

async function updateAllLinks(renames) {
  const files = await findAllIndexFiles(CONTENT_ROOT);
  let count = 0;
  for (const file of files) {
    if (await updateFileLinks(file, renames)) {
      console.log(`  ${mark(apply)} ${file.replace(CONTENT_ROOT + '/', '')}`);
      count++;
    }
  }
  return count;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const { renames, moves } = await buildRenameMap(scenesRoot);

if (moves.length === 0) {
  console.log('✓ Scene folders are already in sequence — nothing to do.\n');
  process.exit(0);
}

console.log(`${moves.length} scene(s) to renumber:\n`);

console.log('Folder renames:');
if (apply) {
  await applyFolderRenames(moves);
} else {
  for (const { oldName, newName } of moves) {
    console.log(`  ○ ${oldName} → ${newName}`);
  }
}

console.log('\nWiki-link updates:');
const linkCount = await updateAllLinks(renames);
if (linkCount === 0) console.log('  (no wiki-links needed updating)');

console.log('\n─────────────────────────────────────────');
if (apply) {
  console.log(`✓ Done. ${moves.length} folder(s) renamed, ${linkCount} file(s) updated.`);
  console.log('  Run npm run index then npm run build to verify.\n');
} else {
  console.log('Dry run complete. Run with --apply to apply these changes.\n');
}