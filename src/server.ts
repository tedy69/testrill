import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  rmSync,
  mkdirSync,
  openSync,
  closeSync,
} from 'node:fs';
import { resolve, join, dirname, basename, sep } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { ZodError, z } from 'zod';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { projectSchema, finished } from './schema.js';
import { Store } from './store.js';
import { Runner } from './runner.js';
import { Environments } from './environments.js';
import { demoHtml, demoProject } from './demo.js';
import { ApiClient, type Connection } from './client.js';
import { createMcpServer } from './mcp.js';

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function startEngine(options: {
  directory: string;
  port?: number;
  uiDirectory?: string;
  seed?: boolean;
}) {
  mkdirSync(options.directory, { recursive: true, mode: 0o700 });
  const lock = join(options.directory, 'engine.lock');
  if (existsSync(lock)) {
    const pid = Number(readFileSync(lock, 'utf8'));
    let alive = false;
    try {
      if (Number.isInteger(pid) && pid > 0) {
        process.kill(pid, 0);
        alive = true;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') alive = true;
    }
    if (alive)
      throw new Error(
        'An engine already owns this workspace. Connect to it or use another --data directory.',
      );
    rmSync(lock);
  }
  const lockFile = openSync(lock, 'wx', 0o600);
  writeFileSync(lockFile, String(process.pid));
  closeSync(lockFile);
  const store = new Store(options.directory);
  store.recoverInterrupted();
  const runner = new Runner(store);
  const environments = new Environments();
  const token = randomBytes(32).toString('hex');
  let connection: Connection;
  const json = (res: ServerResponse, value: unknown, status = 200) => {
    res
      .writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      .end(JSON.stringify(value));
  };
  const project = (id: string) => {
    const value = store.project(id);
    if (!value) throw new HttpError(404, 'Project not found');
    return value;
  };
  const run = (id: string) => {
    const value = store.run(id);
    if (!value) throw new HttpError(404, 'Run not found');
    return value;
  };
  const requireAuth = (req: IncomingMessage) => {
    const authorization = req.headers.authorization ?? '';
    const expected = `Bearer ${token}`;
    const value = Buffer.from(authorization);
    const expectedValue = Buffer.from(expected);
    return value.length === expectedValue.length && timingSafeEqual(value, expectedValue);
  };
  const server = createServer(async (req, res) => {
    const origin = req.headers.origin;
    const allowed = new Set([
      'http://127.0.0.1:1420',
      'http://localhost:1420',
      'tauri://localhost',
      'http://tauri.localhost',
      'https://tauri.localhost',
      connection?.url,
    ]);
    if (origin && !allowed.has(origin)) {
      json(res, { error: 'Origin is not allowed' }, 403);
      return;
    }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (url.pathname === '/demo' && req.method === 'GET') {
        res
          .writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' })
          .end(demoHtml);
        return;
      }
      if (url.pathname.startsWith('/api/') || url.pathname === '/mcp') {
        if (!requireAuth(req)) throw new HttpError(401, 'Authentication required');
      } else {
        if (!options.uiDirectory || req.method !== 'GET') throw new HttpError(404, 'Not found');
        const root = resolve(options.uiDirectory);
        const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (file !== root && !file.startsWith(root + sep)) throw new HttpError(403, 'Invalid path');
        const target =
          existsSync(file) && statSync(file).isFile() ? file : join(root, 'index.html');
        const mime = target.endsWith('.js')
          ? 'text/javascript'
          : target.endsWith('.css')
            ? 'text/css'
            : target.endsWith('.svg')
              ? 'image/svg+xml'
              : 'text/html';
        res.writeHead(200, { 'Content-Type': mime }).end(readFileSync(target));
        return;
      }
      if (url.pathname === '/mcp') {
        if (req.method !== 'POST') {
          json(res, { error: 'Use MCP Streamable HTTP POST requests' }, 405);
          return;
        }
        const mcp = createMcpServer(new ApiClient(connection));
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        await mcp.connect(transport);
        res.on('close', () => {
          void transport.close();
          void mcp.close();
        });
        await transport.handleRequest(req, res, await readJson(req));
        return;
      }
      const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      const method = req.method;
      if (url.pathname === '/api/health' && method === 'GET') {
        json(res, { name: 'rehearsal', version: '0.1.0', pid: process.pid });
        return;
      }
      if (url.pathname === '/api/connection' && method === 'GET') {
        json(res, {
          mcpServers: {
            rehearsal: {
              command: process.execPath,
              args: [resolve(process.argv[1]), 'mcp', '--data', options.directory],
            },
          },
          workspace: options.directory,
          httpUrl: `${connection.url}/mcp`,
        });
        return;
      }
      if (url.pathname === '/api/projects' && method === 'GET') {
        json(res, store.projects());
        return;
      }
      if (url.pathname === '/api/projects/import' && method === 'POST') {
        const body = z
          .object({
            path: z.string().min(1).max(2000).optional(),
            config: z.unknown().optional(),
            root: z.string().min(1).max(2000).optional(),
          })
          .refine((value) => value.path || value.config, 'Provide a manifest path or configuration')
          .parse(await readJson(req));
        let sourcePath: string | undefined;
        let raw = body.config;
        if (body.path) {
          sourcePath = resolve(body.path);
          if (statSync(sourcePath).size > 2_000_000)
            throw new HttpError(400, 'Manifest exceeds 2 MB');
          raw = JSON.parse(readFileSync(sourcePath, 'utf8'));
        }
        const config = projectSchema.parse(raw);
        const root = resolve(body.root ?? (sourcePath ? dirname(sourcePath) : process.cwd()));
        if (!statSync(root).isDirectory())
          throw new HttpError(400, 'Project root must be a directory');
        if (store.project(config.id))
          throw new HttpError(
            409,
            'This project ID is already registered. Edit its configuration instead.',
          );
        json(
          res,
          store.saveProject({ config, root, sourcePath, updatedAt: new Date().toISOString() }),
          201,
        );
        return;
      }
      if (parts[1] === 'projects' && parts[2]) {
        const item = project(parts[2]);
        if (parts.length === 3 && method === 'GET') {
          json(res, { ...item, environment: environments.get(item.config.id) });
          return;
        }
        if (parts.length === 3 && method === 'PUT') {
          const body = (await readJson(req)) as { config: unknown; writeToSource?: boolean };
          const config = projectSchema.parse(body.config);
          if (config.id !== item.config.id)
            throw new HttpError(400, 'Project ID cannot be changed');
          if (body.writeToSource) {
            if (!item.sourcePath)
              throw new HttpError(400, 'No source manifest is associated with this project');
            writeFileSync(item.sourcePath, JSON.stringify(config, null, 2) + '\n');
          }
          json(res, store.saveProject({ ...item, config, updatedAt: new Date().toISOString() }));
          return;
        }
        if (parts[3] === 'environment') {
          if (method === 'GET') {
            json(res, environments.get(item.config.id));
            return;
          }
          if (method === 'POST' && parts[4] === 'start') {
            json(res, await environments.start(item));
            return;
          }
          if (method === 'POST' && parts[4] === 'stop') {
            json(res, environments.stop(item.config.id));
            return;
          }
        }
      }
      if (url.pathname === '/api/runs' && method === 'GET') {
        json(
          res,
          store
            .runs(url.searchParams.get('project') ?? undefined)
            .map((value) => ({ ...value, events: [], configSnapshot: undefined })),
        );
        return;
      }
      if (url.pathname === '/api/runs' && method === 'POST') {
        const body = z
          .object({
            projectId: z.string().min(1).max(100),
            suiteId: z.string().min(1).max(100),
            scenarioId: z.string().max(100).optional(),
          })
          .parse(await readJson(req));
        const item = project(body.projectId);
        const suite = item.config.suites.find((value) => value.id === body.suiteId);
        if (!suite) throw new HttpError(404, 'Suite not found');
        const scenarioId = body.scenarioId ?? suite.defaultScenario;
        const scenario = item.config.scenarios.find((value) => value.id === scenarioId);
        if (scenarioId && !scenario) throw new HttpError(404, 'Scenario not found');
        json(res, runner.start(item, suite, scenario), 202);
        return;
      }
      if (parts[1] === 'runs' && parts[2]) {
        const item = run(parts[2]);
        if (parts.length === 3 && method === 'GET') {
          json(res, item);
          return;
        }
        if (parts[3] === 'cancel' && method === 'POST') {
          runner.cancel(item.id);
          json(res, { accepted: true });
          return;
        }
        if (parts[3] === 'checkpoint' && method === 'POST') {
          const body = (await readJson(req)) as { name: string };
          if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(body.name))
            throw new HttpError(400, 'Invalid checkpoint name');
          runner.release(item.id, body.name);
          json(res, { released: body.name });
          return;
        }
        if (parts[3] === 'rerun' && method === 'POST') {
          const owner = project(item.projectId);
          json(
            res,
            runner.start(
              { ...owner, config: { ...owner.config, baseUrl: item.configSnapshot.baseUrl } },
              item.configSnapshot.suite,
              item.configSnapshot.scenario,
            ),
            202,
          );
          return;
        }
        if (parts[3] === 'artifacts' && parts[4] && method === 'GET') {
          const artifact = item.artifacts.find((value) => value.id === parts[4]);
          if (!artifact || basename(artifact.file) !== artifact.file)
            throw new HttpError(404, 'Artifact not found');
          res
            .writeHead(200, {
              'Content-Type':
                artifact.type === 'image'
                  ? 'image/png'
                  : artifact.type === 'json'
                    ? 'application/json'
                    : 'application/zip',
              'Cache-Control': 'no-store',
            })
            .end(readFileSync(join(options.directory, 'artifacts', item.id, artifact.file)));
          return;
        }
        if (parts[3] === 'export' && method === 'GET') {
          if (!finished(item.status))
            throw new HttpError(409, 'Wait for the run to finish before exporting');
          const files: Record<string, Uint8Array> = {
            'run.json': strToU8(JSON.stringify(item, null, 2)),
            'README.txt': strToU8(
              'Rehearsal evidence bundle. Inspect run.json for assertions and event history. Open trace.zip with Playwright Trace Viewer. Traces and images may contain application data; review before sharing.\n',
            ),
          };
          let size = 0;
          for (const artifact of item.artifacts) {
            size += artifact.size;
            if (size > 80_000_000)
              throw new HttpError(413, 'Bundle exceeds the 80 MB export limit');
            files[artifact.file] = readFileSync(
              join(options.directory, 'artifacts', item.id, artifact.file),
            );
          }
          res
            .writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="rehearsal-${item.id}.zip"`,
            })
            .end(zipSync(files, { level: 1 }));
          return;
        }
      }
      throw new HttpError(404, 'Not found');
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      const status =
        error instanceof HttpError
          ? error.status
          : error instanceof ZodError || error instanceof SyntaxError
            ? 400
            : 500;
      const message =
        error instanceof ZodError
          ? error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      json(res, { error: message }, status);
    }
  });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(options.port ?? 0, '127.0.0.1', resolve);
    });
  } catch (error) {
    store.close();
    rmSync(lock, { force: true });
    throw error;
  }
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Engine failed to bind');
  connection = {
    url: `http://127.0.0.1:${address.port}`,
    token,
    pid: process.pid,
    dataDir: options.directory,
  };
  if (options.seed !== false) {
    const existing = store.project('example-storefront');
    if (!existing)
      store.saveProject({
        config: demoProject(`${connection.url}/demo`),
        root: process.cwd(),
        updatedAt: new Date().toISOString(),
      });
    else
      store.saveProject({
        ...existing,
        config: { ...existing.config, baseUrl: `${connection.url}/demo` },
      });
  }
  writeFileSync(join(options.directory, 'connection.json'), JSON.stringify(connection), {
    mode: 0o600,
  });
  return {
    connection,
    store,
    runner,
    close: async () => {
      environments.close();
      await runner.close();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      try {
        const saved = JSON.parse(readFileSync(join(options.directory, 'connection.json'), 'utf8'));
        if (saved.token === token) rmSync(join(options.directory, 'connection.json'));
      } catch {
        /* A newer engine may own the connection file. */
      }
      store.close();
      rmSync(lock, { force: true });
    },
  };
}
async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2_000_000) throw new HttpError(413, 'Request exceeds 2 MB');
    chunks.push(Buffer.from(chunk));
  }
  return size ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}
