import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = await readFile('src/background/service-worker.js', 'utf8');

test('opens the viewer when the toolbar action is clicked', () => {
  let actionListener = null;
  let createdTab = null;

  const context = {
    chrome: {
      action: {
        onClicked: {
          addListener(listener) {
            actionListener = listener;
          },
        },
      },
      runtime: {
        getURL(path) {
          return `chrome-extension://abc123/${path}`;
        },
      },
      tabs: {
        create(tab) {
          createdTab = tab;
        },
      },
    },
  };

  vm.runInNewContext(script, context);
  actionListener();

  assert.equal(createdTab.url, 'chrome-extension://abc123/src/viewer/viewer.html');
});
