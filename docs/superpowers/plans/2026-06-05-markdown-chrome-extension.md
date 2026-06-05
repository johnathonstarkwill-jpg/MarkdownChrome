# Markdown Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Chrome MV3 extension that opens local Markdown files in a live editor/preview workspace, supports split/fullscreen modes, renders Mermaid, and saves back to disk through a user-granted writable file handle.

**Architecture:** The extension has a file detector content script, a shared URL helper module, and a viewer page. The viewer loads Markdown from a file URL when permitted, renders with vendored Marked and Mermaid scripts, and writes through the File System Access API.

**Tech Stack:** Chrome Manifest V3, plain JavaScript modules, Node `node:test`, Marked, Mermaid.

---

## File Structure

- `package.json`: local scripts for tests and static verification.
- `manifest.json`: MV3 extension metadata, permissions, and content-script registration.
- `src/shared/file-url.js`: pure helpers for Markdown file detection and viewer URL construction.
- `src/content/file-detector.js`: redirects `file://` Markdown tabs to the extension viewer.
- `src/viewer/viewer.html`: viewer shell and vendored script loading.
- `src/viewer/viewer.css`: responsive editor/preview layout.
- `src/viewer/viewer.js`: UI state, file loading, rendering, Mermaid, and saving.
- `tests/file-url.test.js`: Node unit tests for shared helpers.
- `vendor/marked.min.js`: vendored Markdown parser.
- `vendor/mermaid.min.js`: vendored Mermaid renderer.

## Tasks

### Task 1: Shared File URL Helpers

- [ ] Create `tests/file-url.test.js` with failing tests for `.md`, `.markdown`, query/hash handling, non-file URLs, and viewer URL construction.
- [ ] Run `npm test` and confirm the helper module is missing.
- [ ] Create `src/shared/file-url.js` with `isMarkdownFileUrl`, `buildViewerUrl`, and `getSourceUrlFromLocation`.
- [ ] Run `npm test` and confirm all helper tests pass.

### Task 2: Extension Shell And Redirect

- [ ] Create `package.json` with `test` and `verify:static` scripts.
- [ ] Create `manifest.json` with file URL content script registration and extension resources.
- [ ] Create `src/content/file-detector.js` to redirect Markdown file tabs to `viewer.html?source=...`.
- [ ] Run `npm test`.

### Task 3: Viewer UI

- [ ] Create `src/viewer/viewer.html` with toolbar, editor, preview, and status regions.
- [ ] Create `src/viewer/viewer.css` with split, editor-only, and preview-only layouts.
- [ ] Create `src/viewer/viewer.js` for UI state, live rendering, opening files, saving files, and Mermaid rendering.
- [ ] Run static verification.

### Task 4: Vendor Libraries And Final Verification

- [ ] Install or download Marked and Mermaid into `vendor/`.
- [ ] Run `npm test`.
- [ ] Run `npm run verify:static`.
- [ ] Confirm the extension can be loaded unpacked from the project root.


