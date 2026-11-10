import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { projectSchema, finished } from '../src/schema.js';
import { Store } from '../src/store.js';
import { Runner, cleanUrl } from '../src/runner.js';

test('runs real API assertions, preserves snapshots, and reports failures accurately', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'testrill-runner-'));
  const store = new Store(dir);
  const runner = new Runner(store);
  const config = projectSchema.parse({
    version: 1,
    id: 'api',
    name: 'API',
    baseUrl: 'http://127.0.0.1:1',
    suites: [
      {
        id: 'contract',
        name: 'Contract',
        steps: [
          {
            type: 'request',
            url: '{{mockUrl}}/api',
            expectStatus: 200,
            expectBodyIncludes: 'hello',
          },
        ],
      },
    ],
    scenarios: [
      {
        id: 'ok',
        name: 'OK',
        routes: [{ method: 'GET', path: '/api', body: { message: 'hello' } }],
      },
    ],
  });
  const project = { config, root: dir, updatedAt: new Date().toISOString() };
  try {
    const started = runner.start(project, config.suites[0], config.scenarios[0]);
    while (!finished(store.run(started.id)!.status)) await delay(10);
    const run = store.run(started.id)!;
    assert.equal(run.status, 'passed');
    assert.equal(run.completedSteps, 1);
    assert.equal(run.artifacts.length, 1);
    const requests = JSON.parse(
      readFileSync(join(dir, 'artifacts', run.id, 'network.json'), 'utf8'),
    );
    assert.equal(requests[0].status, 200);
    assert.equal(run.configSnapshot.scenario?.id, 'ok');
    const bad = structuredClone(config.scenarios[0]);
    bad.routes[0].status = 500;
    const failed = runner.start(project, config.suites[0], bad);
    while (!finished(store.run(failed.id)!.status)) await delay(10);
    assert.equal(store.run(failed.id)!.status, 'failed');
    assert.match(store.run(failed.id)!.error!, /received 500/);
    const external = {
      ...config.suites[0],
      steps: [
        {
          type: 'request' as const,
          method: 'GET' as const,
          url: 'https://example.org',
          expectStatus: 200,
          timeoutMs: 1000,
        },
      ],
    };
    const rejected = runner.start(project, external);
    while (!finished(store.run(rejected.id)!.status)) await delay(10);
    assert.match(store.run(rejected.id)!.error!, /project or scenario origin/);
  } finally {
    await runner.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test('redacts credential-like URL query values', () => {
  assert.doesNotMatch(cleanUrl('https://example.test/?token=secret&name=public'), /secret/);
});
