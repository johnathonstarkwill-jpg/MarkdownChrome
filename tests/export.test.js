import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExportHtml, defaultExportName } from '../src/viewer/export.js';

test('builds a complete standalone HTML export document', () => {
  const html = buildExportHtml({
    title: 'README.md',
    bodyHtml: '<h1>Readme</h1><div class="mermaid"><svg></svg></div>',
    styles: '.markdown-body { color: #111; }',
  });

  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<title>README.md<\/title>/);
  assert.match(html, /<main class="markdown-body">/);
  assert.match(html, /<h1>Readme<\/h1>/);
  assert.match(html, /\.markdown-body \{ color: #111; \}/);
});

test('escapes export titles', () => {
  const html = buildExportHtml({
    title: '<script>alert(1)</script>.md',
    bodyHtml: '<p>ok</p>',
    styles: '',
  });

  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;.md/);
  assert.doesNotMatch(html, /<title><script>/);
});

test('creates default export names from markdown filenames', () => {
  assert.equal(defaultExportName('README.md', 'html'), 'README.html');
  assert.equal(defaultExportName('guide.markdown', 'pdf'), 'guide.pdf');
  assert.equal(defaultExportName('Untitled', 'html'), 'Untitled.html');
});

