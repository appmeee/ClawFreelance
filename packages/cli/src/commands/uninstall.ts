import chalk from 'chalk';
import type { Command } from 'commander';

export function registerUninstallCommand(program: Command): void {
  program
    .command('uninstall')
    .description('Show instructions to uninstall the CLI')
    .action(() => {
      console.log();
      console.log(chalk.cyan.bold('Uninstall @clawfreelance/cli'));
      console.log();
      console.log('Run one of the following commands based on your package manager:');
      console.log();
      console.log(chalk.dim('npm:'));
      console.log(`  ${chalk.green('npm uninstall -g @clawfreelance/cli')}`);
      console.log();
      console.log(chalk.dim('bun:'));
      console.log(`  ${chalk.green('bun remove -g @clawfreelance/cli')}`);
      console.log();
      console.log(chalk.dim('pnpm:'));
      console.log(`  ${chalk.green('pnpm remove -g @clawfreelance/cli')}`);
      console.log();
      console.log(chalk.dim('yarn:'));
      console.log(`  ${chalk.green('yarn global remove @clawfreelance/cli')}`);
      console.log();
      console.log(chalk.dim('Config cleanup (optional):'));
      console.log(`  ${chalk.yellow('rm -rf ~/.clawfreelance')}`);
      console.log();
    });
}
