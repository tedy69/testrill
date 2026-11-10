import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startScenario } from '../src/scenario-server.js';
import { scenarioSchema } from '../src/schema.js';

test('streams only after a checkpoint and resumes after a known event ID', async () => {
  const scenario = scenarioSchema.parse({
    id: 'test',
    name: 'Checkpoint',
    routes: [
      {
        method: 'GET',
        path: '/events',
        stream: [
          { type: 'event', id: '1', data: 'first' },
          { type: 'checkpoint', name: 'continue' },
          { type: 'event', id: '2', data: 'second' },
        ],
      },
    ],
  });
  const logs: string[] = [];
  const server = await startScenario(scenario, (message) => logs.push(message));
  try {
    const response = await fetch(`${server.url}/events`);
    const reader = response.body!.getReader();
    const first = await reader.read();
    assert.match(new TextDecoder().decode(first.value), /data: first/);
    assert.equal(logs.includes('Event delivered: 2'), false);
    server.release('continue');
    let tail = '';
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      tail += new TextDecoder().decode(part.value);
    }
    assert.match(tail, /data: second/);
    const resumed = await fetch(`${server.url}/events`, { headers: { 'Last-Event-ID': '1' } });
    const text = await resumed.text();
    assert.doesNotMatch(text, /data: first/);
    assert.match(text, /data: second/);
  } finally {
    await server.close();
  }
});
test('closes a waiting connection during shutdown and rejects unmatched routes', async () => {
  const server = await startScenario(
    scenarioSchema.parse({
      id: 'waiting',
      name: 'Waiting',
      routes: [{ method: 'GET', path: '/events', stream: [{ type: 'checkpoint', name: 'never' }] }],
    }),
    () => {},
  );
  assert.equal((await fetch(`${server.url}/missing`)).status, 404);
  const response = await fetch(`${server.url}/events`);
  const read = response.text();
  await server.close();
  await assert.rejects(read);
});
