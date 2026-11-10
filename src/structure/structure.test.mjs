// Tests for the story restructure engine (D-157, D-180, D-181). Run: npm test
// Each test builds a throwaway vault in the system temp folder.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative } from 'path';
import { readStory } from './read.mjs';
import { planRestructure, rewriteLinks } from './plan.mjs';
import { applyPlan, journalPathFor } from './apply.mjs';
import { readOutline } from './outline.mjs';
import { sceneTitle } from './names.mjs';

// files: { "relative/path/index.md": "text", "relative/path/x.png": "…" }
function makeVault(stories) {
  const root = mkdtempSync(join(tmpdir(), 'keely-structure-'));
  for (const [slug, files] of Object.entries(stories)) {
    for (const [path, text] of Object.entries(files)) {
      const full = join(root, 'stories', slug, 'scenes', path);
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, text);
    }
  }
  return { root, scenes: (slug) => join(root, 'stories', slug, 'scenes'), journalDir: join(root, '.journal') };
}

// Every file under a folder with its contents, for exact before/after checks.
function snapshot(dir) {
  const out = {};
  (function walk(d) {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) {
        out[`${relative(dir, full)}/`] = '';
        walk(full);
      } else out[relative(dir, full)] = readFileSync(full, 'utf-8');
    }
  })(dir);
  return out;
}

const scene = (body = 'Text.') => `---\ntype: scene\n---\n${body}\n`;

function asRequest(tree) {
  return tree.map((n) => (n.children ? { id: n.id, children: asRequest(n.children) } : { id: n.id }));
}

