export const MARKDOWN_ACTIONS = {
  heading2: { type: 'wrap', before: '## ', after: '', placeholder: 'Heading' },
  bold: { type: 'wrap', before: '**', after: '**', placeholder: 'bold text' },
  italic: { type: 'wrap', before: '*', after: '*', placeholder: 'italic text' },
  link: { type: 'wrap', before: '[', after: '](https://example.com)', placeholder: 'link text' },
  quote: { type: 'prefix-lines', prefix: '> ', placeholder: 'quote' },
  bulletedList: { type: 'prefix-lines', prefix: '- ', placeholder: 'list item' },
  numberedList: { type: 'number-lines', placeholder: 'list item' },
  codeBlock: { type: 'snippet', snippet: '```text\ncode\n```', selectStart: 8, selectEnd: 12 },
  table: {
    type: 'snippet',
    snippet: '| Column A | Column B |\n| --- | --- |\n| Value A | Value B |',
    selectStart: 2,
    selectEnd: 10,
  },
  mermaid: {
    type: 'snippet',
    snippet: '```mermaid\ngraph TD\n  A[Start] --> B[End]\n```',
    selectStart: 18,
    selectEnd: 26,
  },
};

export function applyMarkdownAction(value, selectionStart, selectionEnd, action) {
  if (action.type === 'prefix-lines') {
    return replaceSelection(value, selectionStart, selectionEnd, prefixLines(selectedText(), action.prefix));
  }

  if (action.type === 'number-lines') {
    return replaceSelection(value, selectionStart, selectionEnd, numberLines(selectedText() || action.placeholder));
  }

  if (action.type === 'snippet') {
    const result = replaceSelection(value, selectionStart, selectionEnd, action.snippet);
    return {
      ...result,
      selectionStart: selectionStart + action.selectStart,
      selectionEnd: selectionStart + action.selectEnd,
    };
  }

  const original = selectedText() || action.placeholder;
  const replacement = `${action.before}${original}${action.after}`;
  const result = replaceSelection(value, selectionStart, selectionEnd, replacement);

  return {
    ...result,
    selectionStart: selectionStart + action.before.length,
    selectionEnd: selectionStart + action.before.length + original.length,
  };

  function selectedText() {
    return value.slice(selectionStart, selectionEnd);
  }
}

function replaceSelection(value, selectionStart, selectionEnd, replacement) {
  return {
    value: `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`,
    selectionStart,
    selectionEnd: selectionStart + replacement.length,
  };
}

function prefixLines(text, prefix) {
  return (text || '').split('\n').map((line) => `${prefix}${line}`).join('\n');
}

function numberLines(text) {
  return text.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
}

