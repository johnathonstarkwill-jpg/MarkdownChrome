export function isMarkdownFileUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'file:') {
      return false;
    }

    return /\.(md|markdown)$/i.test(decodeURIComponent(url.pathname));
  } catch {
    return false;
  }
}

export function buildViewerUrl({ extensionBaseUrl, sourceUrl }) {
  const base = extensionBaseUrl.endsWith('/') ? extensionBaseUrl : `${extensionBaseUrl}/`;
  const url = new URL('src/viewer/viewer.html', base);
  url.searchParams.set('source', sourceUrl);
  return url.toString();
}

export function getSourceUrlFromLocation(locationHref) {
  try {
    const url = new URL(locationHref);
    return url.searchParams.get('source') ?? '';
  } catch {
    return '';
  }
}

