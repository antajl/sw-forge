import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.{js,ts}'],
  },
});
