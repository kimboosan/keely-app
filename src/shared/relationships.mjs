// The relationship rules (D-176): what in a project points at what, for the
// reader site's entity pages and the app's Entity Hub. One copy, pure: it
// takes a project's scenes and entities as already-read data and returns
// every computed list. The generator reads the files with Node and the app
// reads them through Rust; neither keeps rules of its own.
//
//   computeRelationships({ scenes, entities, ...options })
//     scenes    [{ storySlug, slug, path, data, body }] in reading order:
//               slug is the scene's folder name, path its place inside the
//               story's scenes folder, data its frontmatter, body its text
//     stories   [{ slug, data, containers: [{ path, data }] }] in the
//               project's order: each story's story.toml and its arcs' and
//               chapters' _meta.toml (path as for scenes), for `featuring`
//     entities  [{ type, slug, data, body }]: every entity, any type
//     includeDrafts   count unpublished scenes (the app; the site doesn't)
//     autoLink        the project's `auto_link` (D-160): short names in
//                     scene text count as links
//     onClash(shortName, slugs)   a short name two entities share
//
// Returns lists keyed by entity slug (a slug means something only inside
// its own project, D-166):
//   appearsIn      scenes whose cast lists it, or whose POV it is
//   atLocation     scenes set there: scene_location or also_at
//   mentionedIn    scenes whose text links it
//   mentionedBy    entities whose description links it: { type, slug, name }
//   groupMembers   characters listing the group in `groups`: { slug, name }
//   groupRelations each group's opposed_to / allied_with, either side's
//                  declaration showing on both
//   featuredIn     by type, then slug (D-172): the stories whose story,
//                  arcs or chapters, or scenes list it in `featuring`, as
//                  [{ storySlug, title, story, containers: [{ path, label }],
//                  scenes }] in story order. An arc or chapter counts only
//                  while it holds a counted scene, as its page needs one.
// A scene is { storySlug, slug, path, title }.
import { autoLinkShortNames } from './wikiLinks.mjs';
import { isPublished } from './published.mjs';
import { containerLabel, sceneTitle } from './names.mjs';

// A field's slugs, whether written as one value or a list.
const slugsIn = (value) =>
  (Array.isArray(value) ? value : value == null ? [] : [value])
    .filter((v) => typeof v === 'string' && v.trim())
    .map((v) => v.trim());

// `featuring` (D-172): slugs grouped by type, `{ relationships: [...] }`.
const featuredPairs = (featuring) =>
  featuring && typeof featuring === 'object' && !Array.isArray(featuring)
    ? Object.entries(featuring).flatMap(([type, slugs]) => slugsIn(slugs).map((slug) => [type, slug]))
    : [];

const LINK = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
const linkedSlugs = (text) => [...new Set([...(text ?? '').matchAll(LINK)].map((m) => m[1].trim()))];

