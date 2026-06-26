# MarkdownChrome Redesign + New File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "new file" button and fully modernize the viewer UI to a Linear/Notion dark style with icon-only toolbar buttons.

**Architecture:** Three files change — `viewer.html` (markup: add Tabler icon CDN, swap button text for icons, add new-file button), `viewer.css` (tokens + component styles), `viewer.js` (new `newFile()` function wired to button and Cmd+N). No structural/layout changes.

**Tech Stack:** Vanilla JS ES modules, CSS custom properties, Tabler Icons (CDN webfont), Chrome File System Access API (`showSaveFilePicker`).

## Global Constraints

- Extension targets Chrome; `showSaveFilePicker` / `showOpenFilePicker` are available — no fallback needed beyond existing `if (!window.showSaveFilePicker)` guard pattern.
- No build step — files are served directly from `src/viewer/`.
- No TypeScript — plain `.js`.
- No i18n system — keep existing English strings unchanged.
- Tabler Icons CDN: `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css`

---

### Task 1: Add Tabler Icons CDN and replace toolbar button text with icons

**Files:**
- Modify: `src/viewer/viewer.html`

**Interfaces:**
- Produces: DOM elements with `id` attributes and `<i class="ti ti-*">` icon children that `viewer.js` queries by existing selectors (`#openButton`, `#openFolderButton`, etc.) — selectors unchanged.

- [ ] **Step 1: Add Tabler Icons CDN link to `<head>`**

In `src/viewer/viewer.html`, add after the existing `<link rel="stylesheet" href="./viewer.css">` line:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css">
```

- [ ] **Step 2: Add new-file button and replace all toolbar button text with icons**

Replace the entire `<div class="actions">` block in `viewer.html` with:

```html
<div class="actions">
  <button id="newButton" type="button" title="New file (Cmd+N)" class="icon-btn icon-btn--accent" aria-label="New file">
    <i class="ti ti-file-plus" aria-hidden="true"></i>
  </button>
  <button id="openButton" type="button" title="Open Markdown file" class="icon-btn" aria-label="Open file">
    <i class="ti ti-folder-open" aria-hidden="true"></i>
  </button>
  <button id="openFolderButton" type="button" title="Open folder with Markdown files" class="icon-btn" aria-label="Open folder">
    <i class="ti ti-folders" aria-hidden="true"></i>
  </button>
  <button id="toggleFilesButton" type="button" title="Show or hide file tree" class="icon-btn" aria-label="Toggle file tree">
    <i class="ti ti-layout-sidebar" aria-hidden="true"></i>
  </button>
  <span class="toolbar-divider" aria-hidden="true"></span>
  <button id="refreshButton" type="button" title="Refresh current file or folder" class="icon-btn" aria-label="Refresh">
    <i class="ti ti-refresh" aria-hidden="true"></i>
  </button>
  <button id="saveButton" type="button" title="Save to writable file" class="icon-btn" aria-label="Save">
    <i class="ti ti-device-floppy" aria-hidden="true"></i>
  </button>
  <button id="exportHtmlButton" type="button" title="Export rendered Markdown as HTML" class="icon-btn" aria-label="Export HTML">
    <i class="ti ti-brand-html5" aria-hidden="true"></i>
  </button>
  <button id="exportPdfButton" type="button" title="Export rendered Markdown as PDF through print dialog" class="icon-btn" aria-label="Export PDF">
    <i class="ti ti-file-type-pdf" aria-hidden="true"></i>
  </button>
  <span class="toolbar-divider" aria-hidden="true"></span>
  <button id="themeToggleButton" type="button" title="Switch light or dark theme" class="icon-btn" aria-label="Toggle theme">
    <i class="ti ti-moon" aria-hidden="true"></i>
  </button>
  <label class="autosave-toggle" title="Auto-save">
    <input id="autosaveToggle" type="checkbox" checked aria-label="Auto-save">
    <span class="autosave-label">AS</span>
  </label>
  <div class="mode-group" aria-label="View mode">
    <button class="mode-button is-active" type="button" data-mode="split">Split</button>
    <button class="mode-button" type="button" data-mode="preview">Preview</button>
    <button class="mode-button" type="button" data-mode="editor">Editor</button>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/viewer/viewer.html