test('tidy closes gaps, and old-style links become names, only within the story', async () => {
  const v = makeVault({
    a: {
      '01-start/index.md': scene('Then [[04-end]] and [[03-middle|the middle]].'),
      '03-middle/index.md': scene(),
      '04-end/index.md': scene('Back to [[01-start]] and [[middle]].'),
    },
    b: { '01-other/index.md': scene('Its own [[03-middle]].'), '03-middle/index.md': scene() },
  });
  const otherBefore = snapshot(v.scenes('b'));
  const story = await readStory(v.scenes('a'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.deepEqual(plan.sceneRenames, { '03-middle': '02-middle', '04-end': '03-end' });
  assert.equal(plan.summary.text, 'Renumbers 2 scenes. Updates 3 links in 2 scenes.');
  await applyPlan(v.scenes('a'), plan, { journalDir: v.journalDir });
  assert.deepEqual(Object.keys(snapshot(v.scenes('a'))).filter((k) => k.endsWith('/')).sort(), ['01-start/', '02-middle/', '03-end/']);
  assert.match(readFileSync(join(v.scenes('a'), '01-start/index.md'), 'utf-8'), /\[\[end\]\] and \[\[middle\|the middle\]\]/);
  assert.match(readFileSync(join(v.scenes('a'), '03-end/index.md'), 'utf-8'), /\[\[start\]\] and \[\[middle\]\]/);
  assert.deepEqual(snapshot(v.scenes('b')), otherBefore);
  assert.equal(existsSync(join(v.scenes('a'), '.keely-restructure')), false);
});

test('an untitled scene is titled from its folder name', () => {
  assert.equal(sceneTitle('The Order', '01-the-order'), 'The Order');
  assert.equal(sceneTitle(undefined, '05-chapter-2'), 'Chapter 2');
  assert.equal(sceneTitle('   ', '05-chapter-2'), 'Chapter 2');
  assert.equal(sceneTitle(null, '07'), 'Scene 7');
});

test('rewriting links never chains renames', () => {
  const renames = new Map([['01-x', '02-x'], ['02-x', '03-x']]);
  assert.equal(rewriteLinks('[[01-x]] [[02-x|two]]', renames).text, '[[02-x]] [[03-x|two]]');
});

test('moving a scene into another chapter renumbers what follows and changes no link', async () => {
  const v = makeVault({
    s: {
      'chapter-01-one/01-a/index.md': scene(),
      'chapter-01-one/02-b/index.md': scene('See [[c]].'),
      'chapter-01-one/_meta.toml': 'title = "One"\n',
      'chapter-02-two/03-c/index.md': scene(),
      'chapter-02-two/03-c/map.png': 'image',
      'chapter-02-two/04-d/index.md': scene(),
      'chapter-02-two/_meta.toml': 'title = "Two"\n',
    },
  });
  const story = await readStory(v.scenes('s'));
  // Move c to the start of chapter one.
  const plan = planRestructure(story, [
    { id: 'chapter-01-one', children: [{ id: 'chapter-02-two/03-c' }, { id: 'chapter-01-one/01-a' }, { id: 'chapter-01-one/02-b' }] },
    { id: 'chapter-02-two', children: [{ id: 'chapter-02-two/04-d' }] },
  ]);
  assert.equal(plan.summary.text, 'Moves 1 scene to a different place, renumbers 2 scenes.');
  assert.equal(plan.linkRewrites.length, 0);
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  const after = snapshot(v.scenes('s'));
  assert.equal(after['chapter-01-one/01-c/map.png'], 'image');
  assert.equal(after['chapter-01-one/_meta.toml'], 'title = "One"\n');
  assert.equal(after['chapter-02-two/_meta.toml'], 'title = "Two"\n');
  assert.ok('chapter-01-one/02-a/' in after && 'chapter-02-two/04-d/' in after);
  assert.equal(after['chapter-01-one/03-b/index.md'], scene('See [[c]].'));
});

test('renumbering a chapter carries its scenes without counting them as moved', async () => {
  const v = makeVault({
    s: {
      'arc-01-x/chapter-01-a/01-one/index.md': scene(),
      'arc-01-x/chapter-03-b/02-two/index.md': scene(),
      'arc-01-x/chapter-03-b/_meta.toml': 'title = "B"\n',
    },
  });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.summary.text, 'Renumbers 1 chapter.');
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  const after = snapshot(v.scenes('s'));
  assert.ok('arc-01-x/chapter-02-b/02-two/index.md' in after);
  assert.equal(after['arc-01-x/chapter-02-b/_meta.toml'], 'title = "B"\n');
});

test('a tidy brings D-158 and D-180 names into D-181, and old-style links follow', async () => {
  // D-158: markers; scene numbers already run across the story.
  const old = makeVault({
    s: {
      '00_arc-01-x/00_chapter-01-a/01-one/index.md': scene('To [[02-two]].'),
      '00_arc-01-x/01_chapter-02-b/02-two/index.md': scene(),
      '00_arc-01-x/01_chapter-02-b/_meta.toml': 'title = "B"\n',
    },
  });
  let story = await readStory(old.scenes('s'));
  assert.equal(story.format, 'marker');
  let plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.summary.text, 'Updates 3 folder names to the new format. Updates 1 link in 1 scene.');
  assert.deepEqual(plan.sceneRenames, {});
  await applyPlan(old.scenes('s'), plan, { journalDir: old.journalDir });
  let after = snapshot(old.scenes('s'));
  assert.equal(after['arc-01-x/chapter-01-a/01-one/index.md'], scene('To [[two]].'));
  assert.equal(after['arc-01-x/chapter-02-b/_meta.toml'], 'title = "B"\n');
  assert.ok('arc-01-x/chapter-02-b/02-two/index.md' in after);

  // D-180: each folder counting from 01.
  const d180 = makeVault({
    s: {
      '01_arc-x/01_chapter-a/01-one/index.md': scene('To [[two]].'),
      '01_arc-x/02_chapter-b/01-two/index.md': scene(),
    },
  });
  story = await readStory(d180.scenes('s'));
  assert.equal(story.format, 'by-position');
  plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.summary.text, 'Updates 4 folder names to the new format.');
  assert.deepEqual(plan.sceneRenames, { '01-two': '02-two' });
  await applyPlan(d180.scenes('s'), plan, { journalDir: d180.journalDir });
  after = snapshot(d180.scenes('s'));
  assert.equal(after['arc-01-x/chapter-01-a/01-one/index.md'], scene('To [[two]].'));
  assert.ok('arc-01-x/chapter-02-b/02-two/index.md' in after);

  // Names from before D-158 already have D-181's shape.
  const pre = makeVault({ s: { 'arc-01-x/chapter-01-a/01-one/index.md': scene(), 'arc-01-x/chapter-02-b/02-two/index.md': scene() } });
  story = await readStory(pre.scenes('s'));
  assert.equal(story.format, 'current');
  assert.equal(planRestructure(story, asRequest(story.tree)).relocations.length, 0);
});

