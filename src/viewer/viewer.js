import { getSourceUrlFromLocation } from '../shared/file-url.js';
import {
  chooseMarkdownDirectory,
  chooseMarkdownFile,
  collectMarkdownFileHandles,
  readFileHandleText,
  writeTextToHandle,
} from './file-access.js';
import { buildExportHtml, defaultExportName, downloadHtmlDocument, printHtmlDocument } from './export.js';
import { applyMarkdownAction, MARKDOWN_ACTIONS } from './markdown-actions.js';
import { renderCitationMarkers } from './citations.js';
import { toggleMarkdownTaskAtIndex } from './task-list.js';
import { isMissingFileError } from './file-refresh.js';

const editor = document.querySelector('#editor');
const preview = document.querySelector('#preview');
const statusLabel = document.querySelector('#status');
const fileNameLabel = document.querySelector('#fileName');
const appLayout = document.querySelector('#appLayout');
const workspace = document.querySelector('#workspace');
const newButton = document.querySelector('#newButton');
const openButton = document.querySelector('#openButton');
const openFolderButton = document.querySelector('#openFolderButton');
const toggleFilesButton = document.querySelector('#toggleFilesButton');
const refreshButton = document.querySelector('#refreshButton');
const saveButton = document.querySelector('#saveButton');
const exportHtmlButton = document.querySelector('#exportHtmlButton');
const exportPdfButton = document.querySelector('#exportPdfButton');
const themeToggleButton = document.querySelector('#themeToggleButton');
const autosaveToggle = document.querySelector('#autosaveToggle');
const fileTree = document.querySelector('#fileTree');
const folderNameLabel = document.querySelector('#folderName');
const toggleSidebarButton = document.querySelector('#toggleSidebarButton');
const revealSidebarButton = document.querySelector('#revealSidebarButton');
const sidebarResizeHandle = document.querySelector('#sidebarResizeHandle');
const markdownToolbar = document.querySelector('.markdown-toolbar');
const modeButtons = Array.from(document.querySelectorAll('.mode-button'));

let fileHandle = null;
let workspaceDirectoryHandle = null;
let workspaceFiles = [];
let activeWorkspacePath = '';
let sourceUrl = getSourceUrlFromLocation(window.location.href);
let sourceTextSnapshot = '';
let lastFileSnapshot = null;
let hasUnsavedChanges = false;
let renderTimer = 0;
let mermaidTimer = 0;
let autoSaveTimer = 0;

initialize();

function initialize() {
  setTheme(localStorage.getItem('markdownChromeTheme') || 'light');
  configureMarkdown();
  configureMermaid();
  bindEvents();

  if (sourceUrl) {
    setFileNameFromUrl(sourceUrl);
    loadFromSourceUrl(sourceUrl);
  } else {
    editor.value = '# Markdown Chrome\n\nOpen a Markdown file to begin.\n\n```mermaid\ngraph TD\n  A[Edit Markdown] --> B[Render Preview]\n  B --> C[Save File]\n```\n';
    renderNow();
  }
}

function configureMarkdown() {
  if (!window.marked) {
    setStatus('Marked is not loaded. Preview is unavailable.');
    return;
  }

  window.marked.use({
    gfm: true,
    breaks: false,
  });
}

function configureMermaid() {
  if (!window.mermaid) {
    return;
  }

  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'default',
  });
}

function confirmDiscardLocalChanges() {
  return window.confirm('You have unsaved changes. Do you want to discard them?');
}

function bindEvents() {
  editor.addEventListener('input', () => {
    hasUnsavedChanges = true;
    setStatus('Unsaved changes');
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderNow, 120);
    scheduleAutoSave();
  });

  newButton.addEventListener('click', newFile);
  openButton.addEventListener('click', openFileWithPicker);
  openFolderButton.addEventListener('click', openFolderWithPicker);
  toggleFilesButton.addEventListener('click', toggleSidebar);
  refreshButton.addEventListener('click', refreshCurrentSource);
  saveButton.addEventListener('click', () => saveToWritableFile());
  exportHtmlButton.addEventListener('click', exportHtml);
  exportPdfButton.addEventListener('click', exportPdf);
  themeToggleButton.addEventListener('click', toggleTheme);
  toggleSidebarButton.addEventListener('click', toggleSidebar);
  revealSidebarButton.addEventListener('click', () => setSidebarCollapsed(false));
  sidebarResizeHandle.addEventListener('pointerdown', startSidebarResize);
  markdownToolbar.addEventListener('click', applyToolbarAction);
  fileTree.addEventListener('click', handleFileTreeClick);
  preview.addEventListener('change', handlePreviewTaskToggle);
  document.addEventListener('dragover', handleMarkdownDragOver);
  document.addEventListener('dragleave', handleMarkdownDragLeave);
  document.addEventListener('drop', handleMarkdownDrop);

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      newFile();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveToWritableFile();
    }
  });
}

