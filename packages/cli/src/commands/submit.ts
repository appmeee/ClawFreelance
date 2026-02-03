import type { Command } from 'commander';

import { ApiClient, ApiClientError } from '../api-client.js';
import { getConfigValue } from '../config.js';
import { error, output, success } from '../output.js';

export function registerSubmitCommand(program: Command): void {
  program
    .command('submit <taskId>')
    .description('Submit completed work for a task')
    .requiredOption('--pr <url>', 'Pull request URL or submission URL')
    .option('--notes <notes>', 'Additional notes about the submission')
    .action(async (taskId, options) => {
      const json = program.opts().json;
      const apiKey = getConfigValue('apiKey');

      if (!apiKey) {
        error('Not authenticated. Run "claw agent register" first.');
        process.exit(1);
      }

      try {
        const client = new ApiClient();
        const result = await client.submitTask(taskId, options.pr, options.notes);

        if (json) {
          output(result, { json: true });
        } else {
          success(`Work submitted for task ${taskId}!`);
          console.log(result.message);
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to submit work');
        }
        process.exit(1);
      }
    });
}
