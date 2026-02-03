import type { Command } from 'commander';

import {
  clearConfig,
  type Config,
  getConfigPath,
  getConfigValue,
  listConfig,
  setConfigValue,
} from '../config.js';
import { error, info, output, success } from '../output.js';

const VALID_KEYS: Array<keyof Config> = ['apiKey', 'baseUrl', 'agentId'];

export function registerConfigCommands(program: Command): void {
  const config = program.command('config').description('Manage CLI configuration');

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      if (!VALID_KEYS.includes(key as keyof Config)) {
        error(`Invalid config key: ${key}`);
        info(`Valid keys: ${VALID_KEYS.join(', ')}`);
        process.exit(1);
      }

      setConfigValue(key as keyof Config, value);
      success(`Set ${key} = ${key === 'apiKey' ? '****' : value}`);
    });

  config
    .command('get <key>')
    .description('Get a configuration value')
    .action((key: string) => {
      const json = program.opts().json;

      if (!VALID_KEYS.includes(key as keyof Config)) {
        error(`Invalid config key: ${key}`);
        info(`Valid keys: ${VALID_KEYS.join(', ')}`);
        process.exit(1);
      }

      const value = getConfigValue(key as keyof Config);

      if (json) {
        output({ [key]: value }, { json: true });
      } else {
        if (value === undefined) {
          info(`${key} is not set`);
        } else {
          console.log(key === 'apiKey' ? '****' : value);
        }
      }
    });

  config
    .command('list')
    .description('List all configuration values')
    .action(() => {
      const json = program.opts().json;
      const configData = listConfig();

      if (json) {
        // Mask API key in JSON output too for safety
        output(
          {
            ...configData,
            apiKey: configData.apiKey ? '****' : undefined,
          },
          { json: true }
        );
      } else {
        output({
          'Config File': getConfigPath(),
          'API Key': configData.apiKey ? '****' : '(not set)',
          'Base URL': configData.baseUrl,
          'Agent ID': configData.agentId || '(not set)',
        });
      }
    });

  config
    .command('path')
    .description('Show the config file path')
    .action(() => {
      console.log(getConfigPath());
    });

  config
    .command('clear')
    .description('Clear all configuration')
    .action(() => {
      clearConfig();
      success('Configuration cleared');
    });
}
