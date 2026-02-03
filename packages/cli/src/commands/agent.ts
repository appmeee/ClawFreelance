import { randomBytes } from 'node:crypto';

import type { Command } from 'commander';

import { ApiClient, ApiClientError } from '../api-client.js';
import { getConfigValue, setConfigValue } from '../config.js';
import { error, info, output, success } from '../output.js';

export function registerAgentCommands(program: Command): void {
  const agent = program.command('agent').description('Manage agent registration');

  agent
    .command('register')
    .description('Register a new agent with the platform')
    .requiredOption('-n, --name <name>', 'Display name for the agent')
    .option('-w, --wallet <address>', 'Wallet address for receiving payments')
    .option('-c, --capabilities <caps>', 'Agent capabilities (comma-separated)')
    .action(async (options) => {
      const json = program.opts().json;

      try {
        // Generate a random public key for the agent
        const publicKey = randomBytes(32).toString('hex');

        const client = new ApiClient();
        const result = await client.registerAgent({
          publicKey,
          displayName: options.name,
          walletAddress: options.wallet,
          capabilities: options.capabilities?.split(',').map((c: string) => c.trim()),
        });

        // Save the API key and agent ID to config
        setConfigValue('apiKey', result.apiKey);
        setConfigValue('agentId', result.agent.id);

        if (json) {
          output(result, { json: true });
        } else {
          success('Agent registered successfully!');
          console.log();
          output({
            'Agent ID': result.agent.id,
            Name: result.agent.displayName,
            'API Key': result.apiKey,
            Capabilities: result.agent.capabilities?.join(', ') || '—',
          });
          console.log();
          info('API key has been saved to your config');
          info('Keep your API key secure - it cannot be recovered');
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to register agent');
        }
        process.exit(1);
      }
    });

  agent
    .command('status')
    .description('Check your agent registration status')
    .action(async () => {
      const json = program.opts().json;
      const agentId = getConfigValue('agentId');

      if (!agentId) {
        error('No agent registered. Run "claw agent register" first.');
        process.exit(1);
      }

      try {
        const client = new ApiClient();
        const agent = await client.getAgent(agentId);
        const reputation = await client.getAgentReputation(agentId);

        if (json) {
          output({ agent, reputation }, { json: true });
        } else {
          output({
            'Agent ID': agent.id,
            Name: agent.displayName,
            'Reputation Score': reputation.score,
            'Tasks Completed': agent.tasksCompleted || 0,
            Wallet: agent.walletAddress || '—',
            Capabilities: agent.capabilities?.join(', ') || '—',
            Registered: new Date(agent.createdAt).toLocaleString(),
          });
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to fetch agent status');
        }
        process.exit(1);
      }
    });

  agent
    .command('reputation')
    .description('View your reputation history')
    .action(async () => {
      const json = program.opts().json;
      const agentId = getConfigValue('agentId');

      if (!agentId) {
        error('No agent registered. Run "claw agent register" first.');
        process.exit(1);
      }

      try {
        const client = new ApiClient();
        const reputation = await client.getAgentReputation(agentId);

        if (json) {
          output(reputation, { json: true });
        } else {
          console.log(`Current Score: ${reputation.score}\n`);
          console.log('Recent History:');
          output(
            reputation.history.map((h) => ({
              Date: new Date(h.date).toLocaleDateString(),
              Change: h.change > 0 ? `+${h.change}` : String(h.change),
              Reason: h.reason,
            }))
          );
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          error(`${err.message}${err.details ? `: ${err.details}` : ''}`);
        } else {
          error('Failed to fetch reputation');
        }
        process.exit(1);
      }
    });
}
