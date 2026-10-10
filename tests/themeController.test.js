import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeTheme } from '../js/controller/themeController.js';

test('theme toggle applies, persists, and restores the selected theme', () => {
  const storage = new Map([['studytrack.theme', 'dark']]);
  const attributes = new Map();
  const listeners = new Map();
  const button = {
    setAttribute: (name, value) => attributes.set(name, value),
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  const root = { dataset: {} };
  const originalLocalStorage = globalThis.localStorage;
  const originalDocument = globalThis.document;
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  globalThis.document = {
    documentElement: root,
    querySelectorAll: () => [button],
  };

  try {
    initializeTheme();
    assert.equal(root.dataset.theme, 'dark');
    assert.equal(button.textContent, '☀');
    assert.equal(attributes.get('aria-pressed'), 'true');

    listeners.get('click')();
    assert.equal(root.dataset.theme, 'light');
    assert.equal(storage.get('studytrack.theme'), 'light');
    assert.equal(attributes.get('aria-label'), 'Switch to dark theme');
  } finally {
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