test('new items get a reserved path and push later scenes along', async () => {
  const v = makeVault({ s: { '01-a/index.md': scene(), '02-b/index.md': scene('Next: [[b]].') } });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, [{ id: '01-a' }, { new: { kind: 'scene', bare: 'inserted' } }, { id: '02-b' }]);
  assert.deepEqual(plan.newItems, [{ kind: 'scene', bare: 'inserted', path: '02-inserted' }]);
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  assert.equal(existsSync(join(v.scenes('s'), '02-inserted')), false, 'the engine reserves the path; the caller creates it');
  assert.equal(readFileSync(join(v.scenes('s'), '03-b/index.md'), 'utf-8'), scene('Next: [[b]].'));
});

test("each kind is padded to its own count", async () => {
  const files = {};
  for (let i = 1; i <= 100; i++) files[`chapter-01-long/${String(i).padStart(2, '0')}-s${i}/index.md`] = scene();
  files['chapter-02-short/101-x/index.md'] = scene();
  const story = await readStory(makeVault({ s: files }).scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.relocations.find((r) => r.from === 'chapter-01-long/01-s1').to, 'chapter-01-long/001-s1');
  assert.equal(plan.relocations.find((r) => r.from === 'chapter-01-long/100-s100'), undefined);
  assert.equal(plan.relocations.find((r) => r.from.startsWith('chapter-02-short')), undefined, 'two digits for two chapters');

  const three = await readStory(makeVault({ s: { '001-a/index.md': scene(), '003-b/index.md': scene() } }).scenes('s'));
  assert.deepEqual(planRestructure(three, asRequest(three.tree)).sceneRenames, { '001-a': '01-a', '003-b': '02-b' });
});

test('interludes hold what goes in between, and folder order is reading order', async () => {
  const v = makeVault({
    s: {
      'arc-01-x/chapter-01-a/01-one/index.md': scene(),
      'arc-01-x/chapter-02-b/02-two/index.md': scene(),
      'arc-02-y/chapter-03-c/03-three/index.md': scene(),
      'arc-02-y/chapter-03.1-letter/04-dear/index.md': scene(),
      'arc-02-y/chapter-03.1-letter/_meta.toml': 'title = "A Letter Home"\n',
    },
  });
  const story = await readStory(v.scenes('s'));
  // The letter moves between the arcs; a prologue interlude goes before Arc 1
  // and another interlude between Chapters 1 and 2.
  const desired = [
    { new: { kind: 'interlude', bare: 'prologue' } },
    { id: 'arc-01-x', children: [
      { id: 'arc-01-x/chapter-01-a', children: [{ id: 'arc-01-x/chapter-01-a/01-one' }] },
      { new: { kind: 'interlude', bare: 'aside' } },
      { id: 'arc-01-x/chapter-02-b', children: [{ id: 'arc-01-x/chapter-02-b/02-two' }] },
    ] },
    { id: 'arc-02-y/chapter-03.1-letter', children: [{ id: 'arc-02-y/chapter-03.1-letter/04-dear' }] },
    { id: 'arc-02-y', children: [{ id: 'arc-02-y/chapter-03-c', children: [{ id: 'arc-02-y/chapter-03-c/03-three' }] }] },
  ];
  const plan = planRestructure(story, desired);
  assert.deepEqual(plan.newItems.map((n) => n.path), ['arc-00.1-prologue', 'arc-01-x/chapter-01.1-aside']);
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  const after = snapshot(v.scenes('s'));
  assert.equal(after['arc-01.1-letter/_meta.toml'], 'title = "A Letter Home"\n');
  assert.ok('arc-01.1-letter/03-dear/index.md' in after, 'its scene is numbered with the others');
  assert.ok('arc-02-y/chapter-03-c/04-three/index.md' in after);
  // Plain alphabetical order of each folder equals the order asked for.
  const story2 = await readStory(v.scenes('s'));
  const order = (nodes) => nodes.flatMap((n) => [n.name, ...(n.children ? order(n.children) : [])]);
  assert.deepEqual(order(story2.tree), ['arc-01-x', 'chapter-01-a', '01-one', 'chapter-02-b', '02-two', 'arc-01.1-letter', '03-dear', 'arc-02-y', 'chapter-03-c', '04-three']);
  for (const dir of [v.scenes('s'), join(v.scenes('s'), 'arc-01-x')]) {
    const names = readdirSync(dir).filter((n) => !n.startsWith('.'));
    assert.deepEqual([...names].sort(), names.sort(), dir);
  }
});

