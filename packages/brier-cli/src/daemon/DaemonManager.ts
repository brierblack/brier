import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DaemonStatus } from '../definitions/index.js';
import { writeCredentials } from '../config/index.js';
import { logger } from '../core/index.js';
import {
  isDaemonRunning,
  readDaemonState,
  removeDaemonState,
  waitForProcessExit,
  writeDaemonState,
} from './state.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RUNNER_SCRIPT = join(__dirname, 'DaemonRunner.js');

/** 启动后等待子进程就绪（ready/bootError）的时限 */
const READY_TIMEOUT_MS = 3_000;
const READY_POLL_MS = 150;

export interface DaemonManager {
  start: (options: { serverUrl: string; token: string }) => Promise<void>;
  stop: () => Promise<void>;
  restart: (options: { serverUrl: string; token: string }) => Promise<void>;
  status: () => DaemonStatus;
}

export const createDaemonManager = (): DaemonManager => {
  const start = async (options: { serverUrl: string; token: string }): Promise<void> => {
    const existing = readDaemonState();
    if (existing && isDaemonRunning(existing)) {
      throw new Error(`Daemon is already running (PID: ${existing.pid})`);
    }
    if (existing) {
      removeDaemonState();
    }

    // 持久化接入令牌（0600），供 `daemon restart` 无参回退；失败仅告警，不阻断启动
    try {
      writeCredentials(options.token);
    } catch (err) {
      logger.warn(
        'Failed to persist credentials:',
        err instanceof Error ? err.message : String(err),
      );
    }

    const childEnv: Record<string, string> = {
      ...process.env,
      BRIER_TOKEN: options.token,
      BRIER_SERVER_URL: options.serverUrl,
      BRIER_DAEMON_MODE: '1',
    };

    const child = spawn(process.execPath, [RUNNER_SCRIPT], {
      detached: true,
      stdio: 'ignore',
      env: childEnv,
    });

    child.unref();

    if (typeof child.pid !== 'number') {
      throw new Error('Failed to spawn daemon process');
    }

    // 先写“未就绪”状态，等子进程通过 ready/bootError 完成就绪握手
    const startTime = Date.now();
    writeDaemonState({
      pid: child.pid,
      startTime,
      serverUrl: options.serverUrl,
      ready: false,
    });
    logger.info('Daemon spawned, waiting for ready (PID:', child.pid, ')');

    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
      const state = readDaemonState();
      if (state?.ready) {
        logger.info('Daemon started, PID:', child.pid);
        return;
      }
      if (state?.bootError) {
        removeDaemonState();
        throw new Error(`Daemon failed to start: ${state.bootError}`);
      }
    }

    // 超时：进程若已退出则清理并报错，否则强杀后清理
    removeDaemonState();
    if (!(await waitForProcessExit(child.pid, 500))) {
      try {
        child.kill('SIGTERM');
      } catch {
        /* already gone */
      }
    }
    throw new Error('Daemon start timed out, please check ~/.brier/daemon.log');
  };

  const stop = async (): Promise<void> => {
    const data = readDaemonState();
    if (!data) {
      logger.warn('No state file found, daemon may not be running');
      return;
    }

    if (!isDaemonRunning(data)) {
      // 身份校验不通过：PID 已复用或进程已退出，只清理状态，不误杀其他进程
      logger.warn('Daemon not running or PID reused, cleaning up state file');
      removeDaemonState();
      return;
    }

    logger.info('Sending SIGTERM to PID:', data.pid);
    try {
      process.kill(data.pid, 'SIGTERM');
    } catch {
      removeDaemonState();
      logger.warn('Process already exited, cleaning up');
      return;
    }

    const exited = await waitForProcessExit(data.pid, 5000);
    if (!exited) {
      logger.warn('Process did not exit, sending SIGKILL');
      try {
        process.kill(data.pid, 'SIGKILL');
      } catch (err) {
        logger.error('Failed to kill process:', err);
      }
    }

    removeDaemonState();
    logger.info('Daemon stopped');
  };

  const restart = async (options: { serverUrl: string; token: string }): Promise<void> => {
    await stop();
    await start(options);
  };

  const status = (): DaemonStatus => {
    const data = readDaemonState();
    if (!data) return 'stopped';
    if (isDaemonRunning(data)) return 'running';
    removeDaemonState();
    return 'stopped';
  };

  return { start, stop, restart, status };
};