async function loadFromSourceUrl(url) {
  setStatus('Loading file URL...');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    editor.value = await response.text();
    setStatus('Loaded. Choose Save once to grant write access.');
    renderNow();
  } catch (error) {
    setStatus(`Cannot read file URL. Enable file URL access or use Open. ${error.message}`);
    renderNow();
  }
}

async function openFileWithPicker() {
  if (!window.showOpenFilePicker) {
    setStatus('This Chrome version does not expose the File System Access API.');
    return;
  }

  try {
    fileHandle = await chooseMarkdownFile(window.showOpenFilePicker);
    const file = await fileHandle.getFile();
    editor.value = await readFileHandleText(fileHandle);
    fileNameLabel.textContent = file.name;
    workspaceDirectoryHandle = null;
    clearWorkspaceFiles();
    sourceUrl = '';
    sourceTextSnapshot = '';
    lastFileSnapshot = null;
    hasUnsavedChanges = false;
    setStatus('Loaded with write access');
    renderNow();
  } catch (error) {
    if (error.name !== 'AbortError') {
      setStatus(`Open failed: ${error.message}`);
    }
  }
}

async function openFolderWithPicker() {
  if (!window.showDirectoryPicker) {
    setStatus('This Chrome version does not expose folder access.');
    return;
  }

  try {
    const directoryHandle = await chooseMarkdownDirectory(window.showDirectoryPicker);
    workspaceFiles = await collectMarkdownFileHandles(directoryHandle);
    activeWorkspacePath = '';
    folderNameLabel.textContent = directoryHandle.name;
    setSidebarCollapsed(false);
    renderFileTree();

    if (workspaceFiles.length === 0) {
      setStatus('No Markdown files found in this folder.');
      return;
    }

    await openWorkspaceFile(workspaceFiles[0].path);
  } catch (error) {
    if (error.name !== 'AbortError') {
      setStatus(`Open folder failed: ${error.message}`);
    }
  }
}

async function newFile() {
  if (!window.showSaveFilePicker) {
    setStatus('This Chrome version does not support the File System Access API.');
    return;
  }

  if (hasUnsavedChanges && !confirmDiscardLocalChanges()) {
    return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'untitled.md',
      types: [
        {
          description: 'Markdown file',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    });

    await writeTextToHandle(handle, '');

    fileHandle = handle;
    const file = await handle.getFile();
    fileNameLabel.textContent = file.name;
    workspaceDirectoryHandle = null;
    clearWorkspaceFiles();
    sourceUrl = '';
    sourceTextSnapshot = '';
    lastFileSnapshot = null;
    hasUnsavedChanges = false;
    setStatus('New file created');
    replaceEditorContent('');
  } catch (error) {
    if (error.name !== 'AbortError') {
      setStatus(`New file failed: ${error.message}`);
    }
  }
}

async function refreshCurrentSource() {
  try {
    if (hasUnsavedChanges && !confirmDiscardLocalChanges()) {
      setStatus('Refresh canceled. Local edits kept.');
      return;
    }

    if (workspaceDirectoryHandle) {
      await refreshWorkspaceDirectory();
      return;
    }

    if (fileHandle) {
      if (await refreshFileHandleSource()) {
        setStatus('Refreshed file');
      }
      return;
    }

    if (sourceUrl) {
      await loadFromSourceUrl(sourceUrl);
      setStatus('Refreshed from URL');
      return;
    }

    setStatus('Nothing to refresh.');
  } catch (error) {
    setStatus(`Refresh failed: ${error.message}`);
  }
}

