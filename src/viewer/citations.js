const citationPattern = /\uE200cite(?:\uE202[^\uE200\uE201\uE202]+)+\uE201/g;
const skippedTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'KBD']);

export function splitCitationMarkers(text) {
  citationPattern.lastIndex = 0;

  const parts = [];
  let lastIndex = 0;
  let match = citationPattern.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    parts.push({ type: 'citation', value: match[0] });
    lastIndex = match.index + match[0].length;
    match = citationPattern.exec(text);
  }

  if (lastIndex < text.length || parts.length === 0) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

export function renderCitationMarkers(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!citationPattern.test(node.nodeValue)) {
        citationPattern.lastIndex = 0;
        return NodeFilter.FILTER_REJECT;
      }
      citationPattern.lastIndex = 0;

      if (hasSkippedAncestor(node)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    splitCitationMarkers(textNode.nodeValue).forEach((part) => {
      if (part.type === 'text') {
        fragment.append(document.createTextNode(part.value));
        return;
      }

      const citation = document.createElement('sup');
      citation.className = 'source-citation';
      citation.title = citationTitle(part.value);
      citation.textContent = '[citation]';
      fragment.append(citation);
    });

    textNode.replaceWith(fragment);
  });
}

function hasSkippedAncestor(node) {
  let current = node.parentElement;
  while (current) {
    if (skippedTags.has(current.tagName)) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function citationTitle(marker) {
  return marker
    .replace(/^\uE200cite\uE202?/, '')
    .replace(/\uE201$/, '')
    .split('\uE202')
    .filter(Boolean)
    .join(', ');
}
