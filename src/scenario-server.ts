import { createServer, type ServerResponse } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import type { Scenario } from './schema.js';
import { randomBytes } from 'node:crypto';

export type ScenarioLog = (message: string, detail?: string) => void;
export async function startScenario(scenario: Scenario, log: ScenarioLog) {
  const stop = new AbortController();
  const controlToken = randomBytes(24).toString('hex');
  const released = new Set<string>();
  const waiters = new Map<string, Set<() => void>>();
  const responses = new Set<ServerResponse>();
  const release = (name: string) => {
    released.add(name);
    for (const resolve of waiters.get(name) ?? []) resolve();
    waiters.delete(name);
    log(`Checkpoint released: ${name}`);
  };
  const waitFor = async (name: string, signal: AbortSignal) => {
    if (released.has(name)) return;
    log(`Waiting for checkpoint: ${name}`);
    await new Promise<void>((resolve, reject) => {
      const complete = () => {
        cleanup();
        resolve();
      };
      const abort = () => {
        cleanup();
        reject(new Error('Stream closed'));
      };
      const cleanup = () => {
        signal.removeEventListener('abort', abort);
        waiters.get(name)?.delete(complete);
      };
      const set = waiters.get(name) ?? new Set();
      set.add(complete);
      waiters.set(name, set);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
  };
  const server = createServer(async (req, res) => {
    const localStop = new AbortController();
    responses.add(res);
    res.once('close', () => {
      responses.delete(res);
      localStop.abort();
    });
    const signal = AbortSignal.any([stop.signal, localStop.signal]);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Last-Event-ID');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (path.startsWith('/__rehearsal/checkpoints/') && req.method === 'POST') {
      req.resume();
      if (req.headers.authorization !== `Bearer ${controlToken}`) {
        res.writeHead(401).end();
        return;
      }
      const name = path.slice('/__rehearsal/checkpoints/'.length);
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(name)) {
        res.writeHead(400).end();
        return;
      }
      release(name);
      res
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ released: name }));
      return;
    }
    const route = scenario.routes.find((item) => item.path === path && item.method === req.method);
    req.resume();
    if (!route) {
      res
        .writeHead(404, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ error: 'No matching scenario route', path }));
      return;
    }
    log(`${req.method} ${path}`, `Scenario: ${scenario.name}`);
    try {
      if (route.delayMs) await delay(route.delayMs, undefined, { signal });
      if (!route.stream) {
        res.writeHead(route.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(route.body ?? null));
        log(`Response delivered: ${route.status}`);
        return;
      }
      res.writeHead(route.status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.flushHeaders();
      const lastId = req.headers['last-event-id'];
      const resumeIndex =
        typeof lastId === 'string'
          ? route.stream.findIndex((action) => action.type === 'event' && action.id === lastId)
          : -1;
      log(resumeIndex >= 0 ? `Stream resumed after event ${lastId}` : 'Stream connected');
      for (const action of route.stream.slice(resumeIndex + 1)) {
        signal.throwIfAborted();
        if (action.type === 'delay') await delay(action.ms, undefined, { signal });
        if (action.type === 'checkpoint') await waitFor(action.name, signal);
        if (action.type === 'event') {
          const frame = `${action.id !== undefined ? `id: ${action.id}\n` : ''}${action.event ? `event: ${action.event}\n` : ''}${action.data
            .split(/\r?\n/)
            .map((line) => `data: ${line}`)
            .join('\n')}\n\n`;
          res.write(frame);
          log(`Event delivered${action.id ? `: ${action.id}` : ''}`, action.data);
        }
        if (action.type === 'disconnect') {
          log('Connection interrupted by scenario');
          res.destroy();
          return;
        }
      }
      log('Stream sequence completed');
      res.end();
    } catch (error) {
      if (!signal.aborted) log('Stream error', String(error));
      if (!res.destroyed) res.destroy();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to bind scenario server');
  return {
    url: `http://127.0.0.1:${address.port}`,
    release,
    controlToken,
    close: async () => {
      stop.abort();
      for (const res of responses) res.destroy();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
