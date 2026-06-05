import test from 'node:test';
import assert from 'node:assert/strict';

import { toggleMarkdownTaskAtIndex } from '../src/viewer/task-list.js';

test('toggles unchecked and checked Markdown task items by rendered index', () => {
  const markdown = ['# Tasks', '', '- [ ] Write draft', '- [x] Review notes'].join('\n');

  assert.equal(
    toggleMarkdownTaskAtIndex(markdown, 0),
    ['# Tasks', '', '- [x] Write draft', '- [x] Review notes'].join('\n'),
  );

  assert.equal(
    toggleMarkdownTaskAtIndex(markdown, 1),
    ['# Tasks', '', '- [ ] Write draft', '- [ ] Review notes'].join('\n'),
  );
});

test('toggles nested task items and ignores non-task list items', () => {
  const markdown = ['- [ ] Parent', '  - plain child', '  - [ ] Nested', '- done text'].join('\n');

  assert.equal(
    toggleMarkdownTaskAtIndex(markdown, 1),
    ['- [ ] Parent', '  - plain child', '  - [x] Nested', '- done text'].join('\n'),
  );
});

test('returns original Markdown when rendered task index is not found', () => {
  const markdown = '- [ ] Only task';

  assert.equal(toggleMarkdownTaskAtIndex(markdown, 4), markdown);
});
