import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for extension tests
 * Tests for browser extension or CLI tool components
 */
export default defineConfig({
  test: {
    name: 'extension',
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/cli/**/*.test.ts', 'src/extension/**/*.test.ts'],
    exclude: ['node_modules/**'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
