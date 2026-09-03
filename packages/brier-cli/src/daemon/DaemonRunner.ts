import type { ClientMessage, DaemonConfig, TunnelState } from '../definitions/index.js';
import { loadConfig, LOG_FILE } from '../config/index.js';
import { configureLogger, logger } from '../core/index.js';
import {
  createTunnelClient,
  type TunnelClient,
  type TunnelMessageHandlers,
} from '../tunnel/index.js';
import { createTaskExecutor, type TaskExecutor } from './TaskExecutor.js';

let tunnel: TunnelClient | null = null;
let taskExecutor: TaskExecutor | null = null;

/** 停止隧道并取消所有运行中任务（宿主层的生命周期策略）。 */
const stopAll = async () => {
  if (tunnel) {
    await tunnel.stop();
    tunnel = null;
  }
  taskExecutor?.cancelAll();
  taskExecutor = null;
};

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);
  await stopAll();
  process.exit(0);
};

const handleUncaughtError = (err: Error) => {
  logger.error('Uncaught error:', err.message);
  void stopAll().finally(() => process.exit(1));
};

const run = (config: DaemonConfig) => {
  /**
   * 上报一条任务消息。
   * send() 已不抛错，返回是否真正发出；未连接时返回 false，本帧按设计丢弃
   * （断线窗口不上行、不做缓冲，属已知边界；连接恢复后的任务对账为后续增强）。
   */
  const safeSend = (message: ClientMessage) => {
    const sent = tunnel?.send(message) ?? false;
    if (!sent) {
      return;
    }
  };

  const executor = createTaskExecutor({
    onOutput: (taskId, stream, data) => safeSend({ type: 'task-output', taskId, stream, data }),
    onComplete: (taskId, exitCode) => safeSend({ type: 'task-complete', taskId, exitCode }),
    onError: (taskId, error) => safeSend({ type: 'task-error', taskId, error }),
  });
  taskExecutor = executor;

  // 组合点：把隧道下发的业务消息翻译成任务执行动作
  const messageHandlers: TunnelMessageHandlers = {
    onTaskStart: (message) => {
      executor.execute({
        taskId: message.taskId,
        runtime: message.runtime,
        command: message.command,
        args: message.args,
        cwd: message.cwd,
        env: message.env,
        prompt: message.prompt,
      });
    },
    onTaskCancel: (taskId) => {
      executor.cancel(taskId);
    },
  };

  tunnel = createTunnelClient(config, messageHandlers);

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
    config = loadConfig();
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