git commit -m "feat: add Tabler icons CDN and icon-only toolbar buttons"
```

---

### Task 2: Redesign CSS — tokens, toolbar, sidebar, buttons

**Files:**
- Modify: `src/viewer/viewer.css`

**Interfaces:**
- Consumes: DOM classes from Task 1 (`icon-btn`, `icon-btn--accent`, `toolbar-divider`, `autosave-label`)
- Produces: Updated visual styles consumed by existing HTML structure

- [ ] **Step 1: Replace CSS custom property tokens (lines 1–34)**

Replace the existing `:root` and `[data-theme="dark"]` blocks with:

```css
:root {
  color-scheme: light;
  --sidebar-width: 260px;
  --bg: #f4f5f7;
  --panel: #ffffff;
  --border: #d0d7de;
  --text: #1d2430;
  --muted: #7d8590;
  --accent: #1f7a6b;
  --accent-strong: #155e53;
  --code-bg: #f0f3f6;
  --sidebar-bg: #f4f5f7;
  --editor-bg: #fafbfc;
  --toolbar-bg: #ffffff;
  --active-bg: #e1f3ef;
  --reveal-bg: rgba(31, 122, 107, 0.72);
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0f1117;
  --panel: #161b22;
  --border: #21262d;
  --text: #e6edf3;
  --muted: #7d8590;
  --accent: #1f7a6b;
  --accent-strong: #4fb6a6;
  --code-bg: #21262d;
  --sidebar-bg: #0d1117;
  --editor-bg: #0d1117;
  --toolbar-bg: #161b22;
  --active-bg: #0d2f2b;
  --reveal-bg: rgba(79, 182, 166, 0.62);
}
```

- [ ] **Step 2: Update base button styles (lines 49–73)**

Replace the existing `button`, `button:hover`, `button:disabled`, `button.is-active` rules with:

```css
button {
  height: 28px;
  border: none;
  border-radius: 6px;
  padding: 0 10px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

button:hover {
  background: var(--border);
  color: var(--text);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

button.is-active {
  background: var(--active-bg);
  color: var(--accent-strong);
}

.icon-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 16px;
}

.icon-btn--accent {
  color: var(--accent-strong);
}

.icon-btn--accent:hover {
  color: var(--accent-strong);
}

.toolbar-divider {
  display: inline-block;
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 2px;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Update toolbar height and layout (lines 75–109)**

Replace `.toolbar` rule:

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: var(--toolbar-bg);
}
```

Replace `.actions` rule:

```css
.actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}
```

- [ ] **Step 4: Update app-layout height reference (line 147)**

Change `height: calc(100vh - 56px)` to `height: calc(100vh - 44px)` in `.app-layout`.

- [ ] **Step 5: Update autosave toggle styles**

Replace the `.autosave-toggle` and `.autosave-toggle input` rules with:

```css
.autosave-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0;
  height: 28px;
  cursor: pointer;
}

.autosave-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.autosave-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  background: transparent;
  user-select: none;
}

.autosave-toggle:has(input:checked) .autosave-label {
  color: var(--accent-strong);
  background: var(--active-bg);
}

.autosave-toggle:hover .autosave-label {
  background: var(--border);
  color: var(--text);
}
```

- [ ] **Step 6: Update sidebar header styles for Linear look**

Replace `.sidebar-header` rule:

```css
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
}

#folderName {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted);
}
```

- [ ] **Step 7: Update active file item to use left border accent**

Replace `.tree-file.is-active` rule:

```css
.tree-file.is-active {
  background: var(--active-bg);
  color: var(--accent-strong);
  border-left: 2px solid var(--accent);
  border-radius: 0 5px 5px 0;
  padding-left: 4px;
}
```

- [ ] **Step 8: Update markdown toolbar for compact look**

Replace `.markdown-toolbar` rule:

```css
.markdown-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 34px;
  min-height: 34px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border);
  background: var(--toolbar-bg);
  overflow-x: auto;
}

