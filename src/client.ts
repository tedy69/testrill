import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
export type Connection = { url: string; token: string; pid: number; dataDir: string };
export class ApiClient {
  constructor(readonly connection: Connection) {}
  async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.fetch(method, path, body);
    return (await response.json()) as T;
  }
  async fetch(method: string, path: string, body?: unknown) {
    const response = await fetch(`${this.connection.url}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.connection.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({ error: response.statusText }))) as {
        error?: string;
      };
      throw new Error(data.error ?? `HTTP ${response.status}`);
    }
    return response;
  }
}
export function dataDirectory(value?: string) {
  return resolve(
    value ??
      process.env.TESTRILL_DATA_DIR ??
      process.env.REHEARSAL_DATA_DIR ??
      join(process.cwd(), '.testrill'),
  );
}
export async function connect(
  directory: string,
  entry: string,
  sourceMode: boolean,
): Promise<ApiClient> {
  const load = async () => {
    try {
      const connection = JSON.parse(
        readFileSync(join(directory, 'connection.json'), 'utf8'),
      ) as Connection;
      const client = new ApiClient(connection);
      await client.request('GET', '/api/health');
      return client;
    } catch {
      return undefined;
    }
  };
  const current = await load();
  if (current) return current;
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const args = sourceMode ? ['--import', 'tsx', entry] : [entry];
  const child = spawn(process.execPath, [...args, 'serve', '--data', directory, '--port', '0'], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
    windowsHide: true,
  });
  let spawnError: Error | undefined;
  child.on('error', (error) => {
    spawnError = error;
  });
  child.unref();
  for (let attempt = 0; attempt < 100; attempt++) {
    if (spawnError) throw spawnError;
    await delay(100);
    const client = await load();
    if (client) return client;
  }
  throw new Error('Engine did not start. Run npm run dev:engine to inspect startup errors.');
}
export async function saveExport(client: ApiClient, id: string) {
  const response = await client.fetch('GET', `/api/runs/${encodeURIComponent(id)}/export`);
  const directory = join(client.connection.dataDir, 'exports');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = join(directory, `${id}.zip`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()), { mode: 0o600 });
  return {
    path: file,
    note: 'Trace and screenshots may contain application data. Review before sharing.',
  };
}
