import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { projectSchema, finished, type Run } from '../src/schema.js';
import { Store } from '../src/store.js';
import { Runner } from '../src/runner.js';

test('executes a repository command, retains its output, and cancels an active process', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'rehearsal-command-'));
  const store = new Store(directory);
  const runner = new Runner(store);
  const config = projectSchema.parse({
    version: 1,
    id: 'external',
    name: 'External',
    baseUrl: 'http://127.0.0.1:1',
    suites: [
      {
        id: 'command',
        name: 'Existing tests',
        runner: {
          type: 'command',
          command: [process.execPath, '-e', 'console.log("assertions completed")'],
        },
      },
    ],
  });
  const project = { config, root: directory, updatedAt: new Date().toISOString() };
  const wait = async (run: Run) => {
    while (!finished(store.run(run.id)!.status)) await delay(10);
    return store.run(run.id)!;
  };
  try {
    const passed = await wait(runner.start(project, config.suites[0]));
    assert.equal(passed.status, 'passed');
    assert.ok(passed.artifacts.some((item) => item.file === 'runner-output.json'));
    const long = structuredClone(config.suites[0]);
    long.runner = {
      type: 'command',
      command: [process.execPath, '-e', 'setInterval(()=>{},1000)'],
      timeoutMs: 60_000,
    };
    const running = runner.start(project, long);
    await delay(100);
    runner.cancel(running.id);
    assert.equal((await wait(running)).status, 'cancelled');
    const missing = structuredClone(config.suites[0]);
    missing.runner = {
      type: 'command',
      command: ['rehearsal-nonexistent-test-runner'],
      timeoutMs: 1000,
    };
    assert.equal((await wait(runner.start(project, missing))).status, 'blocked');
  } finally {
    await runner.close();
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
