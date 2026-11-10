import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { startEngine } from '../src/server.js';
import { ApiClient } from '../src/client.js';
import type { Run } from '../src/schema.js';
import { finished } from '../src/schema.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

test('authenticated HTTP, live run lifecycle, export, and MCP use the same engine', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'testrill-http-'));
  const engine = await startEngine({ directory });
  const client = new ApiClient(engine.connection);
  try {
    await assert.rejects(startEngine({ directory }), /already owns this workspace/);
    assert.equal((await fetch(`${engine.connection.url}/api/projects`)).status, 401);
    assert.equal(
      (
        await fetch(`${engine.connection.url}/api/projects`, {
          headers: {
            Origin: 'https://untrusted.example',
            Authorization: `Bearer ${engine.connection.token}`,
          },
        })
      ).status,
      403,
    );
    let run = await client.request<Run>('POST', '/api/runs', {
      projectId: 'example-storefront',
      suiteId: 'api',
    });
    while (!finished(run.status)) {
      await delay(20);
      run = await client.request<Run>('GET', `/api/runs/${run.id}`);
    }
    assert.equal(run.status, 'passed');
    const exported = await client.fetch('GET', `/api/runs/${run.id}/export`);
    assert.equal(exported.headers.get('content-type'), 'application/zip');
    assert.ok((await exported.arrayBuffer()).byteLength > 100);
    const mcp = new Client({ name: 'integration-test', version: '1' });
    await mcp.connect(
      new StreamableHTTPClientTransport(new URL(`${engine.connection.url}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${engine.connection.token}` } },
      }),
    );
    try {
      const tools = await mcp.listTools();
      assert.ok(tools.tools.some((tool) => tool.name === 'run_suite'));
      const result = await mcp.callTool({ name: 'inspect_run', arguments: { runId: run.id } });
      assert.equal(result.isError, undefined);
      assert.match(JSON.stringify(result.content), /passed/);
    } finally {
      await mcp.close();
    }
  } finally {
    await engine.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
