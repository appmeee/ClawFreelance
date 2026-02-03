import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for live/integration tests
 * Tests that may interact with real services in development
 * Use mock mode by default, enable live mode with LIVE_TESTS=true
 */
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'live',
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts', './src/test/setup.live.ts'],
    include: ['src/**/*.live.test.ts', 'src/**/*.integration.test.ts'],
    exclude: ['node_modules/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Live tests are skipped by default unless LIVE_TESTS=true
    env: {
      LIVE_TESTS: process.env.LIVE_TESTS || 'false',
    },
    retry: 2, // Retry flaky live tests
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
