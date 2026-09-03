#!/usr/bin/env node
import { Command } from 'commander';
import { readCliVersion } from './config.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { restartCommand } from './commands/restart.js';
import { statusCommand } from './commands/status.js';
import { logCommand } from './commands/log.js';

const program = new Command();

program
  .name('brier')
  .description('Brier CLI - Connect to Brier platform via encrypted tunnel')
  .version(readCliVersion());

const daemon = program.command('daemon').description('Manage the brier background service');

daemon
  .command('start')
  .description('Start the background service')
  .requiredOption('--server-url <url>', 'Brier server URL')
  .option('--token <token>', 'BRIER_TOKEN (or set BRIER_TOKEN env var)')
  .action(async (opts: { serverUrl: string; token?: string }) => {
    try {
      await startCommand(opts);
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

daemon
  .command('stop')
  .description('Stop the background service')
  .action(async () => {
    try {
      await stopCommand();
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

daemon
  .command('restart')
  .description('Restart the background service')
  .option('--server-url <url>', 'Brier server URL (defaults to previous config)')
  .option('--token <token>', 'BRIER_TOKEN (or set BRIER_TOKEN env var)')
  .action(async (opts: { serverUrl?: string; token?: string }) => {
    try {
      await restartCommand(opts);
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

daemon
  .command('status')
  .description('Check the background service status')
  .action(() => {
    statusCommand();
  });

daemon
  .command('log')
  .description('Show the latest daemon log lines')
  .action(() => {
    try {
      logCommand();
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error('Fatal:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
