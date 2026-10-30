// Reading a content collection entry's id. Slugs are only unique within a
// project (D-166), so ids carry it: `{project}/{slug}` for an entity,
// `{project}/{story}/scenes/...` for a scene.
export const entryProject = (entry) => entry.id.slice(0, entry.id.indexOf('/'));
export const entrySlug = (entry) => entry.id.slice(entry.id.indexOf('/') + 1);
export const entriesIn = (entries, project) => entries.filter((entry) => entryProject(entry) === project);
