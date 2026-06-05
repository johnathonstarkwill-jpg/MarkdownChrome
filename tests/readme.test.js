import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('README includes a real mermaid block that the viewer can render', async () => {
  const readme = await readFile('README.md', 'utf8');
  const mermaidBlockStart = readme.indexOf('```mermaid');
  const wrapperStart = readme.lastIndexOf('````markdown', mermaidBlockStart);
  const wrapperEnd = readme.indexOf('````', mermaidBlockStart);

  assert.notEqual(mermaidBlockStart, -1);
  assert.equal(
    wrapperStart !== -1 && wrapperEnd !== -1 && wrapperStart < mermaidBlockStart && mermaidBlockStart < wrapperEnd,
    false,
  );
});

