import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { startEngine } from './server.js';
import { connect, dataDirectory, saveExport } from './client.js';
import { createMcpServer } from './mcp.js';
import { finished, type Run } from './schema.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift() ?? 'help';
  const flags = new Map<string, string>();
  const positional: string[] = [];
  while (args.length) {
    const item = args.shift()!;
    if (item.startsWith('--'))
      flags.set(item.slice(2), args[0] && !args[0].startsWith('--') ? args.shift()! : 'true');
    else positional.push(item);
  }
  const directory = dataDirectory(flags.get('data'));
  if (command === 'serve') {
    const port = Number(flags.get('port') ?? 4317);
    if (!Number.isInteger(port) || port < 0 || port > 65535)
      throw new Error('Port must be between 0 and 65535');
    const engine = await startEngine({
      directory,
      port,
      uiDirectory: process.env.REHEARSAL_UI_DIR ?? resolve('dist'),
    });
    process.stdout.write(
      `REHEARSAL_READY ${JSON.stringify({ url: engine.connection.url, pid: process.pid })}\n`,
    );
    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      await engine.close();
      process.exit(0);
    };
    process.on('SIGINT', () => void close());
    process.on('SIGTERM', () => void close());
    process.stdin.on('data', (data) => {
      if (String(data).trim() === 'shutdown') void close();
    });
    return;
  }
  if (command === 'help' || command === '--help') {
    process.stdout.write(
      `Rehearsal 0.1.0\n\nCommands:\n  serve [--port 4317]\n  projects\n  import /absolute/path/rehearsal.json\n  run PROJECT SUITE [--scenario ID] [--no-wait] [--json]\n  runs [--project ID]\n  inspect RUN\n  rerun RUN [--json]\n  cancel RUN\n  checkpoint RUN NAME\n  export RUN [--output /path/report.zip]\n  environment PROJECT start|stop\n  connection\n  mcp\n\nAll commands accept --data /path/to/state. Engine binds to loopback only.\n`,
    );
    return;
  }
  const entry = resolve(process.argv[1]);
  const client = await connect(directory, entry, entry.endsWith('.ts'));
  if (command === 'mcp') {
    const server = createMcpServer(client);
    await server.connect(new StdioServerTransport());
    return;
  }
  let result: unknown;
  const required = (index: number, label: string) => {
    const value = positional[index];
    if (!value) throw new Error(`Missing ${label}. Run help for usage.`);
    return encodeURIComponent(value);
  };
  switch (command) {
    case 'projects':
      result = await client.request('GET', '/api/projects');
      break;
    case 'import':
      result = await client.request('POST', '/api/projects/import', {
        path: resolve(decodeURIComponent(required(0, 'manifest path'))),
      });
      break;
    case 'runs':
      result = await client.request(
        'GET',
        `/api/runs${flags.has('project') ? `?project=${encodeURIComponent(flags.get('project')!)}` : ''}`,
      );
      break;
    case 'inspect':
      result = await client.request('GET', `/api/runs/${required(0, 'run ID')}`);
      break;
    case 'cancel':
      result = await client.request('POST', `/api/runs/${required(0, 'run ID')}/cancel`);
      break;
    case 'checkpoint':
      result = await client.request('POST', `/api/runs/${required(0, 'run ID')}/checkpoint`, {
        name: decodeURIComponent(required(1, 'checkpoint name')),
      });
      break;
    case 'run':
    case 'rerun': {
      let run =
        command === 'run'
          ? await client.request<Run>('POST', '/api/runs', {
              projectId: decodeURIComponent(required(0, 'project ID')),
              suiteId: decodeURIComponent(required(1, 'suite ID')),
              scenarioId: flags.get('scenario'),
            })
          : await client.request<Run>('POST', `/api/runs/${required(0, 'run ID')}/rerun`);
      if (!flags.has('no-wait')) {
        while (!finished(run.status)) {
          await delay(200);
          run = await client.request<Run>('GET', `/api/runs/${run.id}`);
        }
      }
      result = run;
      if (finished(run.status) && run.status !== 'passed') process.exitCode = 1;
      break;
    }
    case 'export': {
      const id = decodeURIComponent(required(0, 'run ID'));
      if (flags.has('output')) {
        const file = resolve(flags.get('output')!);
        const response = await client.fetch('GET', `/api/runs/${encodeURIComponent(id)}/export`);
        writeFileSync(file, Buffer.from(await response.arrayBuffer()), { mode: 0o600 });
        result = { path: file };
      } else result = await saveExport(client, id);
      break;
    }
    case 'environment': {
      const action = positional[1];
      if (!['start', 'stop'].includes(action))
        throw new Error('Environment action must be start or stop');
      result = await client.request(
        'POST',
        `/api/projects/${required(0, 'project ID')}/environment/${action}`,
      );
      break;
    }
    case 'connection':
      result = {
        url: client.connection.url,
        mcpUrl: `${client.connection.url}/mcp`,
        connectionFile: `${directory}/connection.json`,
        note: 'The private connection file contains the bearer token. Keep it out of version control.',
      };
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
main().catch((error) => {
  process.stderr.write(`Rehearsal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
