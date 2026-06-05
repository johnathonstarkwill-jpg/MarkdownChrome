import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildViewerUrl,
  getSourceUrlFromLocation,
  isMarkdownFileUrl,
} from '../src/shared/file-url.js';

test('detects local markdown file URLs', () => {
  assert.equal(isMarkdownFileUrl('file:///Users/me/notes/readme.md'), true);
  assert.equal(isMarkdownFileUrl('file:///Users/me/notes/spec.markdown'), true);
  assert.equal(isMarkdownFileUrl('file:///Users/me/notes/README.MD#intro'), true);
  assert.equal(isMarkdownFileUrl('file:///Users/me/notes/readme.md?download=1'), true);
});

test('rejects non-markdown and non-file URLs', () => {
  assert.equal(isMarkdownFileUrl('file:///Users/me/notes/readme.txt'), false);
  assert.equal(isMarkdownFileUrl('https://example.com/readme.md'), false);
  assert.equal(isMarkdownFileUrl('chrome-extension://abc/viewer.html'), false);
  assert.equal(isMarkdownFileUrl('not a url'), false);
});

test('builds extension viewer URL with encoded source', () => {
  const sourceUrl = 'file:///Users/me/My Notes/readme.md#section';
  const viewerUrl = buildViewerUrl({
    extensionBaseUrl: 'chrome-extension://abc123/',
    sourceUrl,
  });

  const parsed = new URL(viewerUrl);
  assert.equal(parsed.protocol, 'chrome-extension:');
  assert.equal(parsed.host, 'abc123');
  assert.equal(parsed.pathname, '/src/viewer/viewer.html');
  assert.equal(parsed.searchParams.get('source'), sourceUrl);
});

test('reads source URL from viewer location', () => {
  assert.equal(
    getSourceUrlFromLocation(
      'chrome-extension://abc123/src/viewer/viewer.html?source=file%3A%2F%2F%2FUsers%2Fme%2Freadme.md',
    ),
    'file:///Users/me/readme.md',
  );
  assert.equal(getSourceUrlFromLocation('chrome-extension://abc123/src/viewer/viewer.html'), '');
});
