import { readdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'smol-toml';

const CONTENT_ROOT = './src/content';
const PROJECTS_ROOT = './src/data/projects';
const OUTPUT_PATH = './src/data/entities.json';
const CUSTOM_TYPES_OUTPUT = './src/data/custom-entity-types.json';

const BUILTIN_TYPES = new Set(['characters', 'places', 'groups']);

// Built-in entity types — always indexed
const builtinEntityTypes = [
  { folder: 'characters', type: 'character', urlPrefix: 'characters' },
  { folder: 'places',     type: 'place',     urlPrefix: 'places'     },
  { folder: 'groups',     type: 'group',     urlPrefix: 'groups'     },
];

// Read a single frontmatter field from a markdown file
async function getFieldFromFile(filePath, field) {
  const contents = await readFile(filePath, 'utf-8');
  const match = contents.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

// Check for image fields missing alt text — built-in types only
// (custom entity image field names vary by type declaration)
async function getImageFieldsFromFile(filePath) {
  const contents = await readFile(filePath, 'utf-8');
  const results = [];

  const portrait    = contents.match(/^portrait:\s*(.+)$/m);
  const portraitAlt = contents.match(/^portrait_alt:\s*(.+)$/m);
  if (portrait && portrait[1].trim() && (!portraitAlt || !portraitAlt[1].trim())) {
    results.push('portrait_alt');
  }

  const image    = contents.match(/^image:\s*(.+)$/m);
  const imageAlt = contents.match(/^image_alt:\s*(.+)$/m);
  if (image && image[1].trim() && (!imageAlt || !imageAlt[1].trim())) {
    results.push('image_alt');
  }

  return results;
}

// Read all project.toml files and collect custom entity type names
async function getCustomEntityTypes() {
  const customTypes = new Set();

  if (!existsSync(PROJECTS_ROOT)) {
    console.warn(`[Keely] Projects folder not found at ${PROJECTS_ROOT} — no custom types loaded.`);
    return [];
  }

  let projectSlugs;
  try {
    const entries = await readdir(PROJECTS_ROOT, { withFileTypes: true });
    projectSlugs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    return [];
  }

  for (const slug of projectSlugs) {
    const tomlPath = join(PROJECTS_ROOT, slug, 'project.toml');
    try {
      const content = await readFile(tomlPath, 'utf-8');
      const config = parse(content);
      const entityTypes = config.entity_types ?? [];
      for (const entityType of entityTypes) {
        if (entityType.name && !BUILTIN_TYPES.has(entityType.name)) {
          customTypes.add(entityType.name);
        }
      }
    } catch {
      // project.toml missing or malformed — skip silently
    }
  }

  return [...customTypes];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Collect custom entity types from all project.toml files
const customTypeNames = await getCustomEntityTypes();

// Write src/data/custom-entity-types.json for content.config.ts to read
await writeFile(
  CUSTOM_TYPES_OUTPUT,
  JSON.stringify({ customTypes: customTypeNames }, null, 2)
);
console.log(
  customTypeNames.length > 0
    ? `Custom entity types: ${customTypeNames.join(', ')}`
    : 'No custom entity types declared.'
);

// Build the full list of types to index (built-in + custom)
const allEntityTypes = [
  ...builtinEntityTypes,
  ...customTypeNames.map(name => ({ folder: name, type: name, urlPrefix: name })),
];

// Build the entity index
const index = {};

for (const { folder, type, urlPrefix } of allEntityTypes) {
  const folderPath = join(CONTENT_ROOT, folder);

  let slugs;
  try {
    slugs = await readdir(folderPath);
  } catch {
    if (!BUILTIN_TYPES.has(folder)) {
      console.warn(`[Keely] No folder at src/content/${folder} — skipping. Create it or remove the declaration.`);
    }
    continue;
  }

  for (const slug of slugs) {
    const filePath = join(folderPath, slug, 'index.md');
    const name = await getFieldFromFile(filePath, 'name');
    const shortName = await getFieldFromFile(filePath, 'short_name');
    if (name) {
      index[slug] = { name, short_name: shortName ?? null, type, urlPrefix };
    }
    // Alt text checks for built-in types only — custom image fields vary by type
    if (BUILTIN_TYPES.has(folder)) {
      const missingAlts = await getImageFieldsFromFile(filePath);
      for (const field of missingAlts) {
        console.warn(`⚠️  Missing ${field} in ${folder}/${slug}/index.md`);
      }
    }
  }
}

await writeFile(OUTPUT_PATH, JSON.stringify(index, null, 2));
console.log(`Entity index written to ${OUTPUT_PATH}`);