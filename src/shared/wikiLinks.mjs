// Turns Keely's [[…]] syntax into HTML links — the one set of link rules,
// shared by scene pages and entity pages (format spec §wiki-links).
//
//   [[slug]] / [[slug|text]]        an entity (character, place, group, custom type)
//   [[project/slug]]                an entity in another project (D-164)
//   [[scene-slug]]                  another scene in the same story (scene pages only)
//   [[image:file.png|alt]]          an image in the scene's folder (scene pages only)
//   anything else                   a "not yet" link (D-156)
//
// Scene links and inline images need a story and a scene folder, which only
// scene pages have; elsewhere those options are simply left out. Scene slugs
// are only unique within a story, so an entity page can't link to a scene.

// `entityIndex` is the page's own project's entities (projectIndex.mjs's
// readEntityIndex, D-159), so a plain [[slug]] never reaches another project.
// Only [[project/slug]] does (D-164), through `otherProject(projectSlug)`,
// which gives that project's { title, entityIndex }, or null if there's no
// such project; without it, such links are "not yet" links.
// `scenes` ({ id, title }[]) and `storySlug` enable scene links; `imageBase`
// (the URL folder of the scene's copied images) enables inline images.
export function resolveWikiLinks(text, { project, entityIndex, otherProject = null, scenes = null, storySlug = null, imageBase = null }) {
  let out = text ?? '';
  if (imageBase) {
    out = out.replace(/\[\[image:([^\]|]+)\|?([^\]]*)\]\]/g, (match, filename, alt) => {
      const src = `${imageBase}/${filename.trim()}`;
      const altText = alt.trim() || filename.trim();
      return `<img src="${src}" alt="${altText}" class="scene-inline-image" loading="lazy">`;
    });
  }
  return out.replace(/\[\[([^\]]+)\]\]/g, (match, inner) => {
    const [target, alias] = inner.split('|').map(s => s.trim());
    // Folder names can't contain "/", so a slash always names a project.
    const slash = target.indexOf('/');
    if (slash !== -1) {
      const linkProject = target.slice(0, slash).trim();
      const slug = target.slice(slash + 1).trim();
      const other = linkProject === project ? { entityIndex } : otherProject?.(linkProject);
      const entity = other?.entityIndex[slug];
      if (!entity) {
        return `<a class="unresolved" data-entity="${target}" title="No page yet">${alias ?? slug}</a>`;
      }
      // reader.js shows "From …" above the page in the wiki pane.
      const from = other.title ? ` data-project-name="${other.title.replace(/"/g, '&quot;')}"` : '';
      return `<a href="/${linkProject}/${entity.urlPrefix}/${slug}" class="wiki-link" data-entity="${slug}"${from}>${alias ?? entity.short_name ?? entity.name}</a>`;
    }
    const slug = target;
    const entity = entityIndex[slug];
    // A link to another scene in this story (D-135 offers them in the
    // app's autocomplete). Its own class, not `wiki-link`: reader.js opens
    // wiki-links in the wiki pane, while scene links navigate the prose pane.
    const linkedScene = entity || !scenes ? null : scenes.find(s => s.id === slug);
    if (linkedScene) {
      const href = `/${project}/stories/${storySlug}/scenes/${slug}`;
      return `<a href="${href}" class="scene-link" data-scene="${slug}">${alias ?? linkedScene.title}</a>`;
    }
    const displayName = alias ?? (entity ? (entity.short_name ?? entity.name) : slug);
    // A link to something not created yet is a "not yet" link (D-156): no
    // destination, so readers never reach a missing page, and not a
    // `wiki-link`, so reader.js doesn't try to open it in the wiki pane.
    // reader.css styles it as faded and dashed; the app's preview still gets
    // its slug from data-entity (D-154).
    if (!entity) {
      return `<a class="unresolved" data-entity="${slug}" title="No page yet">${displayName}</a>`;
    }
    return `<a href="/${project}/${entity.urlPrefix}/${slug}" class="wiki-link" data-entity="${slug}">${displayName}</a>`;
  });
}

// ─── Finding names in prose (D-160) ──────────────────────────────────────
// Shared by layer 1 (short names link themselves, on the reader site) and
// layer 2 (aliases suggested in the app's editor), so both read prose the
// same way.

// A whole-word, capitals-exact search for `words`: "Sue" finds "Sue" and
// "Sue's", never "sue" or "Suez".
function wholeWordRe(words) {
  return new RegExp(`(?<![\\p{L}\\p{N}_])${words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`, 'gu');
}

