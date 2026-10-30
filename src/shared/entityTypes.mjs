// Entity types and the page folders they own — the one place the generator
// decides which names a custom entity type (D-086) may use — and which
// project an entity belongs to (D-159).
//
// Every entity type gets pages at /<project>/<type>/, beside the site's own
// folders there. A custom type named after one of those would collide with
// it, so those names are reserved. The app's Project Settings refuses them
// using this same list (D-161: shared, one copy).

export const BUILT_IN_ENTITY_TYPES = ['characters', 'places', 'groups'];

export const RESERVED_TYPE_NAMES = new Set([...BUILT_IN_ENTITY_TYPES, 'stories', 'tags', 'wiki']);

// A project's own custom types, in the order project.toml declares them.
export function customTypesOf(projectConfig) {
  return (projectConfig.entity_types ?? []).filter((t) => t.name && !RESERVED_TYPE_NAMES.has(t.name));
}

// A custom type's declaration: the given project's own if it declares the
// type, else the first project that does (an entity whose own project
// doesn't declare its type still gets a page, with the declared fields of
// the project that does).
export function customTypeDeclaration(typeName, projectConfig, allProjectConfigs) {
  return (
    customTypesOf(projectConfig).find((t) => t.name === typeName) ??
    allProjectConfigs.flatMap(customTypesOf).find((t) => t.name === typeName) ??
    null
  );
}

// The one project an entity belongs to (D-159): the first in its `project`
// list. The list form stays for file-format compatibility; more than one
// entry gets a build note from `npm run index`, and only the first counts.
export function entityProject(projectField) {
  const first = Array.isArray(projectField) ? projectField[0] : projectField;
  return typeof first === 'string' && first.trim() ? first.trim() : null;
}
