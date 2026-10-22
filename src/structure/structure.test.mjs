// Tests for the story restructure engine (D-157). Run: npm test
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

test('tidy closes gaps and rewrites links only within the story', async () => {
  const v = makeVault({
    a: {
      '01-start/index.md': scene('Then [[04-end]] and [[03-middle|the middle]].'),
      '03-middle/index.md': scene(),
      '04-end/index.md': scene('Back to [[01-start]].'),
    },
    b: { '01-other/index.md': scene('Its own [[03-middle]].'), '03-middle/index.md': scene() },
  });
  const otherBefore = snapshot(v.scenes('b'));
  const story = await readStory(v.scenes('a'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.deepEqual(plan.sceneRenames, { '03-middle': '02-middle', '04-end': '03-end' });
  assert.equal(plan.summary.text, 'Renumbers 2 scenes. Updates 2 links in 1 scene.');
  await applyPlan(v.scenes('a'), plan, { journalDir: v.journalDir });
  assert.deepEqual(Object.keys(snapshot(v.scenes('a'))).filter((k) => k.endsWith('/')).sort(), ['01-start/', '02-middle/', '03-end/']);
  assert.match(readFileSync(join(v.scenes('a'), '01-start/index.md'), 'utf-8'), /\[\[03-end\]\] and \[\[02-middle\|the middle\]\]/);
  assert.deepEqual(snapshot(v.scenes('b')), otherBefore);
  assert.equal(existsSync(join(v.scenes('a'), '.keely-restructure')), false);
});

test('rewriting links never chains renames', () => {
  const renames = new Map([['01-x', '02-x'], ['02-x', '03-x']]);
  assert.equal(rewriteLinks('[[01-x]] [[02-x|two]]', renames).text, '[[02-x]] [[03-x|two]]');
});

test('moving a scene into another chapter, with container files travelling along', async () => {
  const v = makeVault({
    s: {
      '00_chapter-01-one/01-a/index.md': scene(),
      '00_chapter-01-one/02-b/index.md': scene('See [[03-c]].'),
      '00_chapter-01-one/_meta.toml': 'title = "One"\n',
      '02_chapter-02-two/03-c/index.md': scene(),
      '02_chapter-02-two/03-c/map.png': 'image',
      '02_chapter-02-two/_meta.toml': 'title = "Two"\n',
    },
  });
  const story = await readStory(v.scenes('s'));
  // Move 03-c to the start of chapter one.
  const plan = planRestructure(story, [
    { id: '00_chapter-01-one', children: [{ id: '02_chapter-02-two/03-c' }, { id: '00_chapter-01-one/01-a' }, { id: '00_chapter-01-one/02-b' }] },
    { id: '02_chapter-02-two', children: [] },
  ]);
  // Chapter two's marker moves (02 → 03) but its number doesn't: not "renumbered".
  assert.equal(plan.summary.text, 'Moves 1 scene to a different place, renumbers 2 scenes. Updates 1 link in 1 scene.');
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  const after = snapshot(v.scenes('s'));
  assert.equal(after['00_chapter-01-one/01-c/map.png'], 'image');
  assert.equal(after['00_chapter-01-one/_meta.toml'], 'title = "One"\n');
  assert.equal(after['03_chapter-02-two/_meta.toml'], 'title = "Two"\n');
  assert.ok('00_chapter-01-one/02-a/' in after && '00_chapter-01-one/03-b/' in after);
  assert.equal(after['00_chapter-01-one/03-b/index.md'], scene('See [[01-c]].'));
});

test('renumbering a chapter carries its scenes without counting them as moved', async () => {
  const v = makeVault({
    s: {
      '00_arc-01-x/00_chapter-01-a/01-one/index.md': scene(),
      '00_arc-01-x/01_chapter-03-b/02-two/index.md': scene(),
      '00_arc-01-x/01_chapter-03-b/_meta.toml': 'title = "B"\n',
    },
  });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.summary.text, 'Renumbers 1 chapter.');
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  const after = snapshot(v.scenes('s'));
  assert.ok('00_arc-01-x/01_chapter-02-b/02-two/index.md' in after);
  assert.equal(after['00_arc-01-x/01_chapter-02-b/_meta.toml'], 'title = "B"\n');
});

test('a tidy brings pre-D-158 names into the new format, scenes untouched', async () => {
  const v = makeVault({
    s: {
      'arc-01-x/chapter-01-a/01-one/index.md': scene('To [[02-two]].'),
      'arc-01-x/chapter-02-b/02-two/index.md': scene(),
      'arc-01-x/chapter-02-b/_meta.toml': 'title = "B"\n',
    },
  });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.summary.text, 'Updates 3 arc and chapter folder names to the new format.');
  assert.deepEqual(plan.sceneRenames, {});
  assert.equal(plan.linkRewrites.length, 0);
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  const after = snapshot(v.scenes('s'));
  assert.ok('00_arc-01-x/00_chapter-01-a/01-one/index.md' in after);
  assert.equal(after['00_arc-01-x/01_chapter-02-b/_meta.toml'], 'title = "B"\n');
});

