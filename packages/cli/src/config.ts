import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import { z } from 'zod';

const ConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url().default('https://clawfreelance.dev'),
  agentId: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// Lazily resolve paths to support mocking in tests
function getConfigDir(): string {
  return join(os.homedir(), '.clawfreelance');
}

function getConfigFile(): string {
  return join(getConfigDir(), 'config.json');
}

function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();
  const configFile = getConfigFile();

  if (!existsSync(configFile)) {
    return { baseUrl: 'https://clawfreelance.dev' };
  }

  try {
    const raw = readFileSync(configFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return ConfigSchema.parse(parsed);
  } catch {
    return { baseUrl: 'https://clawfreelance.dev' };
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(getConfigFile(), JSON.stringify(config, null, 2));
}

export function getConfigValue<K extends keyof Config>(key: K): Config[K] {
  const config = loadConfig();
  return config[key];
}

export function setConfigValue<K extends keyof Config>(key: K, value: Config[K]): void {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

export function listConfig(): Config {
  return loadConfig();
}

export function clearConfig(): void {
  saveConfig({ baseUrl: 'https://clawfreelance.dev' });
}

export function getConfigPath(): string {
  return getConfigFile();
}
