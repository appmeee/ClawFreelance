/**
 * Setup for live/integration tests
 * Only runs tests when LIVE_TESTS=true
 */
import { afterAll, beforeAll } from 'vitest';

const isLiveMode = process.env.LIVE_TESTS === 'true';

beforeAll(() => {
  if (!isLiveMode) {
    console.log('💤 Live tests are disabled. Set LIVE_TESTS=true to enable.');
  } else {
    console.log('🔴 LIVE TESTS ENABLED - Real services may be affected');
  }
});

afterAll(() => {
  // Cleanup any live test resources
});

export { isLiveMode };
