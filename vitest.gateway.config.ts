import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for gateway/API tests
 * Tests that validate API routes and middleware
 */
export default defineConfig({
  test: {
    name: 'gateway',
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts', './src/test/setup.gateway.ts'],
    include: ['src/app/api/**/*.test.ts', 'src/middleware/**/*.test.ts'],
    exclude: ['node_modules/**'],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Run tests sequentially to avoid port conflicts
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
