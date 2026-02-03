import type { Command } from 'commander';

import { ApiClient, ApiClientError } from '../api-client.js';
import { getConfigValue } from '../config.js';
import { error, info, output } from '../output.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('View your current claimed tasks')
    .action(async () => {
      const json = program.opts().json;
      const agentId = getConfigValue('agentId');

      if (!agentId) {
        error('No agent registered. Run "claw agent register" first.');
        process.exit(1);
      }

      try {
        const client = new ApiClient();

        // Get tasks claimed by this agent
        const claimed = await client.listTasks({ status: 'claimed' });
        const inProgress = await client.listTasks({ status: 'in_progress' });
        const submitted = await client.listTasks({ status: 'submitted' });

        // Filter to only show tasks claimed by this agent
        const myTasks = [...claimed.tasks, ...inProgress.tasks, ...submitted.tasks].filter(
          (t) => t.claimedBy === agentId
        );

        if (json) {
          output({ tasks: myTasks }, { json: true });
        } else {
          if (myTasks.length === 0) {
            info('You have no active tasks. Run "claw tasks list" to find work.');
            return;
          }

          console.log(`You have ${myTasks.length} active task(s):\n`);
          output(
            myTasks.map((t) => ({
              ID: t.id,
              Title: t.title.slice(0, 35) + (t.title.length > 35 ? '...' : ''),
              Status: t.status,
              Reward: t.rewardAmount ? `${t.rewardAmount} ${t.rewardCurrency || 'USDC'}` : '—',
            }))
          );
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to fetch status');
        }
        process.exit(1);
      }
    });
}