async function refreshFileHandleSource() {
  if (!fileHandle) {
    return false;
  }

  try {
    const file = await fileHandle.getFile();
    editor.value = await file.text();
    fileNameLabel.textContent = file.name || fileHandle.name || fileNameLabel.textContent;
    hasUnsavedChanges = false;
    renderNow();
    return true;
  } catch (error) {
    if (isMissingFileError(error)) {
      handleSourceReadError(error);
      return false;
    }

    setStatus(`Failed to refresh file: ${error.message}`);
    return false;
  }
}

async function refreshWorkspaceDirectory() {
  try {
    workspaceFiles = await collectMarkdownFileHandles(workspaceDirectoryHandle);
    renderFileTree();

    if (workspaceFiles.length === 0) {
      setStatus('No Markdown files found in workspace.');
      return;
    }

    const currentFileStillExists = workspaceFiles.some(
      (file) => file.path === activeWorkspacePath
    );

    if (currentFileStillExists) {
      await openWorkspaceFile(activeWorkspacePath);
      setStatus('Refreshed workspace');
    } else {
      await openWorkspaceFile(workspaceFiles[0].path);
      setStatus('Current file removed. Opened first file.');
    }
  } catch (error) {
    setStatus(`Failed to refresh workspace: ${error.message}`);
  }
}

function scheduleAutoSave() {
  window.clearTimeout(autoSaveTimer);

  if (!autosaveToggle.checked || !fileHandle) {
    return;
  }

  autoSaveTimer = window.setTimeout(() => {
    saveToWritableFile({ silent: true });
  }, 800);
}

