import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearConfig,
  getConfigPath,
  getConfigValue,
  loadConfig,
  saveConfig,
  setConfigValue,
} from './config.js';

// Create test paths using the real tmpdir
const TEST_HOME = join(os.tmpdir(), 'claw-cli-test-' + Date.now());
const TEST_CONFIG_DIR = join(TEST_HOME, '.clawfreelance');
const TEST_CONFIG_FILE = join(TEST_CONFIG_DIR, 'config.json');

describe('Config Module', () => {
  beforeAll(() => {
    // Mock homedir to use our test directory
    vi.spyOn(os, 'homedir').mockReturnValue(TEST_HOME);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    // Ensure clean state
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(TEST_HOME)) {
      rmSync(TEST_HOME, { recursive: true });
    }
  });

  describe('loadConfig', () => {
    it('should return default config when no file exists', () => {
      const config = loadConfig();
      expect(config.baseUrl).toBe('https://clawfreelance.dev');
      expect(config.apiKey).toBeUndefined();
      expect(config.agentId).toBeUndefined();
    });

    it('should load config from file', () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(
        TEST_CONFIG_FILE,
        JSON.stringify({
          baseUrl: 'http://localhost:3000',
          apiKey: 'test-key',
          agentId: 'agent-123',
        })
      );

      const config = loadConfig();
      expect(config.baseUrl).toBe('http://localhost:3000');
      expect(config.apiKey).toBe('test-key');
      expect(config.agentId).toBe('agent-123');
    });

    it('should return default config on invalid JSON', () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, 'invalid json');

      const config = loadConfig();
      expect(config.baseUrl).toBe('https://clawfreelance.dev');
    });
  });

  describe('saveConfig', () => {
    it('should create config directory and file', () => {
      saveConfig({ baseUrl: 'http://test.com' });
      expect(existsSync(TEST_CONFIG_FILE)).toBe(true);
    });

    it('should save config to file', () => {
      saveConfig({
        baseUrl: 'http://test.com',
        apiKey: 'my-key',
        agentId: 'my-agent',
      });

      const config = loadConfig();
      expect(config.baseUrl).toBe('http://test.com');
      expect(config.apiKey).toBe('my-key');
      expect(config.agentId).toBe('my-agent');
    });
  });

  describe('getConfigValue', () => {
    it('should return specific config value', () => {
      saveConfig({ baseUrl: 'http://test.com', apiKey: 'key-123' });

      expect(getConfigValue('baseUrl')).toBe('http://test.com');
      expect(getConfigValue('apiKey')).toBe('key-123');
    });

    it('should return undefined for unset values', () => {
      expect(getConfigValue('apiKey')).toBeUndefined();
    });
  });

  describe('setConfigValue', () => {
    it('should update specific config value', () => {
      setConfigValue('baseUrl', 'http://new-url.com');
      expect(getConfigValue('baseUrl')).toBe('http://new-url.com');
    });

    it('should preserve other config values', () => {
      saveConfig({ baseUrl: 'http://old.com', apiKey: 'old-key' });
      setConfigValue('baseUrl', 'http://new.com');

      expect(getConfigValue('baseUrl')).toBe('http://new.com');
      expect(getConfigValue('apiKey')).toBe('old-key');
    });
  });

  describe('clearConfig', () => {
    it('should reset config to defaults', () => {
      saveConfig({ baseUrl: 'http://test.com', apiKey: 'key', agentId: 'agent' });
      clearConfig();

      const config = loadConfig();
      expect(config.baseUrl).toBe('https://clawfreelance.dev');
      expect(config.apiKey).toBeUndefined();
      expect(config.agentId).toBeUndefined();
    });
  });

  describe('getConfigPath', () => {
    it('should return the config file path', () => {
      const path = getConfigPath();
      expect(path).toBe(TEST_CONFIG_FILE);
    });
  });
});
