import { CACHE, projectDir, projectSlugs } from '../utils/vault.mjs';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'smol-toml';
import matter from 'gray-matter';
import { BUILT_IN_ENTITY_TYPES, RESERVED_TYPE_NAMES } from '../shared/entityTypes.mjs';

const OUTPUT_PATH = `${CACHE}/entities.json`;
const CUSTOM_TYPES_OUTPUT = `${CACHE}/custom-entity-types.json`;

const BUILTIN_TYPES = new Set(BUILT_IN_ENTITY_TYPES);

// Built-in entity types — always indexed
const builtinEntityTypes = [
  { folder: 'characters', type: 'character', urlPrefix: 'characters' },
  { folder: 'places',     type: 'place',     urlPrefix: 'places'     },
  { folder: 'groups',     type: 'group',     urlPrefix: 'groups'     },
];

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

// Read all project.toml files and collect custom entity type names, by
// the project that declares them.
async function getCustomEntityTypes() {
  const byProject = {};

  for (const slug of projectSlugs()) {
    byProject[slug] = [];
    const tomlPath = join(projectDir(slug), 'project.toml');
    try {
      const content = await readFile(tomlPath, 'utf-8');
      const config = parse(content);
      const entityTypes = config.entity_types ?? [];
      for (const entityType of entityTypes) {
        if (!entityType.name || BUILTIN_TYPES.has(entityType.name)) continue;
        // A name the site already uses for its own pages (entityTypes.mjs).
        if (RESERVED_TYPE_NAMES.has(entityType.name)) {
          console.warn(
            `⚠️  Custom entity type "${entityType.name}" (in ${slug}'s project.toml) can't be used: ` +
            `the site already has pages called "${entityType.name}". Rename the type and its folder.`
          );
          continue;
        }
        byProject[slug].push(entityType.name);
      }
    } catch {
      // project.toml missing or malformed — skip silently
    }
  }

  return byProject;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Collect custom entity types from all project.toml files
const customTypesByProject = await getCustomEntityTypes();
const customTypeNames = [...new Set(Object.values(customTypesByProject).flat())];

// For content.config.ts to read
await writeFile(
  CUSTOM_TYPES_OUTPUT,
  JSON.stringify({ customTypes: customTypeNames }, null, 2)
);
console.log(
  customTypeNames.length > 0
    ? `Custom entity types: ${customTypeNames.join(', ')}`
    : 'No custom entity types declared.'
);

// Build the entity index: one list per project, by slug (D-159) — an
// entity belongs to exactly one project, and `[[slug]]` on a project's pages
// only finds that project's entities. Every project's folders are checked
// for every type: an entity whose project doesn't declare its type still
// gets a page (customTypeDeclaration).
const allEntityTypes = [
  ...builtinEntityTypes,
  ...customTypeNames.map(name => ({ folder: name, type: name, urlPrefix: name })),
];
const index = {};

for (const project of projectSlugs()) {
  for (const { folder, type, urlPrefix } of allEntityTypes) {
    const folderPath = join(projectDir(project), folder);

    let slugs;
    try {
      slugs = await readdir(folderPath);
    } catch {
      if (customTypesByProject[project].includes(folder)) {
        console.warn(`[Keely] No folder at ${project}/${folder} — skipping. Create it or remove the declaration.`);
      }
      continue;
    }

    for (const slug of slugs) {
      const filePath = join(folderPath, slug, 'index.md');
      // Parsed front matter, so quoted values ("Angie") come out as written —
      // short names are matched against prose (D-160).
      let data;
      try {
        data = matter(await readFile(filePath, 'utf-8')).data;
      } catch {
        continue; // not an entity folder (no index.md)
      }
      const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : null;
      const shortName = typeof data.short_name === 'string' && data.short_name.trim() ? data.short_name.trim() : null;
      if (name) {
        index[project] ??= {};
        index[project][slug] = { name, short_name: shortName, type, urlPrefix };
      }
      // Alt text checks for built-in types only — custom image fields vary by type
      if (BUILTIN_TYPES.has(folder)) {
        const missingAlts = await getImageFieldsFromFile(filePath);
        for (const field of missingAlts) {
          console.warn(`⚠️  Missing ${field} in ${project}/${folder}/${slug}/index.md`);
        }
      }
    }
  }
}

await writeFile(OUTPUT_PATH, JSON.stringify(index, null, 2));
console.log(`Entity index written to ${OUTPUT_PATH}`);