function applyToolbarAction(event) {
  const button = event.target.closest('[data-markdown-action]');
  if (!button) {
    return;
  }

  const action = MARKDOWN_ACTIONS[button.dataset.markdownAction];
  if (!action) {
    return;
  }

  const next = applyMarkdownAction(editor.value, editor.selectionStart, editor.selectionEnd, action);
  editor.value = next.value;
  editor.focus();
  editor.setSelectionRange(next.selectionStart, next.selectionEnd);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

async function handleFileTreeClick(event) {
  const fileButton = event.target.closest('[data-file-path]');
  if (fileButton) {
    try {
      await openWorkspaceFile(fileButton.dataset.filePath);
    } catch (error) {
      handleSourceReadError(error);
    }
    return;
  }

  const folderButton = event.target.closest('[data-folder-toggle]');
  if (folderButton) {
    const isExpanded = folderButton.getAttribute('aria-expanded') === 'true';
    folderButton.setAttribute('aria-expanded', String(!isExpanded));
  }
}

async function openWorkspaceFile(path) {
  const entry = workspaceFiles.find((file) => file.path === path);
  if (!entry) {
    return;
  }

  fileHandle = entry.handle;
  activeWorkspacePath = entry.path;
  editor.value = await readFileHandleText(entry.handle);
  fileNameLabel.textContent = entry.path;
  sourceUrl = '';
  setStatus('Loaded from folder workspace');
  renderFileTree();
  renderNow();
}

async function saveToWritableFile({ silent = false } = {}) {
  if (!fileHandle && !window.showOpenFilePicker) {
    if (!silent) {
      setStatus('Saving requires Chrome File System Access API support.');
    }
    return;
  }

  if (silent && !fileHandle) {
    return;
  }

  saveButton.disabled = true;
  setStatus(fileHandle ? 'Saving...' : 'Choose the source file to grant write access...');

  try {
    if (!fileHandle) {
      fileHandle = await chooseMarkdownFile(window.showOpenFilePicker);
      fileNameLabel.textContent = fileHandle.name;
    }

    await writeTextToHandle(fileHandle, editor.value);
    setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    if (error.name !== 'AbortError') {
      if (!silent) {
        setStatus(`Save failed: ${error.message}`);
      } else {
        setStatus(`Auto-save failed: ${error.message}`);
      }
    }
  } finally {
    saveButton.disabled = false;
  }
}

function exportHtml() {
  try {
    const document = currentExportDocument();
    downloadHtmlDocument({
      document,
      fileName: defaultExportName(fileNameLabel.textContent, 'html'),
    });
    setStatus('Exported HTML');
  } catch (error) {
    setStatus(`HTML export failed: ${error.message}`);
  }
}

function exportPdf() {
  try {
    const document = currentExportDocument();
    printHtmlDocument({ document });
    setStatus('Opened PDF print dialog');
  } catch (error) {
    setStatus(`PDF export failed: ${error.message}`);
  }
}

function currentExportDocument() {
  return buildExportHtml({
    title: fileNameLabel.textContent,
    bodyHtml: preview.innerHTML,
    styles: exportStyles(),
  });
}

function exportStyles() {
  return `
    h1, h2, h3 { line-height: 1.2; }
    pre { overflow: auto; padding: 14px; border-radius: 6px; background: #eef2f6; }
    code { border-radius: 4px; padding: 0.1em 0.25em; background: #eef2f6; }
    pre code { padding: 0; background: transparent; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d8dde6; padding: 6px 8px; }
    svg { max-width: 100%; height: auto; }
  `;
}

function replaceEditorContent(newContent) {
  editor.value = newContent;
  hasUnsavedChanges = false;
  renderNow();
}

function handleMarkdownDragOver(event) {
  if (!event.dataTransfer || !hasMarkdownDragItem(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  appLayout.classList.add('is-drag-over');
}

function handleMarkdownDragLeave(event) {
  if (event.relatedTarget && appLayout.contains(event.relatedTarget)) {
    return;
  }

  appLayout.classList.remove('is-drag-over');
}

async function handleMarkdownDrop(event) {
  if (!event.dataTransfer) {
    return;
  }

  event.preventDefault();
  appLayout.classList.remove('is-drag-over');

  if (hasUnsavedChanges && !confirmDiscardLocalChanges()) {
    return;
  }

  try {
    const droppedEntry = await getDroppedMarkdownEntry(event.dataTransfer);
    if (!droppedEntry) {
      setStatus('Drop a Markdown file or folder to open it.');
      return;
    }

    if (droppedEntry.directoryHandle) {
      workspaceDirectoryHandle = droppedEntry.directoryHandle;
      workspaceFiles = await collectMarkdownFileHandles(droppedEntry.directoryHandle);
      activeWorkspacePath = '';
      folderNameLabel.textContent = droppedEntry.directoryHandle.name || 'Folder';
      setSidebarCollapsed(false);
      renderFileTree();

      if (workspaceFiles.length === 0) {
        fileHandle = null;
        setStatus('No Markdown files found in this folder.');
        return;
      }

      await openWorkspaceFile(workspaceFiles[0].path);
      setStatus('Loaded dropped folder workspace');
      return;
    }

    clearWorkspaceFiles();
    sourceUrl = '';
    sourceTextSnapshot = '';

    if (droppedEntry.handle) {
      fileHandle = droppedEntry.handle;
      const file = await droppedEntry.handle.getFile();
      fileNameLabel.textContent = file.name;
      replaceEditorContent(await file.text());
      setStatus('Loaded dropped file with write access');
      return;
    }

    fileHandle = null;
    fileNameLabel.textContent = droppedEntry.file.name;
    replaceEditorContent(await droppedEntry.file.text());
    setStatus('Loaded dropped file. Use Save to choose a writable file.');
  } catch (error) {
    handleSourceReadError(error);
  }
}

function hasMarkdownDragItem(dataTransfer) {
  const files = Array.from(dataTransfer.files || []);
  if (files.some((file) => isMarkdownFileName(file.name))) {
    return true;
  }

  return Array.from(dataTransfer.items || []).some(
    (item) => item.kind === 'file' && (!item.type || item.type === 'text/markdown' || item.type === 'text/plain'),
  );
}

async function getDroppedMarkdownEntry(dataTransfer) {
  for (const item of Array.from(dataTransfer.items || [])) {
    if (item.kind !== 'file') {
      continue;
    }

    const handle = await getDataTransferFileHandle(item);
    if (handle?.kind === 'directory') {
      return { directoryHandle: handle };
    }

    const file = item.getAsFile();
    if (file && isMarkdownFileName(file.name)) {
      return { file, handle: handle?.kind === 'file' ? handle : null };
    }
  }

  const file = Array.from(dataTransfer.files || []).find((entry) => isMarkdownFileName(entry.name));
  return file ? { file, handle: null } : null;
}

async function getDataTransferFileHandle(item) {
  if (!item.getAsFileSystemHandle) {
    return null;
  }

  const handle = await item.getAsFileSystemHandle();
  return handle && ['file', 'directory'].includes(handle.kind) ? handle : null;
}

function isMarkdownFileName(name) {
  return /\.(md|markdown)$/i.test(name || '');
}

function handleSourceReadError(error) {
  if (isMissingFileError(error)) {
    fileHandle = null;
    sourceUrl = '';
    setStatus('Source file or folder was moved or deleted. Click Refresh, Open, or drop it again.');
    return;
  }

  setStatus(`Open failed: ${error.message}`);
}

function renderNow() {
  if (!window.marked) {
    preview.textContent = editor.value;
    return;
  }

  preview.innerHTML = window.marked.parse(editor.value);
  prepareTaskListInputs();
  renderCitationMarkers(preview);
  renderLatexMath();
  prepareMermaidBlocks();
  renderMermaidBlocks();
}

function renderLatexMath() {
  if (!window.renderMathInElement) {
    return;
  }

  window.renderMathInElement(preview, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true },
    ],
    throwOnError: false,
  });
}

