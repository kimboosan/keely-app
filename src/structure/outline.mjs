// A story's outline for display (D-158 step 2): the structure readStory()
// sees, plus what a person sees — each scene's title and status, each arc's
// and chapter's title and label ("Chapter 02: The Order"). The desktop app
// reads every story tree through this, so story folder names are
// understood in one place (names.mjs) by the app, the site and the engine.

import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { parse as parseToml } from 'smol-toml';
import { readStory } from './read.mjs';
import { containerLabel, humanize, nameStory, sceneTitle } from './names.mjs';

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

// { tree, fingerprint, legacy }
//   tree: [{ kind: 'scene', id, name, address, number, title, status, unreadable? }
//         | { kind: 'arc' | 'chapter' | 'interlude', id, name, title, label, level?, legacy, children }]
//   legacy: true when the story's arcs and chapters still have D-158 or
//           D-180 names — the app then offers the update to D-181's before
//           any structural change. A story of scenes alone never needs it.
//   An interlude's `label` is its title alone, or "Interlude" (D-181);
//   `level` says whether it sits among arcs or among chapters.
export async function readOutline(scenesRoot) {
  const story = await readStory(scenesRoot);
  let legacy = false;

  // Arc and chapter numbers are counted in reading order (D-180), as the
  // site counts them, so the app's labels match the published ones. A
  // scene's `address` is its name (its link target and web address), and
  // `number` its place in the whole story, drafts included — never read
  // from its folder, which numbers only its place in its arc or chapter.
  const scenePaths = [];
  const containerPaths = [];
  (function collect(nodes) {
    for (const node of nodes) {
      if (node.kind === 'scene') scenePaths.push(node.id);
      else {
        containerPaths.push(node.id);
        collect(node.children);
      }
    }
  })(story.tree);
  const names = nameStory(scenePaths, containerPaths);
  const sceneNumbers = new Map(scenePaths.map((id, i) => [id, i + 1]));

  async function decorate(nodes) {
    return Promise.all(
      nodes.map(async (node) => {
        if (node.kind === 'scene') {
          let data = {};
          let unreadable = false;
          try {
            data = matter(story.contents.get(node.id) ?? '').data ?? {};
          } catch {
            // Unreadable front matter: the folder name gives the title, and
            // the scene is marked, not given a status it may not have
            // (Epic 2M). The app says why when it's opened.
            unreadable = true;
          }
          return {
            kind: 'scene',
            id: node.id,
            name: node.name,
            address: names.scenes.get(node.id) ?? node.name,
            number: sceneNumbers.get(node.id),
            title: sceneTitle(data.title, node.name),
            status: nonEmpty(data.status) ?? 'drafting',
            ...(unreadable && { unreadable: true }),
          };
        }
        let metaTitle = null;
        try {
          metaTitle = nonEmpty(parseToml(await readFile(join(scenesRoot, node.id, '_meta.toml'), 'utf-8')).title);
        } catch {
          // No _meta.toml (or unreadable): the folder name gives the title.
        }
        const old = story.format !== 'current';
        if (old) legacy = true;
        return {
          kind: node.kind,
          id: node.id,
          name: node.name,
          title: metaTitle ?? humanize(node.bare),
          label: containerLabel(node.name, metaTitle ?? undefined, names.containers.get(node.id)?.number ?? undefined, { format: names.format }),
          ...(node.kind === 'interlude' && { level: node.level }),
          legacy: old,
          children: await decorate(node.children),
        };
      })
    );
  }

  const tree = await decorate(story.tree);
  return { tree, fingerprint: story.fingerprint, legacy };
}
