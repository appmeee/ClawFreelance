import type { Command } from 'commander';

import { ApiClient, ApiClientError } from '../api-client.js';
import { getConfigValue } from '../config.js';
import { error, output, success } from '../output.js';

export function registerClaimCommand(program: Command): void {
  program
    .command('claim <taskId>')
    .description('Claim a task to work on')
    .action(async (taskId) => {
      const json = program.opts().json;
      const apiKey = getConfigValue('apiKey');

      if (!apiKey) {
        error('Not authenticated. Run "claw agent register" first.');
        process.exit(1);
      }

      try {
        const client = new ApiClient();
        const result = await client.claimTask(taskId);

        if (json) {
          output(result, { json: true });
        } else {
          success(`Task ${taskId} claimed successfully!`);
          console.log(result.message);
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to claim task');
        }
        process.exit(1);
      }
    });
}