function prepareTaskListInputs() {
  const taskInputs = preview.querySelectorAll('li input[type="checkbox"]');

  taskInputs.forEach((input, index) => {
    input.disabled = false;
    input.dataset.taskIndex = String(index);
    input.setAttribute('aria-label', input.checked ? 'Mark task incomplete' : 'Mark task complete');
  });
}

function handlePreviewTaskToggle(event) {
  const input = event.target.closest('li input[type="checkbox"][data-task-index]');
  if (!input) {
    return;
  }

  editor.value = toggleMarkdownTaskAtIndex(editor.value, Number(input.dataset.taskIndex));
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function prepareMermaidBlocks() {
  const blocks = preview.querySelectorAll('pre > code.language-mermaid, pre > code.lang-mermaid');

  blocks.forEach((block, index) => {
    const container = document.createElement('div');
    container.className = 'mermaid';
    container.id = `mermaid-${Date.now()}-${index}`;
    container.dataset.mermaidSource = block.textContent;
    container.textContent = block.textContent;
    block.closest('pre').replaceWith(container);
  });
}

async function renderMermaidBlocks() {
  const blocks = Array.from(preview.querySelectorAll('.mermaid'));
  if (blocks.length === 0) {
    return;
  }

  window.clearTimeout(mermaidTimer);
  mermaidTimer = window.setTimeout(async () => {
    const officialNodes = [];

    blocks.forEach((node) => {
      if (renderBeautifulMermaidBlock(node)) {
        return;
      }

      node.textContent = node.dataset.mermaidSource || node.textContent;
      officialNodes.push(node);
    });

    if (!window.mermaid || officialNodes.length === 0) {
      return;
    }

    try {
      await window.mermaid.run({ nodes: officialNodes });
    } catch (error) {
      officialNodes.forEach((node) => {
        if (!node.dataset.processed) {
          node.classList.add('mermaid-error');
        }
      });
      setStatus(`Mermaid render error: ${error.message}`);
    }
  }, 0);
}

function renderBeautifulMermaidBlock(node) {
  const source = node.dataset.mermaidSource || node.textContent;
  if (!isBeautifulMermaidSupported(source) || !window.BeautifulMermaid?.renderMermaidSVG) {
    return false;
  }

  try {
    node.innerHTML = window.BeautifulMermaid.renderMermaidSVG(source, {
      bg: 'var(--panel)',
      fg: 'var(--text)',
      accent: 'var(--accent)',
      transparent: true,
    });
    node.classList.add('mermaid-beautiful');
    node.dataset.renderer = 'beautiful-mermaid';
    return true;
  } catch (error) {
    console.warn('[beautiful-mermaid] render failed, falling back to mermaid.js:', error);
    node.classList.remove('mermaid-beautiful');
    delete node.dataset.renderer;
    return false;
  }
}

function isBeautifulMermaidSupported(source) {
  const firstLine = source.trim().split(/[\n;]/)[0]?.trim().toLowerCase() || '';

  return /^(graph|flowchart)\b/.test(firstLine)
    || /^statediagram-v2\b/.test(firstLine)
    || /^sequencediagram\b/.test(firstLine)
    || /^classdiagram\b/.test(firstLine)
    || /^erdiagram\b/.test(firstLine)
    || /^xychart(-beta)?\b/.test(firstLine);
}

function renderFileTree() {
  if (workspaceFiles.length === 0) {
    fileTree.innerHTML = '<div class="file-tree-empty">Open a folder to browse Markdown files.</div>';
    return;
  }

  const root = createTreeModel(workspaceFiles);
  fileTree.innerHTML = '';
  fileTree.append(renderTreeGroup(root));
}

function createTreeModel(files) {
  const root = { folders: new Map(), files: [] };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let node = root;

    parts.slice(0, -1).forEach((part) => {
      if (!node.folders.has(part)) {
        node.folders.set(part, { folders: new Map(), files: [] });
      }
      node = node.folders.get(part);
    });

    node.files.push(file);
  });

  return root;
}