export function computeRelationships({ scenes = [], stories = [], entities = [], includeDrafts = false, autoLink = false, onClash } = {}) {
  const appearsIn = {};
  const atLocation = {};
  const mentionedIn = {};
  const mentionedBy = {};
  const groupMembers = {};
  const groupRelations = {};
  const add = (map, key, item) => (map[key] ??= []).push(item);

  // Featured In, gathered per story, then put in story order at the end.
  const storyOrder = new Map(stories.map((story, i) => [story.slug, i]));
  const storyTitle = new Map(stories.map((story) => [story.slug, story.data?.title || story.slug]));
  const featured = {};
  const featuredEntry = (type, slug, storySlug) =>
    (((featured[type] ??= {})[slug] ??= {})[storySlug] ??= {
      storySlug,
      title: storyTitle.get(storySlug) ?? storySlug,
      story: false,
      containers: [],
      scenes: [],
    });
  const countedPaths = {}; // story → paths of the scenes counted

  // The short names that link themselves, from every entity of every type.
  const shortNames = {};
  if (autoLink) for (const e of entities) shortNames[e.slug] = { name: e.data?.name, short_name: e.data?.short_name };

  for (const scene of scenes) {
    const data = scene.data ?? {};
    if (!includeDrafts && !isPublished(data)) continue;
    const ref = { storySlug: scene.storySlug, slug: scene.slug, path: scene.path ?? scene.slug, title: sceneTitle(data.title, scene.slug) };

    // A POV character appears in their scene even if the cast leaves them
    // out (D-176); also_at counts as being there (format spec).
    for (const slug of new Set([...slugsIn(data.characters_in_scene), ...slugsIn(data.pov_character)])) add(appearsIn, slug, ref);
    for (const slug of new Set([...slugsIn(data.scene_location), ...slugsIn(data.also_at)])) add(atLocation, slug, ref);

    const text = autoLink ? autoLinkShortNames(scene.body ?? '', shortNames, { onClash }) : scene.body;
    for (const slug of linkedSlugs(text)) add(mentionedIn, slug, ref);

    for (const [type, slug] of featuredPairs(data.featuring)) featuredEntry(type, slug, scene.storySlug).scenes.push(ref);
    add(countedPaths, scene.storySlug, ref.path);
  }

  for (const story of stories) {
    for (const [type, slug] of featuredPairs(story.data?.featuring)) featuredEntry(type, slug, story.slug).story = true;
    const paths = countedPaths[story.slug] ?? [];
    for (const container of story.containers ?? []) {
      if (!paths.some((p) => p.startsWith(`${container.path}/`))) continue;
      // `number` and `format` come from nameStory (D-180, D-181); without
      // them the label uses the folder's own number.
      const label = containerLabel(container.path.split('/').pop(), container.data?.title || undefined, container.number ?? undefined, { format: container.format });
      for (const [type, slug] of featuredPairs(container.data?.featuring)) {
        featuredEntry(type, slug, story.slug).containers.push({ path: container.path, slug: container.slug, label });
      }
    }
  }
  const featuredIn = {};
  for (const [type, bySlug] of Object.entries(featured)) {
    featuredIn[type] = {};
    for (const [slug, byStory] of Object.entries(bySlug)) {
      featuredIn[type][slug] = Object.values(byStory).sort(
        (a, b) => (storyOrder.get(a.storySlug) ?? Infinity) - (storyOrder.get(b.storySlug) ?? Infinity),
      );
    }
  }

  for (const e of entities) {
    const data = e.data ?? {};
    // Entity descriptions don't auto-link short names (D-160 is scene text).
    for (const slug of linkedSlugs(e.body)) {
      if (slug !== e.slug) add(mentionedBy, slug, { type: e.type, slug: e.slug, name: data.name || e.slug });
    }
    if (e.type === 'characters') {
      for (const group of new Set(slugsIn(data.groups))) add(groupMembers, group, { slug: e.slug, name: data.name || e.slug });
    }
  }

  const relations = (group) => (groupRelations[group] ??= { opposed_to: [], allied_with: [] });
  const once = (list, slug) => list.includes(slug) || list.push(slug);
  for (const g of entities.filter((e) => e.type === 'groups')) {
    for (const other of slugsIn(g.data?.opposed_to)) {
      once(relations(g.slug).opposed_to, other);
      once(relations(other).opposed_to, g.slug);
    }
    for (const other of slugsIn(g.data?.allied_with)) {
      once(relations(g.slug).allied_with, other);
      once(relations(other).allied_with, g.slug);
    }
  }

  return { appearsIn, atLocation, mentionedIn, mentionedBy, groupMembers, groupRelations, featuredIn };
}

// One entity's lists, as an entity page or the Entity Hub shows them:
// Mentioned In leaves out scenes already listed as Appears In or Scenes at
// This Location, and an entity's own description never counts.
export function entityLists(relationships, type, slug) {
  const appearsIn = type === 'characters' ? relationships.appearsIn[slug] ?? [] : [];
  const atLocation = type === 'places' ? relationships.atLocation[slug] ?? [] : [];
  const listed = new Set([...appearsIn, ...atLocation].map((s) => `${s.storySlug}/${s.slug}`));
  return {
    appearsIn,
    atLocation,
    mentionedIn: (relationships.mentionedIn[slug] ?? []).filter((s) => !listed.has(`${s.storySlug}/${s.slug}`)),
    mentionedBy: (relationships.mentionedBy[slug] ?? []).filter((e) => !(e.type === type && e.slug === slug)),
    members: type === 'groups' ? relationships.groupMembers[slug] ?? [] : [],
    opposedTo: type === 'groups' ? relationships.groupRelations[slug]?.opposed_to ?? [] : [],
    alliedWith: type === 'groups' ? relationships.groupRelations[slug]?.allied_with ?? [] : [],
    featuredIn: relationships.featuredIn?.[type]?.[slug] ?? [],
  };
}