test('the order within a folder is fixed, and Keely says how to get round it', async () => {
  const story = await readStory(makeVault({ s: { 'arc-01-x/chapter-01-a/01-one/index.md': scene(), 'arc-01-x/02-loose/index.md': scene(), 'chapter-02-b/03-z/index.md': scene() } }).scenes('s'));
  // A scene after a chapter inside an arc.
  assert.throws(
    () => planRestructure(story, [
      { id: 'arc-01-x', children: [{ id: 'arc-01-x/chapter-01-a', children: [{ id: 'arc-01-x/chapter-01-a/01-one' }] }, { id: 'arc-01-x/02-loose' }] },
      { id: 'chapter-02-b', children: [{ id: 'chapter-02-b/03-z' }] },
    ]),
    (err) => err.code === 'not-allowed' && /add an interlude/.test(err.message)
  );
  // A chapter before an arc at the top.
  assert.throws(
    () => planRestructure(story, [
      { id: 'chapter-02-b', children: [{ id: 'chapter-02-b/03-z' }] },
      { id: 'arc-01-x', children: [{ id: 'arc-01-x/02-loose' }, { id: 'arc-01-x/chapter-01-a', children: [{ id: 'arc-01-x/chapter-01-a/01-one' }] }] },
    ]),
    (err) => err.code === 'not-allowed' && /use an interlude/.test(err.message)
  );
  // At most nine interludes in one place.
  const many = Array.from({ length: 10 }, (_, i) => ({ new: { kind: 'interlude', bare: `i${i}` } }));
  assert.throws(
    () => planRestructure(story, [
      { id: 'arc-01-x', children: [{ id: 'arc-01-x/02-loose' }, { id: 'arc-01-x/chapter-01-a', children: [{ id: 'arc-01-x/chapter-01-a/01-one' }] }, ...many] },
      { id: 'chapter-02-b', children: [{ id: 'chapter-02-b/03-z' }] },
    ]),
    (err) => err.code === 'not-allowed' && /at most 9 interludes/.test(err.message)
  );
  // An interlude can't hold a chapter.
  assert.throws(
    () => planRestructure(story, [
      { new: { kind: 'interlude', bare: 'p' }, children: [{ id: 'chapter-02-b', children: [{ id: 'chapter-02-b/03-z' }] }] },
      { id: 'arc-01-x', children: [{ id: 'arc-01-x/02-loose' }, { id: 'arc-01-x/chapter-01-a', children: [{ id: 'arc-01-x/chapter-01-a/01-one' }] }] },
    ]),
    { code: 'not-allowed' }
  );
});

test('repeated and blank names are made unique, and the summary says so', async () => {
  const v = makeVault({ s: { '01-a/index.md': scene() } });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, [
    { id: '01-a' },
    { new: { kind: 'scene', bare: 'a' } },
    { new: { kind: 'scene', bare: '' } },
    { new: { kind: 'arc', bare: 'x' } },
    { new: { kind: 'chapter', bare: 'x' } },
    { new: { kind: 'chapter', bare: 'x' } },
    { new: { kind: 'interlude', bare: 'x' } },
  ]);
  assert.deepEqual(plan.newItems.map((n) => n.path), ['02-a-2', '03-untitled', 'arc-01-x', 'chapter-01-x', 'chapter-02-x-2', 'chapter-02.1-x']);
  assert.match(plan.summary.text, /The new scene is named "a-2", since "a" is already used in this story\./);

  // A name used twice in an older story: the first keeps it, the later one
  // gets "-2", and a link to it by its old folder name follows.
  const old = makeVault({ s: { '01-interlude/index.md': scene(), '05-interlude/index.md': scene(), '06-after/index.md': scene('Back to [[05-interlude]].') } });
  const oldStory = await readStory(old.scenes('s'));
  const tidy = planRestructure(oldStory, asRequest(oldStory.tree));
  assert.deepEqual(tidy.sceneRenames, { '05-interlude': '02-interlude-2', '06-after': '03-after' });
  await applyPlan(old.scenes('s'), tidy, { journalDir: old.journalDir });
  assert.equal(readFileSync(join(old.scenes('s'), '03-after/index.md'), 'utf-8'), scene('Back to [[interlude-2]].'));
});

