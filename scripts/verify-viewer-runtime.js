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
  await page.waitForSelector('.mermaid svg', { timeout: 10000 });
  await page.waitForSelector('#openFolderButton');
  await page.waitForSelector('#toggleFilesButton');
  await page.waitForSelector('#refreshButton');
  await page.waitForSelector('#revealSidebarButton');
  await page.waitForSelector('#sidebarResizeHandle');
  await page.waitForSelector('#themeToggleButton');
  await page.waitForSelector('[data-markdown-action="mermaid"]');
  await page.waitForSelector('#exportHtmlButton');
  await page.waitForSelector('#exportPdfButton');

  const bodyText = await page.locator('article.markdown-body').innerText();
  const mermaidSvgCount = await page.locator('.mermaid svg').count();
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
  await verifyBeautifulMermaidAndOfficialFallback(page);
  await verifyDroppedMarkdownFileOpens(page);
  await verifyDroppedMarkdownFolderOpens(page);
  await verifyMissingWorkspaceFileClickIsHandled(page);
  await verifyExternalFileRefresh(page);

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

async function verifyBeautifulMermaidAndOfficialFallback(page) {
  const editor = page.locator('#editor');

  await editor.fill([
    '# Beautiful Mermaid',
    '',
    '```mermaid',
    'graph TD',
    '  A[Fast] --> B[Pretty]',
    '```',
  ].join('\n'));

  await page.waitForSelector('.mermaid.mermaid-beautiful svg', { timeout: 10000 });
  assert.equal(await page.locator('.mermaid.mermaid-beautiful').count(), 1);

  await editor.fill([
    '# Mermaid Fallback',
    '',
    '```mermaid',
    'pie title Pets',
    '  "Cats" : 4',
    '  "Dogs" : 6',
    '```',
  ].join('\n'));

  await page.waitForFunction(() => document.querySelector('article.markdown-body')?.innerText.includes('Mermaid Fallback'));
  await page.waitForSelector('.mermaid:not(.mermaid-beautiful) svg', { timeout: 10000 });
  assert.equal(await page.locator('.mermaid.mermaid-beautiful').count(), 0);
  assert.equal(await page.locator('.mermaid-error').count(), 0);
}

async function verifyDroppedMarkdownFileOpens(page) {
  await page.evaluate(() => {
    const file = new File(['# Dropped Markdown\n\nOpened from drag and drop.'], 'dropped-note.md', {
      type: 'text/markdown',
      lastModified: 1,
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.querySelector('#appLayout').dispatchEvent(new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    }));
  });

  await page.waitForFunction(() => document.querySelector('#editor').value.includes('Dropped Markdown'));
  assert.equal(await page.locator('#fileName').innerText(), 'dropped-note.md');

  const bodyText = await page.locator('article.markdown-body').innerText();
  assert.match(bodyText, /Opened from drag and drop/);
}

async function verifyDroppedMarkdownFolderOpens(page) {
  await page.evaluate(() => {
    function fileHandle(name, text, lastModified = 1) {
      return {
        kind: 'file',
        name,
        async getFile() {
          return new File([text], name, {
            type: 'text/markdown',
            lastModified,
          });
        },
      };
    }

    function directoryHandle(name, entries) {
      return {
        kind: 'directory',
        name,
        async *entries() {
          for (const [entryName, handle] of Object.entries(entries)) {
            yield [entryName, handle];
          }
        },
      };
    }

    const directory = directoryHandle('Dropped Docs', {
      'README.md': fileHandle('README.md', '# Dropped Folder\n\nOpened from a dropped folder.'),
      'notes.txt': fileHandle('notes.txt', 'Ignore me'),
      docs: directoryHandle('docs', {
        'guide.markdown': fileHandle('guide.markdown', '# Guide'),
      }),
    });

    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        files: [],
        items: [
          {
            kind: 'file',
            type: '',
            getAsFile() {
              return null;
            },
            async getAsFileSystemHandle() {
              return directory;
            },
          },
        ],
      },
    });
    document.querySelector('#appLayout').dispatchEvent(event);
  });

  await page.waitForFunction(() => document.querySelector('#folderName').textContent === 'Dropped Docs');
  assert.equal((await page.locator('#folderName').innerText()).toLowerCase(), 'dropped docs');
  assert.equal(await page.locator('#appLayout').evaluate((node) => node.classList.contains('sidebar-collapsed')), false);

  const fileNames = await page.locator('#fileTree .tree-file').evaluateAll((nodes) => nodes.map((node) => node.textContent));
  assert.deepEqual(fileNames.sort(), ['guide.markdown', 'README.md'].sort());

  await page.locator('#fileTree .tree-file', { hasText: 'README.md' }).click();
  await page.waitForFunction(() => document.querySelector('#fileName').textContent === 'README.md');

  const bodyText = await page.locator('article.markdown-body').innerText();
  assert.match(bodyText, /Opened from a dropped folder/);
}

