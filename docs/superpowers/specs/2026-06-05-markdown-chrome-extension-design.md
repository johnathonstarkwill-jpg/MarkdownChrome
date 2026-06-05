# Markdown Chrome Extension Design

## Goal

Build a Chrome Manifest V3 extension for local Markdown files. When the user opens a Markdown file in Chrome, the extension can present a Markdown workspace with preview, editing, split/fullscreen modes, and Mermaid rendering. Edits must be saved back to the source file when Chrome permissions allow it.

## Browser Constraint

Chrome extensions cannot silently write to arbitrary `file://` paths. Reading a local Markdown file from a `file://` tab is possible only after the user enables "Allow access to file URLs" for the extension. Writing the same file requires user consent through the File System Access API.

The extension will therefore use this model:

- A `file://.../*.md` page can be detected and redirected into the extension viewer.
- The viewer can load the opened file content when file URL access is enabled.
- To save changes back to disk, the user grants a writable file handle with a native file picker. The app stores that handle when Chrome permits it and writes through it on save.
- If a writable handle is not available, the editor stays usable and clearly exposes "Choose writable file" before saving.

## User Experience

The extension workspace has three modes:

- Split mode: editor on the left, rendered preview on the right.
- Preview mode: full-width rendered Markdown.
- Editor mode: full-width Markdown editor.

The toolbar includes open, save, mode switching, Mermaid status, and source filename. The editor updates the preview live. Mermaid diagrams render inside fenced `mermaid` code blocks.

## Architecture

Use a minimal static MV3 extension without a build step.

- `manifest.json`: MV3 configuration, permissions, content script registration for local Markdown pages, extension page entrypoints.
- `src/content/file-detector.js`: runs on `file://*/*.md` and redirects the tab to the extension viewer with the source URL.
- `src/viewer/viewer.html`: extension UI shell.
- `src/viewer/viewer.css`: responsive split/fullscreen workspace styling.
- `src/viewer/viewer.js`: file loading, editor state, Markdown rendering, Mermaid rendering, and save behavior.
- `vendor/marked.min.js`: Markdown parser.
- `vendor/mermaid.min.js`: Mermaid renderer.

External libraries are vendored because MV3 extension pages should not depend on remote scripts.

## Data Flow

1. User opens a Markdown file in Chrome.
2. Content script detects a Markdown-looking `file://` URL.
3. The tab navigates to `chrome-extension://.../src/viewer/viewer.html?source=<file-url>`.
4. Viewer fetches the file URL and places text in the editor.
5. Editor input re-renders Markdown preview.
6. Mermaid is initialized after Markdown render and processes Mermaid code blocks.
7. Save writes through the File System Access API handle. If no handle exists, the user chooses the writable file first.

## Error Handling

- If file URL access is disabled, show instructions to enable it on the extension details page.
- If fetching the `file://` URL fails, allow manual file opening.
- If saving fails or no writable handle exists, show a save error and keep content in the editor.
- If Mermaid rendering fails for a block, show the original block with an error marker instead of breaking the whole preview.

## Testing And Verification

Because this is a browser extension with local-file permissions, verification combines automated and manual checks:

- Unit test pure helpers for Markdown file URL detection and viewer URL construction.
- Run a no-build static sanity check over expected files.
- Manual load in Chrome via `chrome://extensions` with developer mode.
- Enable "Allow access to file URLs".
- Open a `.md` file through Chrome and verify redirect, split/preview/editor modes, live Markdown rendering, Mermaid rendering, and save after writable-file authorization.

