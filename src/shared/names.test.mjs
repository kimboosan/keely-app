// Story names (D-180, D-181): addresses, counted numbers and the story's format.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containerLabel, folderName, nameStory, parseFolderName, storyFormat } from './names.mjs';

const CURRENT = {
  scenes: [
    'arc-01-evacuation/chapter-01-the-order/01-the-order',
    'arc-01-evacuation/chapter-01-the-order/02-a-history',
    'arc-01-evacuation/chapter-02-breakdown/03-breakdown',
    'arc-01.1-quiet-night/04-the-long-dark',
    'arc-02-crisis/chapter-03-endgame/05-take-off',
  ],
  containers: [
    'arc-01-evacuation',
    'arc-01-evacuation/chapter-01-the-order',
    'arc-01-evacuation/chapter-02-breakdown',
    'arc-01.1-quiet-night',
    'arc-02-crisis',
    'arc-02-crisis/chapter-03-endgame',
  ],
};

const MARKER = {
  scenes: [
    '00_arc-01-evacuation/00_chapter-01-the-order/01-the-order',
    '00_arc-01-evacuation/00_chapter-01-the-order/02-a-history',
    '00_arc-01-evacuation/02_chapter-02-breakdown/03-breakdown',
    '03_arc-02-crisis/03_chapter-03-endgame/04-take-off',
  ],
  containers: [
    '00_arc-01-evacuation',
    '00_arc-01-evacuation/00_chapter-01-the-order',
    '00_arc-01-evacuation/02_chapter-02-breakdown',
    '03_arc-02-crisis',
    '03_arc-02-crisis/03_chapter-03-endgame',
  ],
};

const BY_POSITION = {
  scenes: [
    '01_arc-evacuation/01_chapter-the-order/01-the-order',
    '01_arc-evacuation/01_chapter-the-order/02-a-history',
    '01_arc-evacuation/02_chapter-breakdown/01-breakdown',
    '02_arc-crisis/01_chapter-endgame/01-take-off',
  ],
  containers: [
    '01_arc-evacuation',
    '01_arc-evacuation/01_chapter-the-order',
    '01_arc-evacuation/02_chapter-breakdown',
    '02_arc-crisis',
    '02_arc-crisis/01_chapter-endgame',
  ],
};

test('a scene is addressed by its name without the number, in every format', () => {
  assert.deepEqual([...nameStory(CURRENT.scenes, CURRENT.containers).scenes.values()], ['the-order', 'a-history', 'breakdown', 'the-long-dark', 'take-off']);
  for (const story of [MARKER, BY_POSITION]) {
    assert.deepEqual([...nameStory(story.scenes, story.containers).scenes.values()], ['the-order', 'a-history', 'breakdown', 'take-off']);
  }
});

test('arcs and chapters are counted in reading order; an interlude is addressed but not counted', () => {
  assert.deepEqual(
    [...nameStory(CURRENT.scenes, CURRENT.containers).containers.values()].map((c) => `${c.slug} ${c.number}`),
    ['arc-evacuation 1', 'chapter-the-order 1', 'chapter-breakdown 2', 'interlude-quiet-night null', 'arc-crisis 2', 'chapter-endgame 3'],
  );
  for (const story of [MARKER, BY_POSITION]) {
    assert.deepEqual(
      [...nameStory(story.scenes, story.containers).containers.values()].map((c) => `${c.slug} ${c.number}`),
      ['arc-evacuation 1', 'chapter-the-order 1', 'chapter-breakdown 2', 'arc-crisis 2', 'chapter-endgame 3'],
    );
  }
});

test("a story's format is told from its folder names", () => {
  assert.equal(storyFormat(CURRENT.scenes), 'current');
  assert.equal(storyFormat(MARKER.scenes), 'marker');
  assert.equal(storyFormat(BY_POSITION.scenes), 'by-position');
  // Names from before D-158 already have D-181's shape.
  assert.equal(storyFormat(['arc-01-x/chapter-01-a/01-one']), 'current');
  // A D-180 story whose arc and chapter names start with digits fits D-158's
  // shape too: the scene numbers starting again in each chapter say which.
  assert.equal(storyFormat(['01_chapter-24-hours/01-dawn', '02_chapter-48-hours/01-dusk']), 'by-position');
  // A story of scenes alone reads the same either way.
  assert.equal(storyFormat(['01-one', '02-two']), 'current');
});

test('interlude names: the level, the number they follow, and their place there', () => {
  const p = parseFolderName('chapter-03.2-a-letter-home');
  assert.deepEqual([p.kind, p.level, p.number, p.interlude, p.bare], ['interlude', 'chapter', 3, 2, 'a-letter-home']);
  assert.equal(parseFolderName('arc-00.1-prologue').number, 0);
  assert.equal(folderName('interlude', 1, 2, 'quiet-night', { level: 'arc', index: 1 }), 'arc-01.1-quiet-night');
  assert.equal(folderName('chapter', 3, 2, 'what-comes-next'), 'chapter-03-what-comes-next');
  assert.equal(folderName('scene', 9, 2, 'whats-going-on'), '09-whats-going-on');
  // Plain name order puts an interlude right after what it follows.
  const names = ['arc-02-crisis', 'arc-01.2-b', 'arc-01-evacuation', 'arc-01.1-a', 'chapter-01-x', '01-prologue'];
  assert.deepEqual([...names].sort(), ['01-prologue', 'arc-01-evacuation', 'arc-01.1-a', 'arc-01.2-b', 'arc-02-crisis', 'chapter-01-x']);
});

test('a name used twice: the first keeps it, a later one is addressed by its folder name', () => {
  const names = nameStory(['01-interlude', '05-interlude', '07-interlude'], []);
  assert.deepEqual([...names.scenes.values()], ['interlude', '05-interlude', '07-interlude']);
  assert.deepEqual(names.repeats, [{ kind: 'scene', slug: 'interlude', paths: ['01-interlude', '05-interlude', '07-interlude'] }]);
});

test('a scene folder that is only a number is addressed by it', () => {
  const names = nameStory(['01', '02-named'], []);
  assert.deepEqual([...names.scenes.values()], ['01', 'named']);
});

test('labels use the counted number; an interlude shows its title, or "Interlude"', () => {
  assert.equal(containerLabel('07_arc-02-crisis', undefined, 2), 'Arc 2: Crisis');
  assert.equal(containerLabel('arc-02-crisis', 'The Crisis', 2), 'Arc 2: The Crisis');
  assert.equal(containerLabel('03_chapter-24-hours', undefined, 3, { format: 'by-position' }), 'Chapter 3: 24 Hours');
  assert.equal(containerLabel('arc-02-crisis'), 'Arc 2: Crisis');
  assert.equal(containerLabel('chapter-03.1-a-letter-home', 'A Letter Home'), 'A Letter Home');
  assert.equal(containerLabel('chapter-03.1-a-letter-home'), 'A Letter Home');
  assert.equal(containerLabel('arc-01.1-untitled'), 'Interlude');
});
