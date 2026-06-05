export function buildExportHtml({ title, bodyHtml, styles }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        background: #fff;
        color: #1d2430;
        font: 14px/1.6 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .markdown-body {
        max-width: 920px;
        margin: 0 auto;
        padding: 32px;
      }
      ${styles}
    </style>
  </head>
  <body>
    <main class="markdown-body">
      ${bodyHtml}
    </main>
  </body>
</html>`;
}

export function defaultExportName(fileName, extension) {
  const base = fileName.replace(/\.(md|markdown)$/i, '') || 'document';
  return `${base}.${extension}`;
}

export function downloadHtmlDocument({ document, fileName, windowObject = window }) {
  const blob = new Blob([document], { type: 'text/html;charset=utf-8' });
  const url = windowObject.URL.createObjectURL(blob);
  const anchor = windowObject.document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  windowObject.setTimeout(() => windowObject.URL.revokeObjectURL(url), 0);
}

export function printHtmlDocument({ document, windowObject = window }) {
  const printWindow = windowObject.open('', '_blank');
  if (!printWindow) {
    throw new Error('Print window was blocked.');
  }

  printWindow.document.open();
  printWindow.document.write(document);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

