# Markdown Workspace Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add folder workspace navigation, beginner Markdown insertion controls, and HTML/PDF export to the Chrome Markdown editor.

**Architecture:** Keep the static MV3 viewer and split pure helper modules from UI orchestration. Folder and file handles stay in the viewer process through the File System Access API; export uses generated HTML blobs and Chrome print for PDF.

**Tech Stack:** Chrome MV3, plain JavaScript modules, File System Access API, Marked, Mermaid, Node `node:test`, Playwright runtime verification.

---

## File Structure

- `src/viewer/file-access.js`: add directory picker, recursive Markdown handle collection, and file read helpers.
- `src/viewer/markdown-actions.js`: text insertion helpers for toolbar controls.
- `src/viewer/export.js`: standalone HTML document generation and download helpers.
- `src/viewer/viewer.html`: add file tree sidebar, open folder button, Markdown toolbar, export controls.
- `src/viewer/viewer.css`: layout for collapsible sidebar, file tree, toolbar, and export controls.
- `src/viewer/viewer.js`: wire folder loading, file switching, toolbar actions, HTML export, PDF print export.
- `tests/*.test.js`: cover pure helpers and static feature declarations.
- `scripts/verify-viewer-runtime.js`: verify new UI controls and existing Mermaid rendering.

## Tasks

### Task 1: Folder Workspace Helpers

- [ ] Write tests for recursive Markdown file collection from fake directory handles.
- [ ] Add `chooseMarkdownDirectory`, `collectMarkdownFileHandles`, and `readFileHandleText` to `src/viewer/file-access.js`.
- [ ] Run tests and keep existing file picker/save tests green.

### Task 2: Markdown Editing Controls

- [ ] Write tests for applying wrappers and line-prefix Markdown snippets.
- [ ] Add `src/viewer/markdown-actions.js` with helper definitions for heading, bold, italic, link, quote, list, code block, table, and Mermaid block.
- [ ] Wire toolbar buttons in viewer UI.

### Task 3: Export HTML/PDF

- [ ] Write tests for export HTML document generation.
- [ ] Add `src/viewer/export.js` for full HTML construction and file download.
- [ ] Wire `Export HTML` to download rendered preview HTML.
- [ ] Wire `Export PDF` to open a printable document and call `print()`.

### Task 4: UI And Verification

- [ ] Add sidebar tree with collapse/expand and active file state.
- [ ] Update README with folder, toolbar, and export usage.
- [ ] Update static and runtime verification scripts.
- [ ] Run `npm test`, `npm run verify:static`, `npm run verify:viewer`, and Chrome pack validation.
