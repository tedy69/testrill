import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectSchema } from '../src/schema.js';
import { Store } from '../src/store.js';
import { mkdtempSync, rmSync, renameSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const config = {
  version: 1,
  id: 'test',
  name: 'Example',
  baseUrl: 'http://localhost:3000',
  suites: [{ id: 'api', name: 'API', steps: [{ type: 'request', url: '/', expectStatus: 200 }] }],
};
test('all published manifest examples satisfy the runtime contract', () => {
  for (const example of ['http', 'existing-tests', 'mobile']) {
    projectSchema.parse(JSON.parse(readFileSync(`examples/${example}/testrill.json`, 'utf8')));
  }
});
test('rejects duplicate suite IDs, missing scenarios, and non-http URLs', () => {
  assert.equal(projectSchema.safeParse(config).success, true);
  assert.equal(projectSchema.safeParse({ ...config, baseUrl: 'file:///tmp' }).success, false);
  assert.equal(
    projectSchema.safeParse({ ...config, suites: [...config.suites, ...config.suites] }).success,
    false,
  );
  assert.equal(
    projectSchema.safeParse({
      ...config,
      suites: [{ ...config.suites[0], defaultScenario: 'missing' }],
    }).success,
    false,
  );
});
test('creates a Testrill database and preserves a legacy workspace through restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'testrill-store-'));
  let store = new Store(dir);
  try {
    store.saveProject({
      config: projectSchema.parse(config),
      root: dir,
      updatedAt: new Date().toISOString(),
    });
    assert.equal(existsSync(join(dir, 'testrill.sqlite')), true);
    store.close();
    renameSync(join(dir, 'testrill.sqlite'), join(dir, 'rehearsal.sqlite'));
    store = new Store(dir);
    assert.equal(store.project('test')?.config.name, 'Example');
    assert.equal(existsSync(join(dir, 'testrill.sqlite')), false);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
