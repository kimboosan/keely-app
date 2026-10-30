import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import {
  applyLayoutMigration,
  needsLayoutMigration,
  planLayoutMigration,
  removeFrontmatterField,
  removeTomlKey,
} from './layout.mjs';

function put(vault, path, contents) {
  mkdirSync(dirname(join(vault, path)), { recursive: true });
  writeFileSync(join(vault, path), contents);
}

const ENTITY = '---\nname: Astra\ntype: character\nproject:\n  - tale\n# a comment\nsubtype: human\n---\nBio with\n\n  odd spacing\n';

function oldVault() {
  const vault = mkdtempSync(join(tmpdir(), 'keely-layout-'));
  put(vault, 'src/data/publisher.toml', 'name = "Me"\n');
  put(vault, 'src/data/projects/tale/project.toml', 'title = "Tale"\n');
  put(vault, 'src/data/projects/tale/cover.jpg', 'image');
  put(vault, 'src/data/projects/tale/stories/first/story.toml', 'title = "First"\nslug = "first"\n\n# Genre\ngenre = "Fantasy"\n');
  put(vault, 'src/data/projects/tale/stories/first/banner.jpg', 'image');
  put(vault, 'src/content/stories/first/scenes/01-a/index.md', '---\ntitle: A\n---\nScene\n');
  put(vault, 'src/content/stories/first/scenes/01-a/map.png', 'image');
  put(vault, 'src/content/characters/astra/index.md', ENTITY);
  put(vault, 'src/content/characters/astra/portrait.png', 'image');
  return vault;
}

const read = (vault, path) => readFileSync(join(vault, path), 'utf-8');
const exists = (vault, path) => existsSync(join(vault, path));

test('moves everything a project owns into one folder', () => {
  const vault = oldVault();
  applyLayoutMigration(vault);

  const project = 'src/content/projects/tale';
  assert.equal(read(vault, `${project}/project.toml`), 'title = "Tale"\n');
  assert.ok(exists(vault, `${project}/cover.jpg`));
  assert.ok(exists(vault, `${project}/stories/first/banner.jpg`));
  assert.ok(exists(vault, `${project}/stories/first/scenes/01-a/map.png`));
  assert.ok(exists(vault, `${project}/characters/astra/portrait.png`));
  assert.ok(exists(vault, 'src/data/publisher.toml'), 'site-wide files stay');
  assert.ok(!exists(vault, 'src/data/projects'));
  assert.ok(!exists(vault, 'src/content/stories'));
  assert.ok(!exists(vault, 'src/content/characters'));
  assert.ok(!needsLayoutMigration(vault));
});

test('removes only the retired fields, and changes nothing else in the file', () => {
  const vault = oldVault();
  applyLayoutMigration(vault);

  assert.equal(
    read(vault, 'src/content/projects/tale/characters/astra/index.md'),
    '---\nname: Astra\ntype: character\n# a comment\nsubtype: human\n---\nBio with\n\n  odd spacing\n',
  );
  assert.equal(
    read(vault, 'src/content/projects/tale/stories/first/story.toml'),
    'title = "First"\n\n# Genre\ngenre = "Fantasy"\n',
  );
});

test('keeps a copy of the old folders', () => {
  const vault = oldVault();
  const { backup } = applyLayoutMigration(vault);

  assert.equal(read(vault, `${backup}/content/characters/astra/index.md`), ENTITY);
  assert.ok(exists(vault, `${backup}/data/projects/tale/project.toml`));
});

test('scenes follow the story.toml slug when it differs from the folder', () => {
  const vault = oldVault();
  put(vault, 'src/data/projects/tale/stories/second/story.toml', 'title = "Second"\nslug = "other-name"\n');
  put(vault, 'src/content/stories/other-name/scenes/01-b/index.md', 'Scene');

  applyLayoutMigration(vault);

  assert.ok(exists(vault, 'src/content/projects/tale/stories/second/scenes/01-b/index.md'));
});

test('a story with no scenes folder yet is fine', () => {
  const vault = oldVault();
  put(vault, 'src/data/projects/tale/stories/empty/story.toml', 'title = "Empty"\n');

  applyLayoutMigration(vault);

  assert.ok(exists(vault, 'src/content/projects/tale/stories/empty/story.toml'));
});

