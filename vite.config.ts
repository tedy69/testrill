import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4317',
        configure: (proxy) =>
          proxy.on('proxyReq', (proxyReq) => {
            try {
              const connection = JSON.parse(
                readFileSync(
                  resolve(
                    process.env.TESTRILL_DATA_DIR ?? process.env.REHEARSAL_DATA_DIR ?? '.testrill',
                    'connection.json',
                  ),
                  'utf8',
                ),
              );
              proxyReq.setHeader('Authorization', `Bearer ${connection.token}`);
            } catch {
              /* The UI shows a disconnected state until the engine starts. */
            }
          }),
      },
    },
  },
  build: { target: 'es2022' },
});