.markdown-toolbar button {
  min-width: 28px;
  height: 24px;
  padding: 0 6px;
  white-space: nowrap;
  font-size: 12px;
}
```

- [ ] **Step 9: Update mobile breakpoint height (line 511)**

In `@media (max-width: 760px)`, change `height: calc(100vh - 104px)` to `height: calc(100vh - 90px)`.

- [ ] **Step 10: Commit**

```bash
git add src/viewer/viewer.css
git commit -m "feat: redesign UI with Linear-style tokens and icon toolbar"
```

---

### Task 3: Wire new-file button in JS + Cmd+N shortcut

**Files:**
- Modify: `src/viewer/viewer.js`

**Interfaces:**
- Consumes: `#newButton` DOM element (added in Task 1); existing `hasUnsavedChanges`, `confirmDiscardLocalChanges()`, `replaceEditorContent()`, `setStatus()`, `fileNameLabel`, `fileHandle`, `workspaceDirectoryHandle`, `clearWorkspaceFiles()`, `sourceUrl`, `sourceTextSnapshot`, `lastFileSnapshot` module-level variables/functions.
- Produces: `newFile()` async function; Cmd+N keybinding.

- [ ] **Step 1: Query the new button at top of `viewer.js`**

After the existing `const openButton = document.querySelector('#openButton');` line (line 24), add:

```js
const newButton = document.querySelector('#newButton');
```

- [ ] **Step 2: Add `newFile()` function**

Add this function after `openFolderWithPicker` (around line 195):

```js
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
    replaceEditorContent('');
    hasUnsavedChanges = false;
    setStatus('New file created');
  } catch (error) {
    if (error.name !== 'AbortError') {
      setStatus(`New file failed: ${error.message}`);
    }
  }
}
```

- [ ] **Step 3: Wire button click and Cmd+N in `bindEvents()`**

In `bindEvents()`, after `openButton.addEventListener('click', openFileWithPicker);` (line 102), add:

```js
newButton.addEventListener('click', newFile);
```

In the existing `keydown` listener block (around line 124), add Cmd+N before the closing brace:

```js
window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    saveToWritableFile();
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    newFile();
  }
});
```

- [ ] **Step 4: Verify `clearWorkspaceFiles` is exported**

Run:

```bash
grep -n "clearWorkspaceFiles\|function clearWorkspaceFiles" src/viewer/viewer.js
```

Expected: at least one match showing the function definition. If not defined, add after `let workspaceFiles = []` (line 43):

```js
function clearWorkspaceFiles() {
  workspaceFiles = [];
  activeWorkspacePath = '';
  fileTree.innerHTML = '';
  folderNameLabel.textContent = 'Folder';
}
```

- [ ] **Step 5: Commit**

```bash
git add src/viewer/viewer.js
git commit -m "feat: add new file creation with Cmd+N shortcut"
```

---

### Task 4: Update theme toggle icon in JS to reflect current theme

**Files:**
- Modify: `src/viewer/viewer.js`

**Interfaces:**
- Consumes: `themeToggleButton` (existing DOM ref, line 31); existing `setTheme()` function.
- Produces: Icon inside `themeToggleButton` switches between `ti-moon` (light mode) and `ti-sun` (dark mode).

- [ ] **Step 1: Find `setTheme` function**

```bash
grep -n "function setTheme" src/viewer/viewer.js
```

- [ ] **Step 2: Update `setTheme` to swap icon**

Find the `setTheme` function (it calls `document.documentElement.setAttribute('data-theme', ...)` and updates `themeToggleButton.textContent`). Replace the line that sets `themeToggleButton.textContent` with:

```js
const icon = themeToggleButton.querySelector('i');
if (icon) {
  icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
}
```

If `themeToggleButton.textContent = ...` doesn't exist in the function, append the icon swap code at the end of `setTheme`.

- [ ] **Step 3: Commit**

```bash
git add src/viewer/viewer.js
git commit -m "feat: update theme toggle icon to reflect active theme"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| New file: showSaveFilePicker → write empty → open | Task 3 |
| Unsaved changes guard before new file | Task 3 |
| Cmd+N shortcut | Task 3 |
| Icon-only toolbar with Tabler icons | Task 1 |
| New file button (teal accent) | Task 1 |
| Updated CSS tokens (Linear dark palette) | Task 2 |
| Toolbar 44px height | Task 2 |
| Sidebar darker bg, uppercase folder label | Task 2 |
| Active file left border accent | Task 2 |
| Markdown toolbar compact 34px | Task 2 |
| Theme toggle icon swap | Task 4 |

### Type consistency

- `newFile()` uses `clearWorkspaceFiles()` — Task 3 Step 4 verifies it exists before relying on it.
- `writeTextToHandle` is already imported at top of `viewer.js` (line 7) — no new import needed.
- `confirmDiscardLocalChanges()` defined at line 555 — available in same module scope.

### No placeholders found — all steps contain complete code.
