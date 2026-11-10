import { build } from 'esbuild';
await build({
  entryPoints: ['src/entry.ts'],
  outfile: 'dist-engine/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node26',
  sourcemap: true,
  external: ['playwright-core'],
});
