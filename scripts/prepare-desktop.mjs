import {
  cpSync,
  mkdirSync,
  copyFileSync,
  chmodSync,
  writeFileSync,
  existsSync,
  realpathSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const triple = execFileSync('rustc', ['--print', 'host-tuple'], { encoding: 'utf8' }).trim();
const runtime = 'src-tauri/resources/runtime';
mkdirSync(runtime, { recursive: true });
mkdirSync('src-tauri/binaries', { recursive: true });
copyFileSync('dist-engine/main.cjs', join(runtime, 'main.cjs'));
const nodeDirectory = dirname(realpathSync(process.execPath));
const license = ['../LICENSE', '../LICENSE.txt', '../share/doc/node/LICENSE']
  .map((file) => resolve(nodeDirectory, file))
  .find((file) => existsSync(file));
if (!license)
  throw new Error(
    'Node runtime license not found beside this installation. Use an official Node distribution that includes LICENSE.',
  );
copyFileSync(license, join(runtime, 'Node-LICENSE.txt'));
writeFileSync(
  join(runtime, 'package.json'),
  JSON.stringify({ name: 'rehearsal-runtime', private: true }),
);
cpSync('dist', join(runtime, 'ui'), { recursive: true });
cpSync(
  dirname(require.resolve('playwright-core/package.json')),
  join(runtime, 'node_modules/playwright-core'),
  { recursive: true },
);
const binary = `src-tauri/binaries/rehearsal-node-${triple}${process.platform === 'win32' ? '.exe' : ''}`;
copyFileSync(process.execPath, binary);
chmodSync(binary, 0o755);
console.log(`Prepared engine and Node runtime for ${triple}`);
