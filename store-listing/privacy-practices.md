# Privacy Practices Draft

Use this as the basis for the Chrome Web Store Privacy tab and public privacy policy page.

## Single Purpose

Markdown Chrome lets users view, edit, render, save, and export local Markdown files in Chrome.

## Data Collection

Markdown Chrome does not collect, transmit, sell, or share user data.

The extension processes Markdown content locally in the browser so it can render preview HTML, Mermaid diagrams, task lists, and exported documents.

## User Data Types

The extension may access local file content selected by the user, specifically Markdown files opened through Chrome file URLs or the Chrome file and directory pickers.

This access is limited to the user-facing feature of viewing, editing, rendering, saving, and exporting Markdown files.

## Data Sharing

Markdown Chrome does not share user data with third parties.

Markdown Chrome does not use analytics, advertising SDKs, remote logging, or tracking services.

## Data Storage

Markdown file content remains on the user's device.

The extension may store local UI preferences such as theme choice in browser storage. File handles are granted by Chrome only after user interaction and are used for local save behavior.

## Remote Code

Markdown Chrome does not load remote JavaScript. Markdown and Mermaid rendering scripts are bundled with the extension package.

## Limited Use Statement

Markdown Chrome's use of information is limited to providing and improving its single purpose: local Markdown viewing, editing, rendering, saving, and exporting. The extension does not transfer, sell, or use user data for advertising.

## Permission Explanation

`file:///*` access is used to detect local Markdown files opened in Chrome and present them in the viewer. Users must enable Chrome's `Allow access to file URLs` option for this behavior.

File and folder access is granted through Chrome's native pickers and is required for local open and save behavior.

## Public Privacy Policy URL

Before publishing, place this privacy policy on a public URL and add that URL in the Chrome Web Store Developer Dashboard.
