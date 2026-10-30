// A project's entity types and their entries, for the pages that list across
// types (wiki index, tags) — so built-in and custom types (D-086) are
// listed the same way, in one place.
import { getCollection } from 'astro:content';
import { getProjectConfig } from './config.js';
import { BUILT_IN_ENTITY_TYPES, customTypesOf } from '../shared/entityTypes.mjs';
import { entriesIn } from './entries.mjs';

const BUILT_IN_PLURALS = { characters: 'Characters', places: 'Places', groups: 'Groups' };

// A collection's entries, or none if it doesn't exist — a custom type
// declared in project.toml whose folder hasn't been created yet.
export async function entriesOf(typeName) {
  try {
    return (await getCollection(typeName)) ?? [];
  } catch {
    return [];
  }
}

// [{ name, plural, entries }] — built-in types first, then the project's own
// custom types in the order project.toml declares them; entries are the
// project's own (D-159).
export async function projectEntityTypes(projectSlug) {
  const config = getProjectConfig(projectSlug);
  const types = [
    ...BUILT_IN_ENTITY_TYPES.map((name) => ({ name, plural: BUILT_IN_PLURALS[name] })),
    ...customTypesOf(config).map((t) => ({ name: t.name, plural: t.plural || t.name })),
  ];
  return Promise.all(
    types.map(async (t) => ({
      ...t,
      entries: entriesIn(await entriesOf(t.name), projectSlug),
    })),
  );
}
