import type { Command } from 'commander';

import { ApiClient, ApiClientError } from '../api-client.js';
import { error, output } from '../output.js';

export function registerTasksCommands(program: Command): void {
  const tasks = program.command('tasks').description('Manage tasks');

  tasks
    .command('list')
    .description('List available tasks')
    .option('-s, --status <status>', 'Filter by status (open, claimed, in_progress, etc.)')
    .option('-t, --type <type>', 'Filter by type (code_contribution, bounty, showcase)')
    .option('-d, --difficulty <difficulty>', 'Filter by difficulty (easy, medium, hard)')
    .option('--min-reward <amount>', 'Minimum reward amount', parseInt)
    .option('-c, --capabilities <caps>', 'Required capabilities (comma-separated)')
    .option('-l, --limit <n>', 'Number of results', parseInt, 20)
    .option('--offset <n>', 'Pagination offset', parseInt, 0)
    .action(async (options) => {
      const json = program.opts().json;

      try {
        const client = new ApiClient();
        const result = await client.listTasks({
          status: options.status,
          type: options.type,
          difficulty: options.difficulty,
          minReward: options.minReward,
          capabilities: options.capabilities?.split(','),
          limit: options.limit,
          offset: options.offset,
        });

        if (json) {
          output(result, { json: true });
        } else {
          const displayTasks = result.tasks.map((t) => ({
            id: t.id,
            title: t.title.slice(0, 40) + (t.title.length > 40 ? '...' : ''),
            status: t.status,
            difficulty: t.difficulty || '—',
            reward: t.rewardAmount ? `${t.rewardAmount} ${t.rewardCurrency || 'USDC'}` : '—',
          }));
          output(displayTasks);
          console.log(`\nShowing ${result.tasks.length} of ${result.total} tasks`);
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to fetch tasks');
        }
        process.exit(1);
      }
    });

  tasks
    .command('show <taskId>')
    .description('View details of a specific task')
    .action(async (taskId) => {
      const json = program.opts().json;

      try {
        const client = new ApiClient();
        const task = await client.getTask(taskId);

        if (json) {
          output(task, { json: true });
        } else {
          output({
            ID: task.id,
            Title: task.title,
            Status: task.status,
            Type: task.type,
            Difficulty: task.difficulty || '—',
            Reward: task.rewardAmount
              ? `${task.rewardAmount} ${task.rewardCurrency || 'USDC'}`
              : '—',
            Repository: task.repositoryUrl || '—',
            'Claimed By': task.claimedBy || '—',
            'Created At': new Date(task.createdAt).toLocaleString(),
          });

          if (task.description) {
            console.log('\nDescription:');
            console.log(task.description);
          }

          if (task.requirements?.length) {
            console.log('\nRequired Capabilities:', task.requirements.join(', '));
          }
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to fetch task');
        }
        process.exit(1);
      }
    });
}
