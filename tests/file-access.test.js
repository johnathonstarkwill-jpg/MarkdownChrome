import test from 'node:test';
import assert from 'node:assert/strict';

import {
  chooseMarkdownDirectory,
  chooseMarkdownFile,
  collectMarkdownFileHandles,
  readFileHandleText,
  requestWritePermission,
  writeTextToHandle,
} from '../src/viewer/file-access.js';

test('chooses a markdown file handle with markdown filters', async () => {
  const expectedHandle = { name: 'notes.md' };
  let pickerOptions = null;

  const handle = await chooseMarkdownFile(async (options) => {
    pickerOptions = options;
    return [expectedHandle];
  });

  assert.equal(handle, expectedHandle);
  assert.equal(pickerOptions.multiple, false);
  assert.deepEqual(pickerOptions.types[0].accept['text/markdown'], ['.md', '.markdown']);
});

test('chooses a markdown directory handle', async () => {
  const expectedHandle = { name: 'docs' };

  const handle = await chooseMarkdownDirectory(async () => expectedHandle);

  assert.equal(handle, expectedHandle);
});

test('collects markdown files from nested directory handles', async () => {
  const root = directoryHandle('root', {
    'README.md': fileHandle('README.md', '# Readme'),
    'notes.txt': fileHandle('notes.txt', 'ignore'),
    docs: directoryHandle('docs', {
      'guide.markdown': fileHandle('guide.markdown', '# Guide'),
      assets: directoryHandle('assets', {
        'diagram.MD': fileHandle('diagram.MD', '# Diagram'),
      }),
    }),
  });

  const files = await collectMarkdownFileHandles(root);

  assert.deepEqual(
    files.map((file) => file.path),
    ['docs/assets/diagram.MD', 'docs/guide.markdown', 'README.md'],
  );
  assert.equal(files[0].handle.name, 'diagram.MD');
});

test('reads text from a file handle', async () => {
  const text = await readFileHandleText(fileHandle('README.md', '# Readme'));

  assert.equal(text, '# Readme');
});

test('uses existing write permission without prompting', async () => {
  let requestCount = 0;
  const handle = {
    async queryPermission(options) {
      assert.deepEqual(options, { mode: 'readwrite' });
      return 'granted';
    },
    async requestPermission() {
      requestCount += 1;
      return 'denied';
    },
  };

  assert.equal(await requestWritePermission(handle), true);
  assert.equal(requestCount, 0);
});

test('requests write permission when existing permission is not granted', async () => {
  const handle = {
    async queryPermission() {
      return 'prompt';
    },
    async requestPermission(options) {
      assert.deepEqual(options, { mode: 'readwrite' });
      return 'granted';
    },
  };

  assert.equal(await requestWritePermission(handle), true);
});

test('writes text to a writable file handle', async () => {
  const calls = [];
  const handle = {
    async queryPermission() {
      calls.push('query');
      return 'granted';
    },
    async requestPermission() {
      calls.push('request');
      return 'denied';
    },
    async createWritable() {
      calls.push('createWritable');
      return {
        async write(text) {
          calls.push(['write', text]);
        },
        async close() {
          calls.push('close');
        },
      };
    },
  };

  await writeTextToHandle(handle, '# Updated\n');

  assert.deepEqual(calls, ['query', 'createWritable', ['write', '# Updated\n'], 'close']);
});

test('does not create a writable stream when write permission is denied', async () => {
  const handle = {
    async queryPermission() {
      return 'prompt';
    },
    async requestPermission() {
      return 'denied';
    },
    async createWritable() {
      throw new Error('createWritable should not be called');
    },
  };

  await assert.rejects(
    () => writeTextToHandle(handle, '# Updated\n'),
    /Write permission was not granted/,
  );
});

function fileHandle(name, text) {
  return {
    kind: 'file',
    name,
    async getFile() {
      return {
        name,
        async text() {
          return text;
        },
      };
    },
  };
}

function directoryHandle(name, entries) {
  return {
    kind: 'directory',
    name,
    async *entries() {
      for (const [entryName, handle] of Object.entries(entries)) {
        yield [entryName, handle];
      }
    },
  };
}
