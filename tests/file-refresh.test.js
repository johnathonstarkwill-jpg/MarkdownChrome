import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createFileSnapshot,
  isMissingFileError,
} from '../src/viewer/file-refresh.js';

test('creates a comparable file snapshot', () => {
  const snapshot = createFileSnapshot({ name: 'notes.md', lastModified: 12, size: 42 });

  assert.deepEqual(snapshot, {
    name: 'notes.md',
    lastModified: 12,
    size: 42,
  });
});

test('detects missing file system access errors', () => {
  assert.equal(isMissingFileError({ name: 'NotFoundError', message: '' }), true);
  assert.equal(
    isMissingFileError({ name: 'Error', message: 'A requested file or directory could not be found.' }),
    true,
  );
  assert.equal(isMissingFileError({ name: 'SecurityError', message: 'Permission denied' }), false);
});
