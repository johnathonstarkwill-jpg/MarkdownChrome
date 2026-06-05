# Release Checklist

Run this checklist before submitting to the Chrome Web Store.

## Required Local Checks

- [ ] `npm test`
- [ ] `npm run verify:static`
- [ ] `npm run verify:viewer`
- [ ] `npm run store:screenshots`
- [ ] `npm run build:release`
- [ ] Chrome pack validation:

```bash
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --pack-extension="$PWD"
```

- [ ] Remove generated `.crx` and `.pem` after pack validation unless intentionally keeping them.
- [ ] Confirm `dist/markdown-chrome-<version>.zip` does not contain `node_modules`, `tests`, `docs`, or `store-listing`.

## Dashboard Materials

- [ ] Extension ZIP: `dist/markdown-chrome-<version>.zip`
- [ ] Extension icon: use `icons/icon-128.png` where dashboard asks for an icon.
- [ ] Store screenshots prepared from `store-listing/screenshots/`.
- [ ] Short description copied from `chrome-web-store-listing.md`.
- [ ] Detailed description copied from `chrome-web-store-listing.md`.
- [ ] Single purpose copied from `chrome-web-store-listing.md`.
- [ ] Permission justification copied from `chrome-web-store-listing.md`.
- [ ] Test instructions copied from `test-instructions.md`.
- [ ] Public privacy policy URL created from `privacy-practices.md`.
- [ ] Developer support email filled in.
- [ ] Distribution countries and visibility selected.

## Policy Review

- [ ] Listing describes one clear purpose: local Markdown viewing, editing, rendering, saving, and exporting.
- [ ] Listing does not claim remote sync, collaboration, AI, cloud backup, or other unsupported features.
- [ ] Privacy fields match actual behavior.
- [ ] No remote JavaScript is used.
- [ ] Permissions are limited to the implemented workflow.
- [ ] Screenshots show actual extension UI.

Official references:

- https://developer.chrome.com/webstore/publish
- https://developer.chrome.com/docs/webstore/program-policies/policies
- https://developer.chrome.com/docs/extensions/develop/ui/configure-icons
- https://developer.chrome.com/docs/webstore/images
