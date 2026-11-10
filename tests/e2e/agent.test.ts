import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { startEngine } from '../../src/server.js';

test(
  'built CLI works outside the repository and MCP stdio reads its evidence',
  { timeout: 60_000 },
  async () => {
    const directory = mkdtempSync(join(tmpdir(), 'rehearsal-agent-'));
    const engine = await startEngine({ directory });
    const entry = resolve('dist-engine/main.cjs');
    const client = new Client({ name: 'agent-integration', version: '1' });
    try {
      const result = await promisify(execFile)(
        process.execPath,
        [entry, 'run', 'example-storefront', 'checkout', '--json', '--data', directory],
        { cwd: directory, timeout: 30_000 },
      );
      const run = JSON.parse(result.stdout);
      assert.equal(run.status, 'passed');
      assert.ok(run.artifacts.some((artifact: { type: string }) => artifact.type === 'trace'));
      await client.connect(
        new StdioClientTransport({
          command: process.execPath,
          args: [entry, 'mcp', '--data', directory],
          cwd: directory,
          stderr: 'pipe',
        }),
      );
      const tools = await client.listTools();
      assert.ok(tools.tools.some((tool) => tool.name === 'update_project'));
      const inspected = await client.callTool({
        name: 'inspect_run',
        arguments: { runId: run.id },
      });
      assert.notEqual(inspected.isError, true);
      const image = run.artifacts.find((artifact: { type: string }) => artifact.type === 'image');
      const artifact = await client.callTool({
        name: 'get_artifact',
        arguments: { runId: run.id, artifactId: image.id },
      });
      assert.equal((artifact.content as { type: string }[])[0].type, 'image');
    } finally {
      await client.close();
      await engine.close();
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
