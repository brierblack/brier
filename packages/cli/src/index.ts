#!/usr/bin/env node
import { Command } from 'commander';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { restartCommand } from './commands/restart.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

program
  .name('hiveblack')
  .description('HiveBlack CLI - Connect to Hive platform via encrypted tunnel')
  .version('0.0.1');

const daemon = program.command('daemon').description('Manage the hiveblack background service');

daemon
  .command('start')
  .description('Start the background service')
  .requiredOption('--server-url <url>', 'Hive server URL')
  .option('--token <token>', 'HIVE_TOKEN (or set HIVE_TOKEN env var)')
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
  .option('--server-url <url>', 'Hive server URL (defaults to previous config)')
  .option('--token <token>', 'HIVE_TOKEN (or set HIVE_TOKEN env var)')
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

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error('Fatal:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
