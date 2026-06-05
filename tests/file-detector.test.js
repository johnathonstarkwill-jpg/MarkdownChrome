import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = await readFile('src/content/file-detector.js', 'utf8');

function runDetector(href) {
  let redirectedTo = '';

  const context = {
    URL,
    chrome: {
      runtime: {
        getURL(path) {
          return `chrome-extension://abc123/${path}`;
        },
      },
    },
    window: {
      location: {
        href,
        replace(nextUrl) {
          redirectedTo = nextUrl;
        },
      },
    },
  };

  vm.runInNewContext(script, context);
  return redirectedTo;
}

test('redirects local markdown files to the extension viewer', () => {
  const redirectedTo = runDetector('file:///Users/me/My Notes/demo.md#intro');
  const parsed = new URL(redirectedTo);

  assert.equal(parsed.protocol, 'chrome-extension:');
  assert.equal(parsed.host, 'abc123');
  assert.equal(parsed.pathname, '/src/viewer/viewer.html');
  assert.equal(parsed.searchParams.get('source'), 'file:///Users/me/My Notes/demo.md#intro');
});

test('does not redirect non-markdown files', () => {
  assert.equal(runDetector('file:///Users/me/My Notes/demo.txt'), '');
});

