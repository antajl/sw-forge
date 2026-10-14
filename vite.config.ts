import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
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
  },
  assetsInclude: ['**/*.json'],
});
