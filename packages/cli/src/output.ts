import chalk from 'chalk';

export interface OutputOptions {
  json?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function output(data: any, options: OutputOptions = {}): void {
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
  } else if (Array.isArray(data)) {
    printTable(data);
  } else if (typeof data === 'object') {
    printObject(data);
  } else {
    console.log(data);
  }
}

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warn(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function printObject(obj: Record<string, any>): void {
  const maxKeyLength = Math.max(...Object.keys(obj).map((k) => k.length));

  for (const [key, value] of Object.entries(obj)) {
    const paddedKey = key.padEnd(maxKeyLength);
    const displayValue = formatValue(value);
    console.log(`${chalk.cyan(paddedKey)}  ${displayValue}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function printTable(rows: Record<string, any>[]): void {
  if (rows.length === 0) {
    console.log(chalk.dim('No results'));
    return;
  }

  const columns = Object.keys(rows[0]);
  const columnWidths: Record<string, number> = {};

  // Calculate column widths
  for (const col of columns) {
    columnWidths[col] = Math.max(col.length, ...rows.map((r) => String(r[col] ?? '').length));
  }

  // Print header
  const header = columns.map((col) => chalk.bold(col.padEnd(columnWidths[col]))).join('  ');
  console.log(header);
  console.log(chalk.dim('─'.repeat(header.length)));

  // Print rows
  for (const row of rows) {
    const line = columns.map((col) => String(row[col] ?? '').padEnd(columnWidths[col])).join('  ');
    console.log(line);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return chalk.dim('—');
  }
  if (typeof value === 'boolean') {
    return value ? chalk.green('yes') : chalk.red('no');
  }
  if (typeof value === 'number') {
    return chalk.yellow(String(value));
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}

export function printBanner(): void {
  console.log(
    chalk.cyan(`
   ╔═╗╦  ╔═╗╦ ╦
   ║  ║  ╠═╣║║║
   ╚═╝╩═╝╩ ╩╚╩╝
  `) + chalk.dim('ClawFreelance CLI')
  );
  console.log();
}
