# Chrome Web Store Listing Draft

Use this file as the source copy for the Chrome Web Store Developer Dashboard.

## Product Metadata

**Name:** Markdown Chrome

**Short description:**  
Open, edit, preview, and export local Markdown files with Mermaid support.

**Category:** Productivity

**Language:** English

**Website:** Add the project homepage or support page URL before submitting.

**Support email:** Add the developer support email before submitting.

## Detailed Description

Markdown Chrome is a local-first Markdown viewer and editor for Chrome.

Open Markdown files from your computer, preview them in Chrome, edit them side by side, render Mermaid diagrams, check task-list items directly in the preview, and export the rendered document as HTML or PDF.

Key features:

- Open `.md` and `.markdown` files with a native file picker.
- Open folders and browse Markdown files in a collapsible file tree.
- Use split view, fullscreen preview, or fullscreen editor mode.
- Insert common Markdown syntax with a beginner-friendly toolbar.
- Render GitHub Flavored Markdown, tables, task lists, and Mermaid diagrams.
- Click rendered task-list checkboxes to update the source Markdown.
- Save and auto-save after granting Chrome file write access.
- Export rendered Markdown as standalone HTML.
- Export to PDF through Chrome's print dialog.
- Switch between light and dark themes.

Markdown Chrome does not upload files, does not include analytics, and does not track browsing behavior. File access is used only for the user-facing Markdown editing workflow.

## Single Purpose

Markdown Chrome's single purpose is to view, edit, render, save, and export local Markdown files in Chrome.

## Permission Justification

**Host permission: `file:///*`**

Required so the extension can detect local Markdown files opened in Chrome and redirect them to the Markdown Chrome viewer. The extension uses this access only for local Markdown file viewing and editing. Users must enable Chrome's `Allow access to file URLs` setting for this behavior.

**File System Access API**

Used through Chrome's user-initiated file and directory pickers. The extension can save a file only after the user grants access to that file or folder.

## Data Use Summary

- No remote file upload.
- No analytics.
- No advertising.
- No sale of user data.
- No account system.
- No external JavaScript loaded at runtime.
- Markdown content is processed locally in the browser.

## Screenshot Checklist

Prepare screenshots that show real product functionality:

1. Split view with Markdown editor and rendered preview.
2. Mermaid diagram rendered as SVG.
3. Folder tree with Markdown files.
4. Rendered task-list checkbox being used.
5. Export controls for HTML and PDF.
6. Dark theme view.

Chrome Web Store requires listing images and may reject listings with missing icon, screenshots, or incomplete metadata. See the official image guidance: https://developer.chrome.com/docs/webstore/images

Generated screenshots live in `store-listing/screenshots/`. They must be `1280x800` or `640x400`, JPEG or 24-bit PNG, and must not have an alpha channel.

## Promotional Image Notes

Required image assets are uploaded in the Developer Dashboard, not declared in `manifest.json`.

Create a small promotional image if prompted by the dashboard. Optional larger promotional images can improve listing presentation, but avoid misleading claims or keyword stuffing.

## Review Notes

Testing does not require a login. Reviewers can load the extension, enable file URL access, and open a local Markdown file. Detailed steps are in `test-instructions.md`.
