// Short-name auto-linking (D-160, layer 1). Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { autoLinkShortNames, resolveWikiLinks } from './wikiLinks.mjs';

const index = {
  peter: { name: 'Peter McDonnell', short_name: 'Peter', urlPrefix: 'characters' },
  sue: { name: 'Sue Rufus', short_name: 'Sue', urlPrefix: 'characters' },
  'sue-rufus-sr': { name: 'Sue Rufus Sr', short_name: 'Sue Rufus', urlPrefix: 'characters' },
  station: { name: 'Moon Base Delta', short_name: 'the Station', urlPrefix: 'places' },
  rats: { name: 'Station Rats', urlPrefix: 'groups' },
  'li-a': { name: 'Li A', short_name: 'Li', urlPrefix: 'characters' },
  'li-b': { name: 'Li B', short_name: 'Li', urlPrefix: 'characters' },
  nobody: { name: 'No Short Name', urlPrefix: 'characters' },
};
const link = (text) => autoLinkShortNames(text, index);

test('links only the first mention, as a whole word with matching capitals', () => {
  assert.equal(link('Peter met Peter. Peterson waved.'), '[[peter|Peter]] met Peter. Peterson waved.');
  assert.equal(link('They will sue. Then Sue.'), 'They will sue. Then [[sue|Sue]].');
  assert.equal(link('the station, then the Station.'), 'the station, then [[station|the Station]].');
});

test("keeps what follows the name, e.g. a possessive", () => {
  assert.equal(link("Peter's ship."), "[[peter|Peter]]'s ship.");
});

test('an existing [[…]] link counts as the first mention', () => {
  assert.equal(link('[[peter|the Captain]] spoke; Peter listened.'), '[[peter|the Captain]] spoke; Peter listened.');
});

test('never inside links, markdown links, images, code or HTML', () => {
  assert.equal(
    link('`Peter` [Peter](http://x) ![Peter](p.png) [[image:peter.png|Peter]] <b title="Peter">x</b> Peter'),
    '`Peter` [Peter](http://x) ![Peter](p.png) [[image:peter.png|Peter]] <b title="Peter">x</b> [[peter|Peter]]',
  );
});

test('a longer short name is placed before one inside it', () => {
  assert.equal(link('Sue Rufus came; later Sue left.'), '[[sue-rufus-sr|Sue Rufus]] came; later [[sue|Sue]] left.');
});

test('a shared short name links neither, and is reported', () => {
  const clashes = [];
  const out = autoLinkShortNames('Li waved.', index, { onClash: (name, slugs) => clashes.push([name, slugs]) });
  assert.equal(out, 'Li waved.');
  assert.deepEqual(clashes, [['Li', ['li-a', 'li-b']]]);
});

test('auto-links resolve like any other link', () => {
  const html = resolveWikiLinks(link('Peter waved.'), { project: 'ff', entityIndex: index });
  assert.equal(html, '<a href="/ff/characters/peter" class="wiki-link" data-entity="peter">Peter</a> waved.');
});

test('never where it overlaps a longer name', () => {
  assert.equal(link('the way the Station Rats had; then the Station.'), 'the way the Station Rats had; then [[station|the Station]].');
  assert.equal(link('Peter McDonnell arrived. Peter sat.'), 'Peter McDonnell arrived. [[peter|Peter]] sat.');
});

// ─── Layer 2: alias suggestions ───────────────────────────────────────────
import { findAliasSuggestions } from './wikiLinks.mjs';

const targets = [
  { slug: 'peter', name: 'Peter McDonnell', shortName: 'Peter', aliases: ['Captain', 'Cap', 'Pete'] },
  { slug: 'jim', name: 'James McDonnell', shortName: 'Jim', aliases: ['Old Cap', 'Dad', 'Captain'] },
  { slug: 'qordashi', name: 'Qordashi Monastery', shortName: 'Qordashi', aliases: ['Qordashi', 'The Vault'] },
];
const suggest = (text, plainNames) =>
  findAliasSuggestions(text, targets, { plainNames }).map(({ alias, slugs, from }) => [alias, slugs, text.slice(from, from + alias.length)]);

test('marks the first unlinked use of each alias, with every entity that has it', () => {
  assert.deepEqual(suggest('Pete ran. Pete ran again. "Captain!" Dad called.'), [
    ['Pete', ['peter'], 'Pete'],
    ['Captain', ['peter', 'jim'], 'Captain'],
    ['Dad', ['jim'], 'Dad'],
  ]);
});

test('whole words with matching capitals', () => {
  assert.deepEqual(suggest('Peterson saw a cap and a dad.'), []);
});

test('never inside a longer name, short name or alias', () => {
  assert.deepEqual(suggest('Old Cap waved.'), [['Old Cap', ['jim'], 'Old Cap']]);
  assert.deepEqual(suggest('Old Cap waved; Cap nodded.'), [
    ['Old Cap', ['jim'], 'Old Cap'],
    ['Cap', ['peter'], 'Cap'],
  ]);
});

test('an alias already linked in the scene, or left plain, is not marked again', () => {
  assert.deepEqual(suggest('[[peter|Pete]] ran. Pete ran again.'), []);
  assert.deepEqual(suggest('Pete ran. Dad called.', ['Pete']), [['Dad', ['jim'], 'Dad']]);
});

test("never inside links or code; an alias that is the entity's own short name isn't offered", () => {
  assert.deepEqual(suggest('`Pete` [[jim|Dad]] Qordashi and The Vault.'), [['The Vault', ['qordashi'], 'The Vault']]);
});

// Links to another project's entities (D-164).
const otherProject = (slug) =>
  slug === 'dragons-grail' ? { title: "Dragon's Grail", entityIndex: { traz: { name: 'Traz the Bold', short_name: 'Traz', urlPrefix: 'characters' } } } : null;
const resolve = (text) => resolveWikiLinks(text, { project: 'family-feuds', entityIndex: index, otherProject });

test('[[project/slug]] links to the other project, saying which', () => {
  assert.equal(
    resolve('[[dragons-grail/traz]]'),
    `<a href="/dragons-grail/characters/traz" class="wiki-link" data-entity="traz" data-project-name="Dragon's Grail">Traz</a>`,
  );
  assert.match(resolve('[[dragons-grail/traz|the dragon]]'), />the dragon<\/a>$/);
});

test('[[project/slug]] with no such project or entity is a "not yet" link', () => {
  assert.match(resolve('[[nowhere/traz]]'), /^<a class="unresolved"/);
  assert.match(resolve('[[dragons-grail/nobody]]'), /^<a class="unresolved".*>nobody<\/a>$/);
  assert.match(resolveWikiLinks('[[dragons-grail/traz]]', { project: 'family-feuds', entityIndex: index }), /^<a class="unresolved"/);
});

test('[[own-project/slug]] works like [[slug]], with no "From" note', () => {
  assert.equal(resolve('[[family-feuds/peter]]'), '<a href="/family-feuds/characters/peter" class="wiki-link" data-entity="peter">Peter</a>');
});
