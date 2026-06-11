import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';

const chromePath =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viewerPath = resolve('src/viewer/viewer.html');

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--allow-file-access-from-files'],
});

try {
  await verifyRenderedMermaid(`file://${viewerPath}`, /Markdown Chrome/);

  const readmeSource = `file://${resolve('README.md')}`;
  await verifyRenderedMermaid(
    `file://${viewerPath}?source=${encodeURIComponent(readmeSource)}`,
    /Mermaid diagrams render from fenced code blocks:/,
  );

  console.log('Viewer runtime verification rendered default and README Mermaid SVG.');
} finally {
  await browser.close();
}

async function verifyRenderedMermaid(url, expectedText) {
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector('article.markdown-body');
  await page.waitForSelector('.mermaid svg.flowchart', { timeout: 10000 });
  await page.waitForSelector('#openFolderButton');
  await page.waitForSelector('#toggleFilesButton');
  await page.waitForSelector('#revealSidebarButton');
  await page.waitForSelector('#sidebarResizeHandle');
  await page.waitForSelector('#themeToggleButton');
  await page.waitForSelector('[data-markdown-action="mermaid"]');
  await page.waitForSelector('#exportHtmlButton');
  await page.waitForSelector('#exportPdfButton');

  const bodyText = await page.locator('article.markdown-body').innerText();
  const mermaidSvgCount = await page.locator('.mermaid svg.flowchart').count();
  const mermaidErrorCount = await page.locator('.mermaid-error').count();

  assert.match(bodyText, expectedText);
  assert.ok(mermaidSvgCount > 0);
  assert.equal(mermaidErrorCount, 0);

  await page.locator('#toggleFilesButton').click();
  assert.equal(await page.locator('#appLayout').evaluate((node) => node.classList.contains('sidebar-collapsed')), false);
  await page.locator('#toggleSidebarButton').click();
  assert.equal(await page.locator('#appLayout').evaluate((node) => node.classList.contains('sidebar-collapsed')), true);
  await expectVisible(page, '#revealSidebarButton');
  const revealBox = await page.locator('#revealSidebarButton').boundingBox();
  assert.ok(revealBox.width <= 20);
  assert.ok(revealBox.height <= 40);
  await page.locator('#revealSidebarButton').click();
  assert.equal(await page.locator('#appLayout').evaluate((node) => node.classList.contains('sidebar-collapsed')), false);
  await verifySidebarResize(page);
  await verifyThemeToggle(page);
  await verifyLongFileTreeNamesDoNotOverlap(page);
  await verifyPreviewTaskCheckboxUpdatesMarkdown(page);
  await verifyCitationsAndLatexRender(page);

  await page.close();
}

async function expectVisible(page, selector) {
  assert.equal(await page.locator(selector).isVisible(), true);
}

async function verifySidebarResize(page) {
  const handle = page.locator('#sidebarResizeHandle');
  const before = await page.locator('#appLayout').evaluate((node) => getComputedStyle(node).getPropertyValue('--sidebar-width').trim());
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + box.height / 2);
  await page.mouse.up();
  const after = await page.locator('#appLayout').evaluate((node) => getComputedStyle(node).getPropertyValue('--sidebar-width').trim());

  assert.notEqual(after, before);
}

async function verifyThemeToggle(page) {
  const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('#themeToggleButton').click();
  const nextTheme = await page.evaluate(() => document.documentElement.dataset.theme);

  assert.notEqual(nextTheme, initialTheme);
  assert.ok(['light', 'dark'].includes(nextTheme));
}

async function verifyLongFileTreeNamesDoNotOverlap(page) {
  await page.evaluate(() => {
    const fileTree = document.querySelector('#fileTree');
    const appLayout = document.querySelector('#appLayout');
    appLayout.classList.remove('sidebar-collapsed');
    fileTree.innerHTML = `
      <button class="tree-file" type="button">
        this-is-a-very-long-markdown-file-name-without-natural-breaks-that-should-wrap-or-clip-instead-of-covering-the-next-file.md
      </button>
      <button class="tree-file" type="button">next-file.md</button>
    `;
  });

  const boxes = await page.locator('.tree-file').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    }),
  );

  assert.ok(boxes[0].height > 0);
  assert.ok(boxes[1].top >= boxes[0].bottom);

  const hasHorizontalOverflow = await page.locator('.tree-file').first().evaluate((node) => node.scrollWidth > node.clientWidth);
  assert.equal(hasHorizontalOverflow, false);
}

async function verifyPreviewTaskCheckboxUpdatesMarkdown(page) {
  const editor = page.locator('#editor');

  await editor.fill('- [ ] Rendered task\n- [x] Finished task');
  await page.waitForSelector('.markdown-body li input[type="checkbox"]');

  const firstTask = page.locator('.markdown-body li input[type="checkbox"]').first();
  assert.equal(await firstTask.isDisabled(), false);
  assert.equal(await firstTask.isChecked(), false);

  await firstTask.click();
  await page.waitForFunction(() => document.querySelector('#editor').value.startsWith('- [x] Rendered task'));

  assert.equal(await editor.inputValue(), '- [x] Rendered task\n- [x] Finished task');
}

async function verifyCitationsAndLatexRender(page) {
  const editor = page.locator('#editor');

  await editor.fill([
    '# Research Notes',
    '',
    'Reference citeturn7view2turn13view0 should not show raw tokens.',
    '',
    'Inline math $E = mc^2$ and display math:',
    '',
    '$$',
    '\\\\int_0^1 x^2 dx = \\\\frac{1}{3}',
    '$$',
    '',
    '```text',
    'Do not transform code citeturn1view0 or $x$.',
    '```',
  ].join('\n'));

  await page.waitForSelector('.source-citation');
  await page.waitForSelector('.citation-list li');
  await page.waitForSelector('.katex');

  const bodyText = await page.locator('article.markdown-body').innerText();
  assert.match(bodyText, /Research Notes/);
  assert.doesNotMatch(bodyText, /citeturn7view2/);

  const citationHref = await page.locator('.source-citation').first().getAttribute('href');
  assert.equal(citationHref, '#citation-ref-1');
  await page.locator('.source-citation').first().click();
  await page.waitForFunction(() => window.location.hash === '#citation-ref-1');

  const citationText = await page.locator('#citation-ref-1').innerText();
  assert.match(citationText, /turn7view2/);
  assert.match(citationText, /turn13view0/);

  const codeText = await page.locator('article.markdown-body pre code').innerText();
  assert.match(codeText, /citeturn1view0/);
  assert.match(codeText, /\$x\$/);
}
