import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// A scratch vault with one broken file of each kind, and good ones beside
// them. vault.mjs reads KEELY_VAULT when it loads, so it's set first.
const vault = mkdtempSync(join(tmpdir(), 'keely-unreadable-'));
const write = (path, text) => {
  const full = join(vault, 'src', path);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, text);
};
write('data/publisher.toml', 'title = "Fine"\n');
write('data/authors.toml', '[[authors]\nname = "x"\n');
write('content/projects/feuds/project.toml', 'title = "Feuds"\n');
write('content/projects/feuds/characters/li/index.md', '---\nname: Li\n---\n');
write('content/projects/feuds/characters/cookie/index.md', '---\nname: "Cookie\n---\n');
write('content/projects/feuds/stories/ff/story.toml', 'title = "Family Feud"\n');
write('content/projects/feuds/stories/ff/scenes/01_arc-01-start/_meta.toml', 'title = "Start\n');
write('content/projects/feuds/stories/ff/scenes/01_arc-01-start/01-the-order/index.md', '---\ntitle: "The Order\n---\nText\n');
write('content/projects/feuds/stories/ff/scenes/01_arc-01-start/02-fine/index.md', '---\ntitle: Fine\n---\nText\n');
write('content/projects/broken/project.toml', 'title = \n');
process.env.KEELY_VAULT = vault;
const { findUnreadable } = await import('./unreadable.mjs');

test('every unreadable file is listed, each said plainly, and nothing that reads', () => {
  const found = findUnreadable();
  const whats = found.map((f) => f.what).sort();
  assert.deepEqual(whats, [
    'A project’s settings: broken/project.toml',
    'A scene in Family Feud: 01-the-order',
    'An arc or chapter’s settings in Family Feud: 01_arc-01-start/_meta.toml',
    'An entry in characters: cookie',
    'Your list of authors: authors.toml',
  ]);
  const scene = found.find((f) => f.what.startsWith('A scene'));
  assert.equal(scene.file, 'content/projects/feuds/stories/ff/scenes/01_arc-01-start/01-the-order/index.md');
});
