import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { Environments } from '../src/environments.js';
import { projectSchema } from '../src/schema.js';

test('environment readiness preserves external services and stops only an owned process', async () => {
  const external = createServer((_req, res) => res.end('ready'));
  await new Promise<void>((resolve) => external.listen(0, '127.0.0.1', resolve));
  const address = external.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  const config = projectSchema.parse({
    version: 1,
    id: 'environment',
    name: 'Environment',
    baseUrl: url,
    suites: [{ id: 'api', name: 'API', steps: [{ type: 'request', url: '/', expectStatus: 200 }] }],
  });
  const project = { config, root: process.cwd(), updatedAt: new Date().toISOString() };
  const environments = new Environments();
  try {
    const ready = await environments.start(project);
    assert.equal(ready.status, 'ready');
    assert.equal(ready.pid, undefined);
    environments.stop(config.id);
    assert.equal((await fetch(url)).status, 200);
    external.closeAllConnections();
    await new Promise<void>((resolve) => external.close(() => resolve()));
    project.config.environment = {
      command: [
        process.execPath,
        '-e',
        `require('node:http').createServer((q,s)=>s.end('owned')).listen(${address.port},'127.0.0.1')`,
      ],
    };
    const owned = await environments.start(project);
    assert.equal(owned.status, 'ready');
    assert.ok(owned.pid);
    environments.stop(config.id);
    let stopped = false;
    for (let i = 0; i < 30; i++) {
      try {
        await fetch(url, { signal: AbortSignal.timeout(200) });
      } catch {
        stopped = true;
        break;
      }
      await delay(50);
    }
    assert.equal(stopped, true);
  } finally {
    environments.close();
    if (external.listening) await new Promise<void>((resolve) => external.close(() => resolve()));
  }
});
