import assert from 'node:assert/strict';
import { test } from 'node:test';
import { slugify, uniqueSlug } from './slug.js';

test('slugify quita acentos y espacios', () => {
  assert.equal(slugify('Lámpara de mesa'), 'lampara-de-mesa');
  assert.equal(slugify('Taza de gres'), 'taza-de-gres');
  assert.equal(slugify('¡Hola, mundo!'), 'hola-mundo');
  assert.equal(slugify('***'), 'item');
  assert.equal(slugify('***', 'producto'), 'producto');
});

test('uniqueSlug evita choques', () => {
  const taken = new Set(['taza', 'taza-2']);
  assert.equal(uniqueSlug('taza', taken), 'taza-3');
  assert.equal(uniqueSlug('manta', taken), 'manta');
});