test('new items get a reserved path and push later scenes along', async () => {
  const v = makeVault({ s: { '01-a/index.md': scene(), '02-b/index.md': scene('Next: [[02-b]].') } });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, [{ id: '01-a' }, { new: { kind: 'scene', bare: 'inserted' } }, { id: '02-b' }]);
  assert.deepEqual(plan.newItems, [{ kind: 'scene', bare: 'inserted', path: '02-inserted' }]);
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  assert.equal(existsSync(join(v.scenes('s'), '02-inserted')), false, 'the engine reserves the path; the caller creates it');
  assert.equal(readFileSync(join(v.scenes('s'), '03-b/index.md'), 'utf-8'), scene('Next: [[03-b]].'));
});

test('number width grows past 99 scenes and never shrinks an author\'s choice', async () => {
  const files = {};
  for (let i = 1; i <= 100; i++) files[`${String(i).padStart(2, '0')}-s${i}/index.md`] = scene();
  const story = await readStory(makeVault({ s: files }).scenes('s'));
  const plan = planRestructure(story, asRequest(story.tree));
  assert.equal(plan.relocations.find((r) => r.from === '01-s1').to, '001-s1');
  assert.equal(plan.relocations.find((r) => r.from === '100-s100'), undefined);

  const three = await readStory(makeVault({ s: { '001-a/index.md': scene(), '003-b/index.md': scene() } }).scenes('s'));
  assert.deepEqual(planRestructure(three, asRequest(three.tree)).sceneRenames, { '003-b': '002-b' });
});

test('scenes, arcs and chapters can sit in any order (D-158), and folder order is reading order', async () => {
  const v = makeVault({
    s: {
      '00_arc-01-x/00_chapter-01-a/01-one/index.md': scene(),
      '00_arc-01-x/01-loose/index.md': scene(),
      '01_chapter-02-b/02-z/index.md': scene(),
      '02-end/index.md': scene(),
    },
  });
  const story = await readStory(v.scenes('s'));
  // A prologue chapter before the arc, a closing scene after the arc's
  // chapter, an epilogue scene after the arc, and an empty chapter at the end.
  const desired = [
    { id: '01_chapter-02-b', children: [{ id: '01_chapter-02-b/02-z' }] },
    { id: '00_arc-01-x', children: [{ id: '00_arc-01-x/00_chapter-01-a', children: [{ id: '00_arc-01-x/00_chapter-01-a/01-one' }] }, { id: '00_arc-01-x/01-loose' }] },
    { id: '02-end' },
    { new: { kind: 'chapter', bare: 'later' } },
  ];
  const plan = planRestructure(story, desired);
  await applyPlan(v.scenes('s'), plan, { journalDir: v.journalDir });
  assert.deepEqual(plan.newItems.map((n) => n.path), ['04_chapter-03-later']);
  // Plain alphabetical order of each folder equals the order asked for.
  const story2 = await readStory(v.scenes('s'));
  const order = (nodes) => nodes.flatMap((n) => [n.name, ...(n.children ? order(n.children) : [])]);
  assert.deepEqual(order(story2.tree), ['00_chapter-01-b', '01-z', '01_arc-01-x', '01_chapter-02-a', '02-one', '03-loose', '04-end']);
  for (const dir of [v.scenes('s'), join(v.scenes('s'), '01_arc-01-x')]) {
    const names = readdirSync(dir).filter((n) => !n.startsWith('.'));
    assert.deepEqual([...names].sort(), names.sort(), dir);
  }
});