test('history follows, with the project in its path', () => {
  const vault = oldVault();
  put(vault, 'Keely History/recovery/first/01-a.md', 'unsaved');
  put(vault, 'Keely History/versions/stories/first/01-a/2026-01-01_00-00-00.md', 'older');
  put(vault, 'Keely History/versions/characters/astra/2026-01-01_00-00-00.md', 'older bio');

  applyLayoutMigration(vault);

  assert.ok(exists(vault, 'Keely History/recovery/tale/first/01-a.md'));
  assert.ok(exists(vault, 'Keely History/versions/tale/stories/first/01-a/2026-01-01_00-00-00.md'));
  assert.ok(exists(vault, 'Keely History/versions/tale/characters/astra/2026-01-01_00-00-00.md'));
  assert.ok(!exists(vault, 'Keely History/versions/stories'));
  assert.ok(!exists(vault, 'Keely History/versions/characters'));
});

test('an entity listing two projects goes to the first, with a note', () => {
  const vault = oldVault();
  put(vault, 'src/data/projects/other/project.toml', 'title = "Other"\n');
  put(vault, 'src/content/places/moon/index.md', '---\nname: Moon\nproject: [other, tale]\n---\n');

  const plan = planLayoutMigration(vault);
  assert.equal(plan.problems.length, 0);
  assert.equal(plan.notes.length, 1);
  applyLayoutMigration(vault, plan);

  assert.equal(read(vault, 'src/content/projects/other/places/moon/index.md'), '---\nname: Moon\n---\n');
});

for (const [name, setUp, expected] of [
  ['scenes with no story', (v) => put(v, 'src/content/stories/lost/scenes/01-x/index.md', 'x'), /doesn't belong/],
  ['an entity with no project', (v) => put(v, 'src/content/places/moon/index.md', '---\nname: Moon\n---\n'), /which project/],
  ['an entity in an unknown project', (v) => put(v, 'src/content/places/moon/index.md', '---\nname: Moon\nproject: [nope]\n---\n'), /isn't a project/],
  ['deleted items', (v) => put(v, 'Keely History/deleted/item/deleted.toml', 'x'), /Deleted items/],
  ['an earlier safety copy', (v) => put(v, 'Keely History/before-layout-update/x', 'x'), /already exists/],
]) {
  test(`stops for ${name}, and changes nothing`, () => {
    const vault = oldVault();
    setUp(vault);

    const plan = planLayoutMigration(vault);

    assert.match(plan.problems.join('\n'), expected);
    assert.throws(() => applyLayoutMigration(vault, plan));
    assert.ok(exists(vault, 'src/data/projects/tale/project.toml'));
    assert.ok(exists(vault, 'src/content/characters/astra/index.md'));
  });
}

function snapshot(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${prefix}${entry.name}`;
    return entry.isDirectory()
      ? snapshot(join(dir, entry.name), `${path}/`)
      : [`${path}=${readFileSync(join(dir, entry.name), 'utf-8')}`];
  }).sort();
}

test('a failure at any step puts everything back exactly', () => {
  const steps = (() => {
    const vault = oldVault();
    const plan = planLayoutMigration(vault);
    return plan.moves.length + plan.edits.length;
  })();
  assert.ok(steps > 3);

  for (let failAfterSteps = 0; failAfterSteps < steps; failAfterSteps += 1) {
    const vault = oldVault();
    const before = snapshot(vault);

    assert.throws(() => applyLayoutMigration(vault, undefined, { failAfterSteps }), /Forced failure/);

    assert.deepEqual(snapshot(vault), before, `failing after step ${failAfterSteps}`);
    assert.ok(!exists(vault, 'src/content/projects'));
    assert.ok(!exists(vault, 'Keely History/before-layout-update'));
  }
});

test('removeFrontmatterField handles each way of writing a list', () => {
  const remove = (text) => removeFrontmatterField(text, 'project');
  assert.equal(remove('---\nproject: tale\nname: A\n---\nx'), '---\nname: A\n---\nx');
  assert.equal(remove('---\nproject: [tale]\nname: A\n---\nx'), '---\nname: A\n---\nx');
  assert.equal(remove('---\nproject:\n- tale\nname: A\n---\nx'), '---\nname: A\n---\nx');
  assert.equal(remove('---\nname: A\nproject:\n  - tale\n---\nx'), '---\nname: A\n---\nx');
  assert.equal(remove('---\nname: A\n---\nproject: not frontmatter\n'), '---\nname: A\n---\nproject: not frontmatter\n');
});

test('removeTomlKey leaves other keys and sections alone', () => {
  assert.equal(removeTomlKey('title = "A"\nslug = "a"\n[x]\nslugs = 1\n', 'slug'), 'title = "A"\n[x]\nslugs = 1\n');
  assert.equal(removeTomlKey('title = "A"\n', 'slug'), 'title = "A"\n');
});
