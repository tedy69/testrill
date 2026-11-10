import { build } from 'esbuild';
await build({
  entryPoints: ['src/entry.ts'],
  outfile: 'dist-engine/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  sourcemap: true,
  external: ['playwright-core'],
});
