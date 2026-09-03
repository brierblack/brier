import type { ClientMessage, DaemonConfig, TunnelState } from '../definitions/index.js';
import { loadConfig, LOG_FILE } from '../config.js';
import { configureLogger, logger } from '../logger.js';
import { createTunnelClient, type TunnelClient } from '../tunnel/TunnelClient.js';
import { createTaskExecutor } from './TaskExecutor.js';

let tunnel: TunnelClient | null = null;

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);

  if (tunnel) {
    await tunnel.stop();
    tunnel = null;
  }

  process.exit(0);
};

const handleUncaughtError = (err: Error) => {
  logger.error('Uncaught error:', err.message);
  if (tunnel) {
    tunnel.stop().finally(() => process.exit(1));
  } else {
    process.exit(1);
  }
};

const run = (config: DaemonConfig) => {
  const safeSend = (message: ClientMessage) => {
    try {
      tunnel?.send(message);
    } catch {
      // Connection not ready, output is dropped
    }
  };

  const taskExecutor = createTaskExecutor({
    onOutput: (taskId, stream, data) => safeSend({ type: 'task-output', taskId, stream, data }),
    onComplete: (taskId, exitCode) => safeSend({ type: 'task-complete', taskId, exitCode }),
    onError: (taskId, error) => safeSend({ type: 'task-error', taskId, error }),
  });

  tunnel = createTunnelClient(config, taskExecutor);

  tunnel.onStateChange((state: TunnelState) => {
    logger.info('Tunnel state:', state);
  });

  tunnel.start();
  logger.info('Daemon runner started');
  logger.info('Server:', config.serverUrl);
  logger.info('Hostname:', config.hostname);
  logger.info('OS:', config.os);
  logger.info('Runtimes:', config.runtimes.join(', ') || 'none detected');
};

const main = () => {
  if (process.env.BRIER_DAEMON_MODE !== '1') {
    console.error(
      'This script is intended to be run as a daemon. Use "brier daemon start" instead.',
    );
    process.exit(1);
  }

  configureLogger(LOG_FILE);

  let config: DaemonConfig;
  try {
    config = loadConfig({});
  } catch (err) {
    logger.error('Config error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', handleUncaughtError);
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });

  run(config);
};

main();
