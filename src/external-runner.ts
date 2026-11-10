import { spawn } from 'node:child_process';
import { realpathSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import type { Suite } from './schema.js';
import { setTimeout as delay } from 'node:timers/promises';

export async function executeExternal(
  suite: Suite,
  root: string,
  directory: string,
  signal: AbortSignal,
  variables: Record<string, string>,
  log: (message: string) => void,
) {
  const runner = suite.runner;
  if (!runner) throw new Error('Runner configuration is missing');
  let command: string[];
  if (runner.type === 'maestro') {
    const file = realpathSync(resolve(root, runner.flow));
    const projectRoot = realpathSync(root);
    if (!file.startsWith(projectRoot + sep))
      throw new Error('Maestro flow must be inside the project root');
    command = [
      'maestro',
      ...(runner.device ? ['--device', runner.device] : []),
      'test',
      '--format',
      'JUNIT',
      '--output',
      join(directory, 'maestro-report.xml'),
      '--debug-output',
      join(directory, 'maestro'),
      file,
    ];
  } else command = runner.command;
  log(
    `Starting ${runner.type === 'maestro' ? 'Maestro' : 'configured test command'}: ${command[0]}`,
  );
  const timeout = AbortSignal.timeout(runner.timeoutMs);
  const combined = AbortSignal.any([signal, timeout]);
  let output = '';
  let truncated = false;
  await new Promise<void>((resolveDone, reject) => {
    const child = spawn(command[0], command.slice(1), {
      cwd: root,
      detached: process.platform !== 'win32',
      windowsHide: true,
      env: {
        ...process.env,
        REHEARSAL_BASE_URL: variables.baseUrl,
        REHEARSAL_MOCK_URL: variables.mockUrl,
        REHEARSAL_ARTIFACT_DIR: directory,
        REHEARSAL_CONTROL_URL: variables.mockUrl
          ? `${variables.mockUrl}/__rehearsal/checkpoints`
          : '',
        REHEARSAL_CONTROL_TOKEN: variables.controlToken ?? '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let termination: Promise<void> | undefined;
    const kill = () => {
      if (termination) return;
      if (child.pid && process.platform !== 'win32') {
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch {
          child.kill();
        }
      } else if (child.pid)
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      termination = delay(1500).then(() => {
        if (child.pid && process.platform !== 'win32') {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {
            /* Already exited. */
          }
        } else child.kill('SIGKILL');
      });
    };
    const record = (chunk: Buffer) => {
      if (output.length >= 250_000) {
        truncated = true;
        return;
      }
      const text = chunk.toString('utf8');
      output += text.slice(0, 250_000 - output.length);
      for (const line of text.split('\n').filter(Boolean).slice(0, 15)) log(line.slice(0, 1000));
    };
    child.stdout.on('data', record);
    child.stderr.on('data', record);
    combined.addEventListener('abort', kill, { once: true });
    if (combined.aborted) kill();
    const cleanup = () => {
      combined.removeEventListener('abort', kill);
      writeFileSync(
        join(directory, 'runner-output.json'),
        JSON.stringify({ command, output, truncated }, null, 2),
      );
    };
    child.once('error', (error) => {
      cleanup();
      reject(new Error(`Runner unavailable: ${error.message}`));
    });
    child.once('close', async (code) => {
      await termination;
      cleanup();
      if (combined.aborted)
        reject(new Error(signal.aborted ? 'Run cancelled' : 'External runner timed out'));
      else if (code !== 0)
        reject(
          new Error(`Test command exited with code ${code ?? 'signal'}. Inspect runner output.`),
        );
      else resolveDone();
    });
  });
  return collectExternalArtifacts(directory);
}

export function collectExternalArtifacts(directory: string) {
  const artifacts: { name: string; type: 'json'; file: string }[] = [];
  if (existsSync(join(directory, 'runner-output.json')))
    artifacts.push({ name: 'Runner output', type: 'json', file: 'runner-output.json' });
  if (existsSync(join(directory, 'maestro-report.xml'))) {
    // Keep the structured runner report alongside output without pretending it is JSON.
    writeFileSync(
      join(directory, 'maestro-report.json'),
      JSON.stringify(
        { format: 'junit-xml', xml: readFileSync(join(directory, 'maestro-report.xml'), 'utf8') },
        null,
        2,
      ),
    );
    artifacts.push({ name: 'Maestro JUnit report', type: 'json', file: 'maestro-report.json' });
  }
  return artifacts;
}