test('structure rules still apply', async () => {
  const v = makeVault({ s: { '00_arc-01-x/00_chapter-01-a/01-one/index.md': scene(), '01_chapter-02-b/02-z/index.md': scene() } });
  const story = await readStory(v.scenes('s'));
  // A chapter inside a chapter.
  assert.throws(
    () => planRestructure(story, [
      { id: '00_arc-01-x', children: [{ id: '00_arc-01-x/00_chapter-01-a', children: [{ id: '00_arc-01-x/00_chapter-01-a/01-one' }, { id: '01_chapter-02-b', children: [{ id: '01_chapter-02-b/02-z' }] }] }] },
    ]),
    { code: 'not-allowed' }
  );
  // Something left out.
  assert.throws(() => planRestructure(story, [{ id: '01_chapter-02-b', children: [{ id: '01_chapter-02-b/02-z' }] }]), { code: 'bad-request' });
});

test('a folder that is not a scene, arc or chapter stops the read', async () => {
  const v = makeVault({ s: { '01-a/index.md': scene(), 'notes/todo.txt': 'x' } });
  await assert.rejects(() => readStory(v.scenes('s')), { code: 'unknown-folder' });
});

test('a plan made before the story changed is refused', async () => {
  const v = makeVault({ s: { '01-a/index.md': scene(), '03-b/index.md': scene() } });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  writeFileSync(join(v.scenes('s'), '01-a/index.md'), scene('Edited elsewhere.'));
  await assert.rejects(() => applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir }), { code: 'stale' });
  assert.ok(existsSync(join(v.scenes('s'), '03-b')), 'nothing was changed');
});

test('a failure at any step undoes everything exactly', async () => {
  const stories = {
    s: {
      'arc-01-x/chapter-01-a/01-one/index.md': scene('To [[05-four]].'),
      'arc-01-x/chapter-01-a/_meta.toml': 'title = "A"\n',
      'arc-01-x/chapter-03-b/03-two/index.md': scene('To [[01-one]] and [[04-three]].'),
      'arc-01-x/chapter-03-b/04-three/index.md': scene(),
      'arc-01-x/chapter-03-b/04-three/pic.png': 'image',
      'arc-02-y/chapter-04-c/05-four/index.md': scene(),
    },
  };
  const request = (story) => [
    { id: 'arc-01-x', children: [
      { id: 'arc-01-x/chapter-01-a', children: [{ id: 'arc-01-x/chapter-01-a/01-one' }] },
    ] },
    { id: 'arc-02-y', children: [
      { id: 'arc-02-y/chapter-04-c', children: [{ id: 'arc-02-y/chapter-04-c/05-four' }, { id: 'arc-01-x/chapter-03-b/04-three' }] },
      { id: 'arc-01-x/chapter-03-b', children: [{ id: 'arc-01-x/chapter-03-b/03-two' }] },
    ] },
  ];
  // How many steps the full apply takes.
  const probe = makeVault(stories);
  const probeStory = await readStory(probe.scenes('s'));
  const probePlan = planRestructure(probeStory, request(probeStory));
  await applyPlan(probe.scenes('s'), probePlan, { journalDir: probe.journalDir });
  const finalState = snapshot(probe.scenes('s'));

  let failures = 0;
  for (let n = 0; ; n++) {
    const v = makeVault(stories);
    const before = snapshot(v.scenes('s'));
    const story = await readStory(v.scenes('s'));
    const plan = planRestructure(story, request(story));
    try {
      await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir, failAfterSteps: n });
    } catch (err) {
      assert.equal(err.code, 'apply-failed');
      assert.deepEqual(snapshot(v.scenes('s')), before, `failure after ${n} steps left changes behind`);
      assert.equal(existsSync(journalPathFor(v.journalDir, v.scenes('s'))), false);
      failures++;
      continue;
    }
    assert.deepEqual(snapshot(v.scenes('s')), finalState);
    break;
  }
  assert.ok(failures > 10, `expected many failure points, got ${failures}`);
});

test('a journal left by a crash is undone before the next change', async () => {
  const v = makeVault({ s: { '01-a/index.md': scene(), '03-b/index.md': scene(), '04-c/index.md': scene() } });
  const before = snapshot(v.scenes('s'));
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  // Simulate a crash: perform part of the apply, then keep its journal.
  const { renameSync, mkdirSync: mk } = await import('fs');
  const hold = join(v.scenes('s'), '.keely-restructure');
  mk(hold);
  renameSync(join(v.scenes('s'), '03-b'), join(hold, 's0'));
  mkdirSync(v.journalDir, { recursive: true });
  writeFileSync(
    journalPathFor(v.journalDir, v.scenes('s')),
    JSON.stringify({ scenesRoot: v.scenes('s'), steps: [{ type: 'mkdir', path: hold }, { type: 'move', from: join(v.scenes('s'), '03-b'), to: join(hold, 's0') }] })
  );
  // The next apply rolls the crash back first, then applies the (still valid) plan.
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  assert.notDeepEqual(snapshot(v.scenes('s')), before);
  assert.deepEqual(Object.keys(snapshot(v.scenes('s'))).filter((k) => k.endsWith('/')).sort(), ['01-a/', '02-b/', '03-c/']);
});

