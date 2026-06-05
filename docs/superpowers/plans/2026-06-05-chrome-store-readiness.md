# Chrome Store Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare Markdown Chrome for Chrome Web Store submission with icons, manifest metadata, README updates, listing materials, and a release ZIP workflow.

**Architecture:** Keep the extension runtime unchanged except for manifest icon metadata. Add deterministic vector icon source and exported PNG sizes under `icons/`, store listing copy under `store-listing/`, and a Node release script that packages only production extension files into `dist/`.

**Tech Stack:** Chrome MV3 manifest, Node.js ESM scripts, SVG source icon, PNG export through macOS `sips`, existing Node test runner and Playwright verification.

---

### Task 1: Icon Assets

**Files:**
- Create: `icons/icon.svg`
- Create: `icons/icon-16.png`
- Create: `icons/icon-32.png`
- Create: `icons/icon-48.png`
- Create: `icons/icon-128.png`
- Modify: `manifest.json`
- Test: `tests/manifest.test.js`

- [ ] Add a modern vector source icon that communicates Markdown editing, task completion, and diagram rendering.
- [ ] Export PNG sizes required by the Chrome manifest.
- [ ] Add `icons` entries to `manifest.json`.
- [ ] Update manifest tests to assert all icon paths exist.

### Task 2: Release Packaging

**Files:**
- Create: `scripts/build-release.js`
- Modify: `package.json`
- Test: `scripts/build-release.js`

- [ ] Add a Node script that creates `dist/markdown-chrome-<version>.zip`.
- [ ] Package only `manifest.json`, `src/`, `vendor/`, and `icons/`.
- [ ] Add `npm run build:release`.
- [ ] Verify the ZIP excludes `node_modules`, `tests`, `docs`, and store listing materials.

### Task 3: README and Store Listing Materials

**Files:**
- Modify: `README.md`
- Create: `store-listing/chrome-web-store-listing.md`
- Create: `store-listing/privacy-practices.md`
- Create: `store-listing/test-instructions.md`
- Create: `store-listing/release-checklist.md`

- [ ] Rewrite README with features, local file permissions, task checkbox behavior, Mermaid rendering, export, verification, release packaging, and agent skill usage.
- [ ] Add Chrome Web Store title, summary, detailed description, category, single purpose, permission justification, privacy language, screenshots checklist, and test instructions.
- [ ] Keep store listing statements aligned with actual extension behavior: local Markdown only, no remote upload, no analytics, no ads.

### Task 4: Verification

**Files:**
- Existing verification scripts and package scripts.

- [ ] Run `npm test`.
- [ ] Run `npm run verify:static`.
- [ ] Run `npm run verify:viewer`.
- [ ] Run `npm run build:release`.
- [ ] Run Chrome `--pack-extension="$PWD"`.
- [ ] Remove generated `.crx` and `.pem` artifacts after pack validation.
