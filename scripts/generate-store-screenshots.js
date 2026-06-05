import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const chromePath =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viewerPath = resolve('src/viewer/viewer.html');
const outputDir = resolve('store-listing/screenshots');

const sampleMarkdown = `# Product Release Notes

Edit Markdown on the left and review the rendered document on the right.

## Launch Checklist

- [x] Render GitHub Flavored Markdown
- [x] Preview Mermaid diagrams
- [ ] Export store-ready HTML and PDF

| Feature | Status |
| --- | --- |
| Folder browser | Ready |
| Task checkboxes | Interactive |
| Dark theme | Ready |

\`\`\`mermaid
graph TD
  A[Open Markdown] --> B[Edit]
  B --> C[Preview]
  C --> D[Export]
\`\`\`
`;

const previewMarkdown = `# Interactive Markdown Preview

Use Markdown Chrome to inspect local notes without leaving Chrome.

- [x] Open local Markdown files
- [ ] Click rendered task checkboxes
- [x] Export the rendered page

\`\`\`mermaid
graph LR
  File[Local File] --> Viewer[Chrome Viewer]
  Viewer --> Save[Save Back]
\`\`\`
`;

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--allow-file-access-from-files'],
});

try {
  await capture('01-split-editor-preview.png', async (page) => {
    await loadViewer(page);
    await setMarkdown(page, sampleMarkdown);
    await page.locator('[data-mode="split"]').click();
    await page.waitForSelector('.mermaid svg.flowchart');
  });

  await capture('02-folder-tree-light.png', async (page) => {
    await loadViewer(page);
    await page.locator('#themeToggleButton').click();
    await page.evaluate(() => {
      document.querySelector('#folderName').textContent = 'Workspace Notes';
      const appLayout = document.querySelector('#appLayout');
      const fileTree = document.querySelector('#fileTree');
      appLayout.classList.remove('sidebar-collapsed');
      appLayout.style.setProperty('--sidebar-width', '340px');
      fileTree.innerHTML = `
        <button class="tree-folder" type="button" aria-expanded="true">▾ product</button>
        <div class="tree-children">
          <button class="tree-file is-active" type="button">release-notes.md</button>
          <button class="tree-file" type="button">customer-feedback-summary.md</button>
        </div>
        <button class="tree-folder" type="button" aria-expanded="true">▾ diagrams</button>
        <div class="tree-children">
          <button class="tree-file" type="button">architecture-mermaid-flow.md</button>
          <button class="tree-file" type="button">markdown-task-checklist.md</button>
        </div>
      `;
    });
    await setMarkdown(page, sampleMarkdown);
    await page.waitForSelector('.tree-file.is-active');
  });

  await capture('03-preview-task-checkboxes.png', async (page) => {
    await loadViewer(page);
    await setMarkdown(page, previewMarkdown);
    await page.locator('[data-mode="preview"]').click();
    await page.waitForSelector('.markdown-body li input[type="checkbox"]');
    await page.locator('.markdown-body li input[type="checkbox"]').nth(1).click();
    await page.waitForFunction(() => document.querySelector('#editor').value.includes('- [x] Click rendered task checkboxes'));
  });

  await capture('04-export-and-mermaid.png', async (page) => {
    await loadViewer(page);
    await setMarkdown(page, sampleMarkdown);
    await page.locator('[data-mode="preview"]').click();
    await page.waitForSelector('.mermaid svg.flowchart');
    await page.evaluate(() => window.scrollTo(0, 0));
  });
} finally {
  await browser.close();
}

async function capture(fileName, setup) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await setup(page);
  await page.screenshot({
    path: resolve(outputDir, fileName),
    fullPage: false,
    omitBackground: false,
  });
  await page.close();
}

async function loadViewer(page) {
  await page.goto(`file://${viewerPath}`);
  await page.waitForSelector('#editor');
  await page.waitForSelector('#preview');
}

async function setMarkdown(page, markdown) {
  await page.locator('#editor').fill(markdown);
  await page.waitForSelector('article.markdown-body');
  await page.waitForFunction(
    () => document.querySelector('#preview').textContent.includes('Product Release Notes') ||
      document.querySelector('#preview').textContent.includes('Interactive Markdown Preview'),
  );
}
