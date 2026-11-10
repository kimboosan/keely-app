import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRelationships, entityLists } from './relationships.mjs';

const scene = (slug, data, body = '') => ({ storySlug: 'tale', slug, path: slug, data: { status: 'published', ...data }, body });
const titles = (refs) => refs.map((r) => r.title);

test('a POV character appears in their scene even when the cast leaves them out', () => {
  const r = computeRelationships({ scenes: [scene('01-a', { pov_character: 'sam', characters_in_scene: ['gene'] })] });
  assert.deepEqual(titles(r.appearsIn.sam), ['A']);
  assert.deepEqual(titles(r.appearsIn.gene), ['A']);
});

test('a scene is at its location and anywhere also_at', () => {
  const r = computeRelationships({ scenes: [scene('01-a', { scene_location: 'pub', also_at: ['station'] })] });
  assert.deepEqual(titles(r.atLocation.pub), ['A']);
  assert.deepEqual(titles(r.atLocation.station), ['A']);
});

test('drafts count only when asked', () => {
  const draft = { ...scene('01-a', { characters_in_scene: ['sam'] }), data: { status: 'drafting', characters_in_scene: ['sam'] } };
  assert.equal(computeRelationships({ scenes: [draft] }).appearsIn.sam, undefined);
  assert.deepEqual(titles(computeRelationships({ scenes: [draft], includeDrafts: true }).appearsIn.sam), ['A']);
});

test('short names link themselves in scene text only when the project says so', () => {
  const entities = [{ type: 'characters', slug: 'gene-hunt', data: { name: 'Gene Hunt', short_name: 'Gene' }, body: '' }];
  const scenes = [scene('01-a', {}, 'Gene walked in.')];
  assert.equal(computeRelationships({ scenes, entities }).mentionedIn['gene-hunt'], undefined);
  assert.deepEqual(titles(computeRelationships({ scenes, entities, autoLink: true }).mentionedIn['gene-hunt']), ['A']);
});

test('entity descriptions, members and group mirrors', () => {
  const entities = [
    { type: 'characters', slug: 'sam', data: { name: 'Sam Tyler', groups: ['cid'] }, body: 'Works with [[gene]].' },
    { type: 'groups', slug: 'cid', data: { name: 'CID', opposed_to: ['villains'] }, body: '' },
  ];
  const r = computeRelationships({ entities });
  assert.deepEqual(r.mentionedBy.gene, [{ type: 'characters', slug: 'sam', name: 'Sam Tyler' }]);
  assert.deepEqual(r.groupMembers.cid, [{ slug: 'sam', name: 'Sam Tyler' }]);
  assert.deepEqual(r.groupRelations.villains.opposed_to, ['cid']);
});

test("an entity's lists leave out scenes already listed, and itself", () => {
  const r = computeRelationships({
    scenes: [scene('01-a', { characters_in_scene: ['sam'] }, 'Then [[sam]] left.'), scene('02-b', {}, 'About [[sam]].')],
    entities: [{ type: 'characters', slug: 'sam', data: { name: 'Sam' }, body: 'I am [[sam]].' }],
  });
  const lists = entityLists(r, 'characters', 'sam');
  assert.deepEqual(titles(lists.appearsIn), ['A']);
  assert.deepEqual(titles(lists.mentionedIn), ['B']);
  assert.deepEqual(lists.mentionedBy, []);
});

test('Featured In: a story, its arcs and its scenes can each feature an entry', () => {
  const r = computeRelationships({
    stories: [
      { slug: 'one-shot', data: { title: 'One Shot', featuring: { relationships: ['gene-x-sam'] } }, containers: [] },
      {
        slug: 'series',
        data: { title: 'Series' },
        containers: [
          { path: '00_arc-01-first', data: { title: 'First', featuring: { relationships: ['gene-x-sam'] } } },
          { path: '01_arc-02-unpublished', data: { featuring: { relationships: ['gene-x-sam'] } } },
        ],
      },
    ],
    scenes: [
      { storySlug: 'one-shot', slug: '01-a', path: '01-a', data: { status: 'published' }, body: '' },
      { storySlug: 'series', slug: '01-b', path: '00_arc-01-first/01-b', data: { status: 'published', featuring: { relationships: ['gene-x-sam'], artifacts: 'crown' } }, body: '' },
      { storySlug: 'series', slug: '02-c', path: '01_arc-02-unpublished/02-c', data: { status: 'drafting' }, body: '' },
    ],
  });
  const lists = entityLists(r, 'relationships', 'gene-x-sam');
  assert.deepEqual(lists.featuredIn.map((s) => [s.title, s.story, s.containers.map((c) => c.label), titles(s.scenes)]), [
    ['One Shot', true, [], []],
    ['Series', false, ['Arc 1: First'], ['B']],
  ]);
  assert.deepEqual(titles(r.featuredIn.artifacts.crown[0].scenes), ['B']);
});
