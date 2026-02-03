/**
 * Setup for gateway/API tests
 * Configures test server and API mocking
 */
import { afterAll, afterEach, beforeAll } from 'vitest';

// Mock environment variables for gateway tests
// Note: NODE_ENV is read-only in TypeScript, set via test command
process.env.API_RATE_LIMIT = '1000';

beforeAll(() => {
  console.log('🚪 Gateway test environment initialized');
});

afterEach(() => {
  // Reset rate limiters and caches between tests
});

afterAll(() => {
  // Cleanup
});
