import { spawn } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = ['dev:engine', 'dev:ui'].map((script) =>
  spawn(npm, ['run', script], { stdio: 'inherit', detached: process.platform !== 'win32' }),
);
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  children.forEach((child) => {
    if (child.pid && process.platform !== 'win32') {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        child.kill('SIGTERM');
      }
    } else if (child.pid) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F']);
  });
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
children.forEach((child) =>
  child.on('exit', (code) => {
    if (!closing) {
      close();
      process.exitCode = code ?? 1;
    }
  }),
);
