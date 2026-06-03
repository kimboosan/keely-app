import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { readFileSync, existsSync } from 'fs';

// ─── Custom entity type registration ──────────────────────────────────────────
//
// Custom entity types are declared by the author in project.toml.
// build-entity-index.mjs reads all project.toml files and writes the list of
// custom type names to src/data/custom-entity-types.json before each Astro
// build. This file reads that JSON and registers one content collection per
// custom type automatically — no code changes required when adding a new type.
//
// If the JSON doesn't exist yet, run `npm run index` to generate it.

const CUSTOM_TYPES_PATH = './src/data/custom-entity-types.json';

let customTypeNames: string[] = [];
try {
  const raw = readFileSync(CUSTOM_TYPES_PATH, 'utf-8');
  const data = JSON.parse(raw);
  customTypeNames = Array.isArray(data.customTypes) ? data.customTypes : [];
} catch {
  // JSON not yet generated — no custom types registered this build.
}

// Universal fields present on every custom entity type.
// .passthrough() preserves all author-declared custom fields in entry.data.
const customEntitySchema = z.object({
  name: z.string(),
  type: z.string(),
  project: z.array(z.string()),
  subtype: z.string().optional(),
  short_name: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
}).passthrough();

const customCollections = Object.fromEntries(
  customTypeNames
    .filter(typeName => {
      const base = `./src/content/${typeName}`;
      if (!existsSync(base)) {
        console.warn(
          `[Keely] Custom entity type "${typeName}" is declared in project.toml ` +
          `but src/content/${typeName}/ does not exist. ` +
          `Create the folder or remove the declaration.`
        );
        return false;
      }
      return true;
    })
    .map(typeName => [
      typeName,
      defineCollection({
        loader: glob({ pattern: '**/index.md', base: `./src/content/${typeName}` }),
        schema: customEntitySchema,
      }),
    ])
);

// ─── Built-in collections ─────────────────────────────────────────────────────

const charactersCollection = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/characters' }),
  schema: z.object({
    // Identity
    name: z.string(),
    title: z.string().optional(),
    short_name: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    type: z.literal('character'),
    subtype: z.string().optional(),

    // Project membership (D-080)
    project: z.array(z.string()),

    // Role and function
    role: z.enum(['main', 'secondary', 'minor', 'background']).optional(),
    function: z.string().optional(),

    // Descriptive
    age: z.union([z.number(), z.string()]).optional(),
    occupation: z.string().optional(),
    appearance: z.string().optional(),

    // Images
    portrait: z.string().optional(),
    portrait_alt: z.string().optional(),
    gallery: z.array(z.object({
      file: z.string(),
      caption: z.string().optional(),
      alt: z.string(),
    })).optional(),

    // Relationships
    group: z.array(z.string()).optional(),
    related_to: z.array(z.object({
      entity: z.string(),
      relationship: z.string(),
    })).optional(),

    // Tags
    tags: z.array(z.string()).optional(),
  }),
});

const placesCollection = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/places' }),
  schema: z.object({
    // Identity
    name: z.string(),
    short_name: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    type: z.literal('place'),
    subtype: z.string().optional(),
    function: z.string().optional(),

    // Project membership (D-080)
    project: z.array(z.string()),

    // Place-specific
    scope: z.enum(['primary', 'secondary', 'minor', 'background']).optional(),
    size: z.enum(['small', 'medium', 'large', 'vast']).optional(),
    status: z.string().optional(),
    location: z.string().optional(),
    operator: z.string().optional(),
    parent_place: z.string().optional(),
    contains: z.array(z.string()).optional(),

    // Images
    image: z.string().optional(),
    image_alt: z.string().optional(),
    gallery: z.array(z.object({
      file: z.string(),
      caption: z.string().optional(),
      alt: z.string(),
    })).optional(),

    // Tags
    tags: z.array(z.string()).optional(),
  }),
});

const groupsCollection = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/groups' }),
  schema: z.object({
    // Identity
    name: z.string(),
    full_name: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    type: z.literal('group'),
    subtype: z.string().optional(),
    function: z.string().optional(),

    // Project membership (D-080)
    project: z.array(z.string()),

    // Group-specific
    scope: z.enum(['minor', 'major', 'dominant']).optional(),
    status: z.string().optional(),
    headquarters: z.string().optional(),
    founded: z.union([z.string(), z.number()]).optional(),
    leader: z.string().optional(),
    opposed_to: z.array(z.string()).optional(),
    allied_with: z.array(z.string()).optional(),

    // Images
    image: z.string().optional(),
    image_alt: z.string().optional(),
    gallery: z.array(z.object({
      file: z.string(),
      caption: z.string().optional(),
      alt: z.string(),
    })).optional(),

    // Tags
    tags: z.array(z.string()).optional(),
  }),
});

const scenesCollection = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/stories' }),
  schema: z.object({
    // Identity & workflow
    title: z.string().optional(),
    type: z.literal('scene'),
    status: z.enum(['drafting', 'revising', 'in-beta', 'finalized', 'published']),

    // Dates & word count
    first_published_date: z.coerce.date().optional(),
    last_published_date: z.coerce.date().optional(),
    word_count: z.number().optional(),

    // Reader-facing
    summary: z.string().optional(),
    content_warnings: z.object({
      additional: z.array(z.string()).optional(),
      custom: z.array(z.string()).optional(),
    }).optional(),
    authors_notes: z.object({
      top: z.string().optional(),
      bottom: z.string().optional(),
    }).optional(),

    // Narrative metadata
narrative_mode: z.enum(['first-person', 'third-limited', 'third-omniscient', 'third-objective', 'second-person', 'epistolary', 'unreliable']),    pov_character: z.string().optional(),
    characters_in_scene: z.array(z.string()).optional(),
    scene_location: z.string().optional(),
    also_at: z.array(z.string()).optional(),

    // Discoverability
    threads: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),

    // CYOA hooks (Phase 1: present, ignored)
    choice_point: z.boolean().optional(),
    next_scene_branches: z.array(z.object({
      label: z.string(),
      scene: z.string(),
    })).optional(),
  }),
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const collections = {
  characters: charactersCollection,
  places: placesCollection,
  groups: groupsCollection,
  scenes: scenesCollection,
  ...customCollections,
};