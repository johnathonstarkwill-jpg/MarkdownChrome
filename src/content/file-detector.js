const MARKDOWN_FILE_PATTERN = /\.(md|markdown)$/i;

function isMarkdownFileUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'file:' && MARKDOWN_FILE_PATTERN.test(decodeURIComponent(url.pathname));
  } catch {
    return false;
  }
}

if (isMarkdownFileUrl(window.location.href)) {
  const viewerUrl = new URL(chrome.runtime.getURL('src/viewer/viewer.html'));
  viewerUrl.searchParams.set('source', window.location.href);
  window.location.replace(viewerUrl.toString());
}

