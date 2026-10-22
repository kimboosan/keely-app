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
import { containerLabel, humanize } from './names.mjs';

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

// { tree, fingerprint, legacy }
//   tree: [{ kind: 'scene', id, name, title, status }
//         | { kind: 'arc' | 'chapter', id, name, title, label, legacy, children }]
//   legacy: true when any arc or chapter still has a pre-D-158 name — the
//           app then offers the format update before any structural change.
export async function readOutline(scenesRoot) {
  const story = await readStory(scenesRoot);
  let legacy = false;

  async function decorate(nodes) {
    return Promise.all(
      nodes.map(async (node) => {
        if (node.kind === 'scene') {
          let data = {};
          try {
            data = matter(story.contents.get(node.id) ?? '').data ?? {};
          } catch {
            // Unreadable front matter: fall back to the folder name.
          }
          return {
            kind: 'scene',
            id: node.id,
            name: node.name,
            title: nonEmpty(data.title) ?? humanize(node.bare),
            status: nonEmpty(data.status) ?? 'drafting',
          };
        }
        let metaTitle = null;
        try {
          metaTitle = nonEmpty(parseToml(await readFile(join(scenesRoot, node.id, '_meta.toml'), 'utf-8')).title);
        } catch {
          // No _meta.toml (or unreadable): the folder name gives the title.
        }
        if (node.legacy) legacy = true;
        return {
          kind: node.kind,
          id: node.id,
          name: node.name,
          title: metaTitle ?? humanize(node.bare),
          label: containerLabel(node.name, metaTitle ?? undefined),
          legacy: Boolean(node.legacy),
          children: await decorate(node.children),
        };
      })
    );
  }

  const tree = await decorate(story.tree);
  return { tree, fingerprint: story.fingerprint, legacy };
}
