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
  const citationGroups = [];
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

      const groupIndex = citationGroups.length + 1;
      const citationId = `citation-${groupIndex}`;
      const referenceId = `citation-ref-${groupIndex}`;
      const entries = citationEntriesFromMarker(part.value);
      citationGroups.push({ id: citationId, referenceId, entries });

      const citation = document.createElement('a');
      citation.href = `#${referenceId}`;
      citation.className = 'source-citation';
      citation.title = citationTitle(part.value);
      citation.id = citationId;
      citation.textContent = '[citation]';
      fragment.append(citation);
    });

    textNode.replaceWith(fragment);
  });

  appendCitationList(root, citationGroups);
}

export function citationEntriesFromMarker(marker) {
  return marker
    .replace(/^\uE200cite\uE202?/, '')
    .replace(/\uE201$/, '')
    .split('\uE202')
    .filter(Boolean)
    .map((id) => ({ id, label: id }));
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
  return citationEntriesFromMarker(marker).map((entry) => entry.label).join(', ');
}

function appendCitationList(root, citationGroups) {
  if (citationGroups.length === 0) {
    return;
  }

  const section = document.createElement('section');
  section.className = 'citation-list';
  section.setAttribute('aria-label', 'Citations');

  const heading = document.createElement('h2');
  heading.textContent = 'Citations';
  section.append(heading);

  const list = document.createElement('ol');

  citationGroups.forEach((group, index) => {
    const item = document.createElement('li');
    item.id = group.referenceId;

    const backLink = document.createElement('a');
    backLink.href = `#${group.id}`;
    backLink.className = 'citation-backlink';
    backLink.textContent = `Citation ${index + 1}`;

    const labels = document.createElement('span');
    labels.className = 'citation-source-list';
    labels.textContent = group.entries.map((entry) => entry.label).join(', ');

    item.append(backLink, document.createTextNode(': '), labels);
    list.append(item);
  });

  section.append(list);
  root.append(section);
}