async function verifyMissingWorkspaceFileClickIsHandled(page) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.evaluate(() => {
    function fileHandle(name, text, { missing = false } = {}) {
      return {
        kind: 'file',
        name,
        async getFile() {
          if (missing) {
            throw new DOMException(
              'A requested file or directory could not be found at the time an operation was processed.',
              'NotFoundError',
            );
          }

          return new File([text], name, {
            type: 'text/markdown',
            lastModified: 1,
          });
        },
      };
    }

    const directory = {
      kind: 'directory',
      name: 'Missing File Case',
      async *entries() {
        yield ['a-valid.md', fileHandle('a-valid.md', '# Valid file')];
        yield ['z-missing.md', fileHandle('z-missing.md', '', { missing: true })];
      },
    };

    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        files: [],
        items: [
          {
            kind: 'file',
            type: '',
            getAsFile() {
              return null;
            },
            async getAsFileSystemHandle() {
              return directory;
            },
          },
        ],
      },
    });
    document.querySelector('#appLayout').dispatchEvent(event);
  });

  await page.waitForFunction(() => document.querySelector('#fileName').textContent === 'a-valid.md');
  await page.locator('#fileTree .tree-file', { hasText: 'z-missing.md' }).click();
  await page.waitForFunction(
    () => document.querySelector('#status').textContent.includes('moved or deleted'),
    null,
    { timeout: 5000 },
  );

  assert.deepEqual(pageErrors, []);
}

async function verifyExternalFileRefresh(page) {
  await page.evaluate(() => {
    let fileName = 'live.md';
    let fileText = '# Initial live file';
    let lastModified = 10;
    let isMissing = false;

    window.__setFakeMarkdownFile = (nextName, nextText, nextLastModified) => {
      fileName = nextName;
      fileText = nextText;
      lastModified = nextLastModified;
      isMissing = false;
    };

    window.__setFakeMarkdownMissing = () => {
      isMissing = true;
    };

    window.showOpenFilePicker = async () => [
      {
        kind: 'file',
        get name() {
          return fileName;
        },
        async getFile() {
          if (isMissing) {
            throw new DOMException(
              'A requested file or directory could not be found at the time an operation was processed.',
              'NotFoundError',
            );
          }

          return new File([fileText], fileName, {
            type: 'text/markdown',
            lastModified,
          });
        },
        async queryPermission() {
          return 'granted';
        },
        async requestPermission() {
          return 'granted';
        },
        async createWritable() {
          return {
            async write(text) {
              fileText = text;
              lastModified += 1;
            },
            async close() {},
          };
        },
      },
    ];
  });

  await page.locator('#openButton').click();
  await page.waitForFunction(() => document.querySelector('#editor').value.includes('Initial live file'));
  assert.equal(await page.locator('#fileName').innerText(), 'live.md');
  await page.evaluate(() => {
    window.__confirmResponse = true;
    window.__lastConfirmMessage = '';
    window.confirm = (message) => {
      window.__lastConfirmMessage = message;
      return window.__confirmResponse;
    };
  });

  await page.evaluate(() => {
    window.__setFakeMarkdownFile('renamed-live.md', '# Updated live file', 20);
  });
  await page.locator('#refreshButton').click();

  await page.waitForFunction(
    () => document.querySelector('#editor').value.includes('Updated live file')
      && document.querySelector('#fileName').textContent === 'renamed-live.md',
    null,
    { timeout: 5000 },
  );

  await page.locator('#editor').fill('# Local unsaved edit');
  await page.evaluate(() => {
    window.__setFakeMarkdownFile('renamed-live.md', '# Disk conflict version', 30);
    window.__confirmResponse = false;
  });

  await page.locator('#refreshButton').click();
  const cancelMessage = await page.evaluate(() => window.__lastConfirmMessage);
  assert.match(cancelMessage, /unsaved (edits|changes)/i);
  assert.equal(await page.locator('#editor').inputValue(), '# Local unsaved edit');

  await page.evaluate(() => {
    window.__confirmResponse = true;
  });
  await page.locator('#refreshButton').click();
  await page.waitForFunction(() => document.querySelector('#editor').value.includes('Disk conflict version'));

  await page.evaluate(() => {
    window.__setFakeMarkdownMissing();
  });
  await page.locator('#refreshButton').click();
  await page.waitForFunction(
    () => document.querySelector('#status').textContent.includes('moved or deleted'),
    null,
    { timeout: 5000 },
  );
}
