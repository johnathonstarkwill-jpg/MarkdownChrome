# MarkdownChrome Redesign + New File Feature

Date: 2026-06-26

## Overview

Two changes in one pass:
1. Add "new file" feature — create blank `.md` file on disk via save dialog
2. Full visual redesign — Linear/Notion dark style, icon-only toolbar

---

## 1. New File Feature

**Behavior:**
- User clicks New File button (or Cmd+N)
- `showSaveFilePicker` dialog opens, default filename `untitled.md`, filter `.md`
- On confirm: write empty string to file, open it in editor
- On cancel: no-op

**Implementation surface:** `viewer.js` — new `newFile()` function, wired to toolbar button click and keyboard shortcut.

**Edge case:** if current file has unsaved changes, show browser `confirm()` before proceeding (same pattern as existing open flow).

---

## 2. Visual Redesign

### Design tokens (CSS variables — `viewer.css`)

Light and dark themes both updated. Dark theme becomes primary "dark app" feel.

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#f6f7f9` | `#0f1117` |
| `--panel` | `#ffffff` | `#161b22` |
| `--border` | `#d0d7de` | `#21262d` |
| `--text` | `#1d2430` | `#e6edf3` |
| `--muted` | `#7d8590` | `#7d8590` |
| `--accent` | `#1f7a6b` | `#1f7a6b` |
| `--accent-strong` | `#155e53` | `#4fb6a6` |
| `--code-bg` | `#f0f3f6` | `#21262d` |
| `--sidebar-bg` | `#f4f5f7` | `#0d1117` |
| `--editor-bg` | `#fafbfc` | `#0d1117` |
| `--toolbar-bg` | `#ffffff` | `#161b22` |
| `--active-bg` | `#e1f3ef` | `#0d2f2b` |

### Toolbar redesign

- Height: `44px` (was `56px`)
- Buttons: icon-only, `28×28px`, no border, transparent bg, hover: `--border` bg
- Icons: Tabler icon font loaded via CDN (add `<link>` to `viewer.html`)
- Button groups separated by `1px` vertical dividers

**Icon map:**

| Action | Icon class |
|--------|-----------|
| New file | `ti-file-plus` (teal color) |
| Open file | `ti-folder-open` |
| Open folder | `ti-folders` |
| Save | `ti-device-floppy` |
| Export HTML | `ti-brand-html5` |
| Export PDF | `ti-file-type-pdf` |
| Refresh | `ti-refresh` |
| Theme toggle | `ti-moon` / `ti-sun` |
| Auto-save | text "AS" pill badge |

- Tooltips: native `title` attribute (existing pattern, keep)
- Mode group (Split/Preview/Editor): keep as segmented text buttons, style refresh

### Sidebar

- Background: `--sidebar-bg` (darker than panel in dark mode: `#0d1117`)
- Folder label: 11px, uppercase, `letter-spacing: 0.05em`, muted color
- Active file item: left `2px` accent border, `--active-bg` background
- No border radius on items (flat, Linear-style)

### Markdown toolbar

- Height: `32px` (was implicit, now explicit)
- Buttons: 22px height, smaller padding, same hover style

### No structural layout changes

Sidebar, workspace split, resize handles — all stay. Only colors + spacing + button styles change.

---

## Files to change

| File | Change |
|------|--------|
| `src/viewer/viewer.html` | Add Tabler CDN link; replace button text with `<i>` icons; add New File button |
| `src/viewer/viewer.css` | Update all tokens; toolbar height; button styles; sidebar styles |
| `src/viewer/viewer.js` | Add `newFile()` function; wire button + Cmd+N shortcut |

---

## Out of scope

- i18n (extension has no i18n system; UI strings are English only, not changed)
- Markdown toolbar icon replacement (keep text labels: H2, B, I, etc.)
- Any backend/manifest changes
