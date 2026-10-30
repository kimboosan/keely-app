import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneNotesField } from './sceneFields.mjs';

test('a scene with no notes gets the current spelling', () => {
  assert.equal(sceneNotesField({ title: 'x' }), 'author_notes');
  assert.equal(sceneNotesField(undefined), 'author_notes');
});

test('the old spelling is used only when it is the one there', () => {
  assert.equal(sceneNotesField({ authors_notes: { top: 'a' } }), 'authors_notes');
  assert.equal(sceneNotesField({ author_notes: { top: 'a' } }), 'author_notes');
  assert.equal(sceneNotesField({ author_notes: { top: 'a' }, authors_notes: { top: 'b' } }), 'author_notes');
});
