import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { mirrorOutput } from './build/mirror-output.mjs';

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'farmwise-root-build',
    apply: 'build',
    closeBundle: mirrorOutput,
  }],
  build: { outDir: 'dist', emptyOutDir: true },
  resolve: { preserveSymlinks: true, alias: { '@': new URL('./src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') } },
  server: { host: '127.0.0.1', proxy: { '/api': 'http://127.0.0.1:4001' } },
});
