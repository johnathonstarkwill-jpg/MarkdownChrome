import test from 'node:test';
import assert from 'node:assert/strict';

import { applyMarkdownAction, MARKDOWN_ACTIONS } from '../src/viewer/markdown-actions.js';

test('wraps selected text for bold and italic actions', () => {
  assert.deepEqual(applyMarkdownAction('hello world', 0, 5, MARKDOWN_ACTIONS.bold), {
    value: '**hello** world',
    selectionStart: 2,
    selectionEnd: 7,
  });

  assert.deepEqual(applyMarkdownAction('hello world', 6, 11, MARKDOWN_ACTIONS.italic), {
    value: 'hello *world*',
    selectionStart: 7,
    selectionEnd: 12,
  });
});

test('inserts default text when there is no selection', () => {
  assert.deepEqual(applyMarkdownAction('', 0, 0, MARKDOWN_ACTIONS.heading2), {
    value: '## Heading',
    selectionStart: 3,
    selectionEnd: 10,
  });
});

test('prefixes each selected line for quote and list actions', () => {
  assert.deepEqual(applyMarkdownAction('one\ntwo', 0, 7, MARKDOWN_ACTIONS.quote).value, '> one\n> two');
  assert.deepEqual(applyMarkdownAction('one\ntwo', 0, 7, MARKDOWN_ACTIONS.bulletedList).value, '- one\n- two');
});

test('inserts link, table, code block, and mermaid snippets', () => {
  assert.match(applyMarkdownAction('', 0, 0, MARKDOWN_ACTIONS.link).value, /^\[link text\]\(https:\/\/example.com\)$/);
  assert.match(applyMarkdownAction('', 0, 0, MARKDOWN_ACTIONS.table).value, /\| Column A \| Column B \|/);
  assert.match(applyMarkdownAction('', 0, 0, MARKDOWN_ACTIONS.codeBlock).value, /^```text\ncode\n```$/);
  assert.match(applyMarkdownAction('', 0, 0, MARKDOWN_ACTIONS.mermaid).value, /^```mermaid\ngraph TD/);
});

