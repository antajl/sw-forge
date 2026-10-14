import { defineConfig, type Plugin } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
// @ts-expect-error JS module without declaration
import { buildHtml } from './tools/build-html.mjs';

function partialsWatcherPlugin(): Plugin {
  return {
    name: 'vite-plugin-partials-watcher',
    configureServer(server) {
      const rebuild = (file: string) => {
        const normalized = file.replace(/\\/g, '/');
        const isPartial = normalized.includes('/partials/') || normalized.endsWith('/index-shell.html');
        if (!isPartial) return;
        try {
          buildHtml({ silent: true });
          server.ws.send({ type: 'full-reload', path: '*' });
          console.log(`[vite] Auto-rebuilt index.html from ${normalized}`);
        } catch (err) {
          console.error('[vite] Error auto-rebuilding HTML:', err);
        }
      };

      server.watcher.on('change', rebuild);
      server.watcher.on('add', rebuild);
      server.watcher.on('unlink', rebuild);
    },
  };
}

export default defineConfig({
  plugins: [
    partialsWatcherPlugin(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@types': resolve(import.meta.dirname, './src/types'),
      '@core': resolve(import.meta.dirname, './src/core'),
      '@data': resolve(import.meta.dirname, './src/data'),
      '@engine': resolve(import.meta.dirname, './src/engine'),
      '@features': resolve(import.meta.dirname, './src/features'),
      '@ui': resolve(import.meta.dirname, './src/ui'),
      '@utils': resolve(import.meta.dirname, './src/utils'),
    },
  },
  server: {
    port: 5500,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  assetsInclude: ['**/*.json'],
});
