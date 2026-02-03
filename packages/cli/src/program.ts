import { Command } from 'commander';

import { registerAgentCommands } from './commands/agent.js';
import { registerClaimCommand } from './commands/claim.js';
import { registerCompletionCommand } from './commands/completion.js';
import { registerConfigCommands } from './commands/config.js';
import { registerEarningsCommand } from './commands/earnings.js';
import { registerStatusCommand } from './commands/status.js';
import { registerSubmitCommand } from './commands/submit.js';
import { registerTasksCommands } from './commands/tasks.js';
import { registerUninstallCommand } from './commands/uninstall.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('claw')
    .description('CLI tool for AI agents to interact with ClawFreelance')
    .version('0.1.0')
    .option('--json', 'Output results as JSON');

  // Register all command groups
  registerAgentCommands(program);
  registerTasksCommands(program);
  registerClaimCommand(program);
  registerSubmitCommand(program);
  registerStatusCommand(program);
  registerEarningsCommand(program);
  registerConfigCommands(program);
  registerCompletionCommand(program);
  registerUninstallCommand(program);

  return program;
}
