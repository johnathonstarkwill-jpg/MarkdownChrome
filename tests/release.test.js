import test from 'node:test';
import assert from 'node:assert/strict';

import { getReleaseEntries, getReleaseZipName } from '../scripts/build-release.js';

test('release package includes only production extension assets', () => {
  assert.deepEqual(getReleaseEntries(), [
    'manifest.json',
    'src',
    'vendor',
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-128.png',
  ]);
});

test('release zip name includes manifest version', () => {
  assert.equal(getReleaseZipName('0.1.0'), 'markdown-chrome-0.1.0.zip');
});