function renderTreeGroup(node) {
  const group = document.createElement('div');
  group.className = 'tree-group';

  Array.from(node.folders.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, child]) => {
    const folder = document.createElement('button');
    folder.type = 'button';
    folder.className = 'tree-folder';
    folder.dataset.folderToggle = name;
    folder.setAttribute('aria-expanded', 'true');
    folder.textContent = `▾ ${name}`;

    const children = document.createElement('div');
    children.className = 'tree-children';
    children.append(renderTreeGroup(child));

    group.append(folder, children);
  });

  node.files.sort((a, b) => a.name.localeCompare(b.name)).forEach((file) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `tree-file${file.path === activeWorkspacePath ? ' is-active' : ''}`;
    item.dataset.filePath = file.path;
    item.textContent = file.name;
    group.append(item);
  });

  return group;
}

function toggleSidebar() {
  setSidebarCollapsed(!appLayout.classList.contains('sidebar-collapsed'));
}

function setSidebarCollapsed(isCollapsed) {
  appLayout.classList.toggle('sidebar-collapsed', isCollapsed);
  toggleSidebarButton.textContent = '‹';
  toggleSidebarButton.title = 'Hide file tree';
  toggleFilesButton.classList.toggle('is-active', !isCollapsed);
  revealSidebarButton.setAttribute('aria-hidden', String(!isCollapsed));
}

function clearWorkspaceFiles() {
  workspaceFiles = [];
  activeWorkspacePath = '';
  folderNameLabel.textContent = 'Folder';
  setSidebarCollapsed(true);
  renderFileTree();
}

function startSidebarResize(event) {
  if (appLayout.classList.contains('sidebar-collapsed')) {
    return;
  }

  event.preventDefault();
  document.body.classList.add('is-resizing-sidebar');
  window.addEventListener('pointermove', resizeSidebar);
  window.addEventListener('pointerup', stopSidebarResize, { once: true });
}

function resizeSidebar(event) {
  const layoutRect = appLayout.getBoundingClientRect();
  const nextWidth = Math.min(560, Math.max(180, event.clientX - layoutRect.left));
  appLayout.style.setProperty('--sidebar-width', `${nextWidth}px`);
}

function stopSidebarResize() {
  document.body.classList.remove('is-resizing-sidebar');
  window.removeEventListener('pointermove', resizeSidebar);
}

function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('markdownChromeTheme', theme);
  const icon = themeToggleButton.querySelector('i');
  if (icon) {
    icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  }
  themeToggleButton.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
}

function setMode(mode) {
  workspace.classList.remove('mode-split', 'mode-preview', 'mode-editor');
  workspace.classList.add(`mode-${mode}`);

  modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  });
}

function setFileNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = decodeURIComponent(parsed.pathname).split('/').filter(Boolean);
    fileNameLabel.textContent = parts.at(-1) || 'Markdown file';
  } catch {
    fileNameLabel.textContent = 'Markdown file';
  }
}

function setStatus(message) {
  statusLabel.textContent = message;
}
