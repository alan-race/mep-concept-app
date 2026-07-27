import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('room editor does not block delegated button clicks', () => {
  assert.doesNotMatch(app, /onclick=["']event\.stopPropagation\(\)["']/);
  assert.match(app, /data-action="save-room"/);
  assert.match(app, /data-action="close-modal"/);
});

test('backdrop closes only when the backdrop itself is tapped', () => {
  assert.match(app, /action === 'close-modal-backdrop' && event\.target !== target/);
});
