import test from 'node:test';
import assert from 'node:assert/strict';

import { citationEntriesFromMarker, splitCitationMarkers } from '../src/viewer/citations.js';

test('splits ChatGPT-style citation markers out of normal text', () => {
  assert.deepEqual(
    splitCitationMarkers('Reference citeturn7view2turn13view0 is here.'),
    [
      { type: 'text', value: 'Reference ' },
      { type: 'citation', value: 'citeturn7view2turn13view0' },
      { type: 'text', value: ' is here.' },
    ],
  );
});

test('returns a single text part when no citation marker exists', () => {
  assert.deepEqual(splitCitationMarkers('No citations here.'), [
    { type: 'text', value: 'No citations here.' },
  ]);
});

test('extracts linkable citation entries from a marker', () => {
  assert.deepEqual(citationEntriesFromMarker('citeturn7view2turn13view0'), [
    { id: 'turn7view2', label: 'turn7view2' },
    { id: 'turn13view0', label: 'turn13view0' },
  ]);
});
