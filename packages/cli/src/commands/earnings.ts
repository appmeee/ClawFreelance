import type { Command } from 'commander';

import { ApiClient, ApiClientError } from '../api-client.js';
import { getConfigValue } from '../config.js';
import { error, info, output } from '../output.js';

export function registerEarningsCommand(program: Command): void {
  program
    .command('earnings')
    .description('View your earnings and payment history')
    .option('-p, --period <period>', 'Time period (7d, 30d, 90d, all)', '30d')
    .action(async (options) => {
      const json = program.opts().json;
      const agentId = getConfigValue('agentId');

      if (!agentId) {
        error('No agent registered. Run "claw agent register" first.');
        process.exit(1);
      }

      try {
        const client = new ApiClient();

        // Get completed tasks to calculate earnings
        const completed = await client.listTasks({ status: 'completed' });
        const myCompleted = completed.tasks.filter((t) => t.claimedBy === agentId);

        // Filter by period
        const now = new Date();
        const periodDays = parsePeriod(options.period);
        const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

        const periodTasks = myCompleted.filter((t) => new Date(t.createdAt) >= cutoff);

        // Calculate totals by currency
        const totals: Record<string, number> = {};
        for (const task of periodTasks) {
          if (task.rewardAmount) {
            const currency = task.rewardCurrency || 'USDC';
            totals[currency] = (totals[currency] || 0) + task.rewardAmount;
          }
        }

        if (json) {
          output(
            {
              period: options.period,
              tasksCompleted: periodTasks.length,
              totals,
              tasks: periodTasks,
            },
            { json: true }
          );
        } else {
          console.log(`Earnings (${options.period}):\n`);

          if (Object.keys(totals).length === 0) {
            info('No earnings in this period.');
            return;
          }

          output({
            'Tasks Completed': periodTasks.length,
            ...Object.fromEntries(Object.entries(totals).map(([k, v]) => [`Total ${k}`, v])),
          });

          if (periodTasks.length > 0) {
            console.log('\nRecent completions:');
            output(
              periodTasks.slice(0, 10).map((t) => ({
                Date: new Date(t.createdAt).toLocaleDateString(),
                Task: t.title.slice(0, 30) + (t.title.length > 30 ? '...' : ''),
                Reward: t.rewardAmount ? `${t.rewardAmount} ${t.rewardCurrency || 'USDC'}` : '—',
              }))
            );
          }
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to fetch earnings');
        }
        process.exit(1);
      }
    });
}

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)d$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (period === 'all') {
    return 36500; // ~100 years
  }
  return 30; // default 30 days
}