test('new item names may use any alphabet, or be empty', async () => {
  const story = await readStory(makeVault({ s: { '01-a/index.md': scene() } }).scenes('s'));
  const plan = planRestructure(story, [
    { id: '01-a' },
    { new: { kind: 'scene', bare: 'café-noir' } },
    { new: { kind: 'scene', bare: '日本' } },
    { new: { kind: 'scene', bare: '' } },
  ]);
  assert.deepEqual(plan.newItems.map((n) => n.path), ['02-café-noir', '03-日本', '04-untitled']);
  assert.throws(() => planRestructure(story, [{ id: '01-a' }, { new: { kind: 'scene', bare: '../escape' } }]), { code: 'bad-name' });
  assert.throws(() => planRestructure(story, [{ id: '01-a' }, { new: { kind: 'scene', bare: 'Upper' } }]), { code: 'bad-name' });
});

test('the summary lists several kinds naturally', async () => {
  const v = makeVault({ s: { '01-p/index.md': scene(), 'arc-03-a/chapter-05-c/04-s/index.md': scene() } });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.summary.text, 'Renumbers 1 scene, 1 chapter and 1 arc.');
});

test('the outline gives titles, statuses, labels, and whether old-style names remain', async () => {
  const v = makeVault({
    s: {
      '00_arc-01-the-start/01-no-title/index.md': '---\ntype: scene\n---\n',
      '00_arc-01-the-start/01_chapter-01-first/02-opening/index.md': '---\ntitle: "The Opening"\nstatus: published\n---\nText.\n',
      '00_arc-01-the-start/01_chapter-01-first/_meta.toml': 'title = "First Things"\n',
    },
  });
  const old = await readOutline(v.scenes('s'));
  assert.equal(old.legacy, true);
  const arc = old.tree[0];
  assert.equal(arc.label, 'Arc 1: The Start');
  const chapter = arc.children.find((n) => n.kind === 'chapter');
  assert.equal(chapter.label, 'Chapter 1: First Things');
  assert.deepEqual(chapter.children[0], { kind: 'scene', id: '00_arc-01-the-start/01_chapter-01-first/02-opening', name: '02-opening', address: 'opening', number: 2, title: 'The Opening', status: 'published' });
  const loose = arc.children.find((n) => n.kind === 'scene');
  assert.equal(loose.title, 'No Title');
  assert.equal(loose.status, 'drafting');

  const story = await readStory(v.scenes('s'));
  await applyPlan(v.scenes('s'), planRestructure(story, asRequest(story.tree)), { journalDir: v.journalDir });
  const updated = await readOutline(v.scenes('s'));
  assert.equal(updated.legacy, false);
  assert.equal(updated.tree[0].label, 'Arc 1: The Start');
  assert.equal(updated.tree[0].name, 'arc-01-the-start');

  // An interlude is labelled by its title, and says which level it sits at.
  const w = makeVault({ s: { 'arc-01-a/01-x/index.md': scene(), 'arc-01.1-quiet/02-y/index.md': scene(), 'arc-01.1-quiet/_meta.toml': 'title = "Quiet Night"\n' } });
  const outline = await readOutline(w.scenes('s'));
  assert.deepEqual([outline.tree[1].kind, outline.tree[1].label, outline.tree[1].level], ['interlude', 'Quiet Night', 'arc']);
});

test('a scene whose front matter can\'t be read is marked, not given a status (Epic 2M)', async () => {
  const v = makeVault({
    s: {
      '01-fine/index.md': '---\ntitle: "Fine"\nstatus: published\n---\nText.\n',
      '02-broken/index.md': '---\ntitle: "The Order\nstatus: published\n---\nText.\n',
    },
  });
  const { tree } = await readOutline(v.scenes('s'));
  assert.equal(tree[0].unreadable, undefined);
  assert.equal(tree[1].unreadable, true);
  assert.equal(tree[1].title, 'Broken');
});
