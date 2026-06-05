import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

test('declares a toolbar action that opens the Markdown viewer', () => {
  assert.equal(manifest.action.default_title, 'Open Markdown Chrome');
  assert.equal(manifest.background.service_worker, 'src/background/service-worker.js');
});

test('declares Chrome Web Store ready icon assets', async () => {
  assert.deepEqual(manifest.icons, {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  });

  await Promise.all(Object.values(manifest.icons).map((iconPath) => access(iconPath)));
});
