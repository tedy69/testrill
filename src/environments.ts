import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import type { Environment, Project } from './schema.js';

export class Environments {
  private states = new Map<string, Environment>();
  private children = new Map<string, ChildProcess>();
  get(id: string): Environment {
    return this.states.get(id) ?? { status: 'stopped', logs: [] };
  }
  async start(project: Project) {
    const id = project.config.id;
    if (this.children.has(id)) return this.get(id);
    const state: Environment = { status: 'starting', logs: [] };
    this.states.set(id, state);
    const url = project.config.environment?.readyUrl ?? project.config.baseUrl;
    if (await ready(url)) {
      state.status = 'ready';
      state.logs.push('Target already responds. No process was started or claimed.');
      return state;
    }
    const command = project.config.environment?.command;
    if (!command) {
      state.status = 'error';
      state.error = 'Target is unavailable and this project has no environment command.';
      return state;
    }
    const child = spawn(command[0], command.slice(1), {
      cwd: project.root,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    this.children.set(id, child);
    state.pid = child.pid;
    const log = (data: Buffer) => {
      state.logs.push(
        ...data
          .toString('utf8')
          .split('\n')
          .filter(Boolean)
          .map((line) => line.slice(0, 1000)),
      );
      state.logs = state.logs.slice(-150);
    };
    child.stdout?.on('data', log);
    child.stderr?.on('data', log);
    child.once('error', (error) => {
      state.status = 'error';
      state.error = error.message;
      this.children.delete(id);
    });
    child.once('exit', (code) => {
      this.children.delete(id);
      if (state.status !== 'stopped') {
        state.status = 'error';
        state.error = `Environment exited (${code ?? 'signal'})`;
      }
    });
    for (let attempt = 0; attempt < 40 && state.status === 'starting'; attempt++) {
      if (await ready(url)) {
        state.status = 'ready';
        break;
      }
      await delay(250);
    }
    if (state.status === 'starting') {
      state.status = 'error';
      state.error = 'Readiness timed out. Inspect the environment logs.';
    }
    return state;
  }
  stop(id: string) {
    const child = this.children.get(id);
    const state = this.get(id);
    state.status = 'stopped';
    if (child?.pid) {
      if (process.platform === 'win32')
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      else {
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch {
          child.kill('SIGTERM');
        }
      }
      this.children.delete(id);
    }
    state.pid = undefined;
    return state;
  }
  close() {
    for (const id of this.children.keys()) this.stop(id);
  }
}
async function ready(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}