test('sibling containers with no scene between them get tie letters', async () => {
  const v = makeVault({ s: { '01-a/index.md': scene() } });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, [
    { id: '01-a' },
    { new: { kind: 'chapter', bare: 'x' } },
    { new: { kind: 'chapter', bare: 'y' } },
    { new: { kind: 'arc', bare: 'z' } },
  ]);
  const paths = plan.newItems.map((n) => n.path);
  assert.deepEqual(paths, ['01_chapter-01-x', '01a_chapter-02-y', '01b_arc-01-z']);
  assert.deepEqual([...paths, '01-a', '02-next'].sort(), ['01-a', ...paths, '02-next']);
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
  assert.deepEqual(plan.newItems.map((n) => n.path), ['02-café-noir', '03-日本', '04']);
  assert.throws(() => planRestructure(story, [{ id: '01-a' }, { new: { kind: 'scene', bare: '../escape' } }]), { code: 'bad-name' });
  assert.throws(() => planRestructure(story, [{ id: '01-a' }, { new: { kind: 'scene', bare: 'Upper' } }]), { code: 'bad-name' });
});

test('the summary lists several kinds naturally', async () => {
  const v = makeVault({
    s: {
      '00_arc-01-x/00_chapter-01-a/01-one/index.md': scene(),
      '01_arc-02-y/01_chapter-02-b/02-two/index.md': scene(),
    },
  });
  const story = await readStory(v.scenes('s'));
  const plan = planRestructure(story, [
    { id: '01_arc-02-y', children: [{ id: '01_arc-02-y/01_chapter-02-b', children: [{ id: '01_arc-02-y/01_chapter-02-b/02-two' }] }] },
    { id: '00_arc-01-x', children: [{ id: '00_arc-01-x/00_chapter-01-a', children: [{ id: '00_arc-01-x/00_chapter-01-a/01-one' }] }] },
  ]);
  assert.equal(plan.summary.text, 'Renumbers 2 scenes, 2 chapters and 2 arcs.');
});

test('the outline gives titles, statuses, labels, and whether old-style names remain', async () => {
  const v = makeVault({
    s: {
      'arc-01-the-start/chapter-01-first/01-opening/index.md': '---\ntitle: "The Opening"\nstatus: published\n---\nText.\n',
      'arc-01-the-start/chapter-01-first/_meta.toml': 'title = "First Things"\n',
      'arc-01-the-start/02-no-title/index.md': '---\ntype: scene\n---\n',
    },
  });
  const old = await readOutline(v.scenes('s'));
  assert.equal(old.legacy, true);
  const arc = old.tree[0];
  assert.equal(arc.label, 'Arc 01: The Start');
  const chapter = arc.children.find((n) => n.kind === 'chapter');
  assert.equal(chapter.label, 'Chapter 01: First Things');
  assert.deepEqual(chapter.children[0], { kind: 'scene', id: 'arc-01-the-start/chapter-01-first/01-opening', name: '01-opening', title: 'The Opening', status: 'published' });
  const loose = arc.children.find((n) => n.kind === 'scene');
  assert.equal(loose.title, 'No Title');
  assert.equal(loose.status, 'drafting');

  const story = await readStory(v.scenes('s'));
  await applyPlan(v.scenes('s'), planRestructure(story, asRequest(story.tree)), { journalDir: v.journalDir });
  const updated = await readOutline(v.scenes('s'));
  assert.equal(updated.legacy, false);
  assert.equal(updated.tree[0].label, 'Arc 01: The Start');
});
