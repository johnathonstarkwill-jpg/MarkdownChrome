import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'manifest.json',
  'src/background/service-worker.js',
  'src/content/file-detector.js',
  'src/shared/file-url.js',
  'src/viewer/export.js',
  'src/viewer/citations.js',
  'src/viewer/file-access.js',
  'src/viewer/file-refresh.js',
  'src/viewer/markdown-actions.js',
  'src/viewer/viewer.html',
  'src/viewer/viewer.css',
  'src/viewer/viewer.js',
  'vendor/marked.min.js',
  'vendor/katex.min.css',
  'vendor/katex.min.js',
  'vendor/auto-render.min.js',
  'vendor/beautiful-mermaid.min.js',
  'vendor/mermaid.min.js',
];

for (const file of requiredFiles) {
  await access(file);
}

const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.action.default_title, 'Open Markdown Chrome');
assert.equal(manifest.background.service_worker, 'src/background/service-worker.js');
assert.equal(manifest.content_scripts[0].js[0], 'src/content/file-detector.js');
assert.equal(manifest.content_scripts[0].matches[0], 'file:///*');
assert.equal(manifest.host_permissions[0], 'file:///*');

const html = await readFile('src/viewer/viewer.html', 'utf8');
const css = await readFile('src/viewer/viewer.css', 'utf8');
assert.match(html, /vendor\/marked\.min\.js/);
assert.match(html, /vendor\/katex\.min\.css/);
assert.match(html, /vendor\/katex\.min\.js/);
assert.match(html, /vendor\/auto-render\.min\.js/);
assert.match(html, /vendor\/beautiful-mermaid\.min\.js/);
assert.match(html, /vendor\/mermaid\.min\.js/);
assert.match(html, /type="module" src="\.\/viewer\.js"/);
assert.match(html, /openFolderButton/);
assert.match(html, /toggleFilesButton/);
assert.match(html, /refreshButton/);
assert.match(html, /revealSidebarButton/);
assert.match(html, /sidebarResizeHandle/);
assert.match(html, /themeToggleButton/);
assert.match(html, /exportHtmlButton/);
assert.match(html, /data-markdown-action="mermaid"/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /word-break:\s*break-word/);
assert.match(css, /--sidebar-width/);
assert.match(css, /\[data-theme="dark"\]/);

const viewerJs = await readFile('src/viewer/viewer.js', 'utf8');
assert.match(viewerJs, /showOpenFilePicker/);
assert.match(viewerJs, /showDirectoryPicker/);
assert.match(viewerJs, /writeTextToHandle/);
assert.match(viewerJs, /scheduleAutoSave/);
assert.match(viewerJs, /mermaid\.run/);
assert.match(viewerJs, /BeautifulMermaid/);
assert.match(viewerJs, /isBeautifulMermaidSupported/);
assert.match(viewerJs, /renderMathInElement/);
assert.match(viewerJs, /renderCitationMarkers/);
assert.match(viewerJs, /refreshCurrentSource/);
assert.match(viewerJs, /downloadHtmlDocument/);
assert.match(viewerJs, /printHtmlDocument/);
assert.match(viewerJs, /setTheme/);
assert.match(viewerJs, /startSidebarResize/);

const fileAccessJs = await readFile('src/viewer/file-access.js', 'utf8');
assert.match(fileAccessJs, /createWritable/);
assert.match(fileAccessJs, /requestPermission/);

console.log(`Static extension verification passed for ${requiredFiles.length} files.`);