// Where a name never counts as a mention: inside an existing link, a
// markdown link or image, code, or HTML.
const PROTECTED = /```[\s\S]*?```|`[^`\n]*`|\[\[[^\]]*\]\]|!?\[[^\]\n]*\]\([^)\n]*\)|<[^>\n]+>/g;
function protectedSpans(source) {
  return [...source.matchAll(PROTECTED)].map((m) => [m.index, m.index + m[0].length]);
}

// A test for "this stretch overlaps a longer one of these names", e.g.
// "the Station" in "the Station Rats", "Cap" in "Old Cap".
function overlapsLongerOf(source, names) {
  const spans = [...new Set(names)]
    .filter(Boolean)
    .flatMap((n) => [...source.matchAll(wholeWordRe(n))].map((m) => [m.index, m.index + m[0].length]));
  return (start, end) => spans.some(([a, b]) => start < b && end > a && b - a > end - start);
}

const overlapsAny = (spans, start, end) => spans.some(([a, b]) => start < b && end > a);

// D-160, layer 1: when a project turns on `auto_link`, the first mention in
// a scene of each entity's `short_name` becomes an ordinary
// `[[slug|as written]]` link, which resolveWikiLinks then handles like any
// other. Only short names: `name` and `aliases` never link themselves.
//
// - Whole words, matching capitals ("Sue" links; "sue" and "Suez" don't).
// - Never inside existing links, markdown links or images, code, or HTML.
// - An entity the scene already links with [[…]] has had its first mention.
// - A short name two entities share links neither; `onClash(shortName,
//   slugs)` is told, so the index step can note it once per build.
// - Where short names overlap ("Sue" within another's "Sue Rufus"), the
//   longer is placed first.
// - Never where it overlaps a longer name or short name of any of the
//   project's entities: "the Station" doesn't link in "the Station Rats"
//   (part of "Station Rats"), and "Peter" doesn't in "Peter McDonnell".
export function autoLinkShortNames(text, entityIndex, { onClash } = {}) {
  const source = text ?? '';
  const byShortName = new Map();
  for (const [slug, entity] of Object.entries(entityIndex)) {
    if (!entity.short_name) continue;
    if (!byShortName.has(entity.short_name)) byShortName.set(entity.short_name, []);
    byShortName.get(entity.short_name).push(slug);
  }

  const alreadyLinked = new Set([...source.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1].trim()));
  const taken = protectedSpans(source);
  const overlapsLongerName = overlapsLongerOf(
    source,
    Object.values(entityIndex).flatMap((e) => [e.name, e.short_name]),
  );

  const placed = [];
  const longestFirst = [...byShortName].sort(([a], [b]) => b.length - a.length);
  for (const [shortName, slugs] of longestFirst) {
    if (slugs.length > 1) {
      onClash?.(shortName, slugs);
      continue;
    }
    const slug = slugs[0];
    if (alreadyLinked.has(slug)) continue;
    for (const m of source.matchAll(wholeWordRe(shortName))) {
      const start = m.index;
      const end = start + m[0].length;
      if (overlapsAny(taken, start, end) || overlapsLongerName(start, end)) continue;
      placed.push({ start, end, slug, written: m[0] });
      taken.push([start, end]);
      break;
    }
  }

  let out = source;
  for (const p of placed.sort((a, b) => b.start - a.start)) {
    out = `${out.slice(0, p.start)}[[${p.slug}|${p.written}]]${out.slice(p.end)}`;
  }
  return out;
}


// D-160, layer 2: aliases the scene editor offers to link. Aliases are
// never linked automatically: who "Captain" means depends on the scene, so
// the author decides, and the editor only marks where a decision is due.
//
// `targets` are the project's entities: { slug, name, shortName, aliases }.
// `plainNames` is the scene's `plain_names` (aliases the author chose to
// leave as plain text). Returns [{ from, to, alias, slugs }] in text order:
// the first unlinked use of each alias, with every entity that has it.
//
// - Same matching as layer 1: whole words, matching capitals, never inside
//   links, markdown links or images, code or HTML, and never where it
//   overlaps a longer name, short name or alias ("Cap" in "Old Cap").
// - Once the scene links an alias (any `[[…|Captain]]`), or the author left
//   it plain, its later uses aren't marked.
// - An alias that's also the entity's own name or short name isn't offered:
//   it's a name, and layer 1 handles those.
export function findAliasSuggestions(text, targets, { plainNames = [] } = {}) {
  const source = text ?? '';
  const left = new Set(plainNames);
  const linkedAs = new Set([...source.matchAll(/\[\[[^\]|]+\|([^\]]*)\]\]/g)].map((m) => m[1].trim()));

  const byAlias = new Map();
  for (const t of targets) {
    for (const alias of new Set(t.aliases ?? [])) {
      if (typeof alias !== 'string' || !alias.trim()) continue;
      if (alias === t.name || alias === t.shortName) continue;
      if (!byAlias.has(alias)) byAlias.set(alias, []);
      byAlias.get(alias).push(t.slug);
    }
  }

  const taken = protectedSpans(source);
  const overlapsLongerName = overlapsLongerOf(
    source,
    targets.flatMap((t) => [t.name, t.shortName, ...(t.aliases ?? [])]),
  );

  const found = [];
  for (const [alias, slugs] of byAlias) {
    if (left.has(alias) || linkedAs.has(alias)) continue;
    for (const m of source.matchAll(wholeWordRe(alias))) {
      const from = m.index;
      const to = from + m[0].length;
      if (overlapsAny(taken, from, to) || overlapsLongerName(from, to)) continue;
      found.push({ from, to, alias, slugs });
      break;
    }
  }
  return found.sort((a, b) => a.from - b.from);
}
