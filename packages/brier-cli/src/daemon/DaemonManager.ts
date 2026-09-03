import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PidFileData, DaemonStatus } from '../definitions/index.js';
import { BRIER_DIR, PID_FILE, writeCredentials } from '../config/index.js';
import { logger } from '../core/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RUNNER_SCRIPT = join(__dirname, 'DaemonRunner.js');

const isProcessRunning = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EPERM';
  }
};

const readPidFile = (): PidFileData | null => {
  if (!existsSync(PID_FILE)) return null;
  try {
    const data = readFileSync(PID_FILE, 'utf-8');
    return JSON.parse(data) as PidFileData;
  } catch {
    return null;
  }
};

const writePidFile = (data: PidFileData) => {
  mkdirSync(BRIER_DIR, { recursive: true });
  writeFileSync(PID_FILE, JSON.stringify(data, null, 2));
};

const removePidFile = () => {
  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }
};

const waitForExit = (pid: number, timeoutMs = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      if (!isProcessRunning(pid)) {
        resolve(true);
        return;
      }
      if (Date.now() - startTime >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, 200);
    };

    check();
  });
};

export interface DaemonManager {
  start: (options: { serverUrl: string; token: string }) => Promise<void>;
  stop: () => Promise<void>;
  restart: (options: { serverUrl: string; token: string }) => Promise<void>;
  status: () => DaemonStatus;
}

export const createDaemonManager = (): DaemonManager => {
  const start = async (options: { serverUrl: string; token: string }): Promise<void> => {
    const existing = readPidFile();
    if (existing && isProcessRunning(existing.pid)) {
      throw new Error(`Daemon is already running (PID: ${existing.pid})`);
    }
    if (existing) {
      removePidFile();
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

    writePidFile({
      pid: child.pid,
      startTime: Date.now(),
      serverUrl: options.serverUrl,
    });

    logger.info('Daemon started, PID:', child.pid);
  };

  const stop = async (): Promise<void> => {
    const data = readPidFile();
    if (!data) {
      logger.warn('No PID file found, daemon may not be running');
      return;
    }

    if (!isProcessRunning(data.pid)) {
      logger.info('Process not running, cleaning up PID file');
      removePidFile();
      return;
    }

    logger.info('Sending SIGTERM to PID:', data.pid);
    process.kill(data.pid, 'SIGTERM');

    const exited = await waitForExit(data.pid, 5000);
    if (!exited) {
      logger.warn('Process did not exit, sending SIGKILL');
      try {
        process.kill(data.pid, 'SIGKILL');
      } catch (err) {
        logger.error('Failed to kill process:', err);
      }
    }

    removePidFile();
    logger.info('Daemon stopped');
  };

  const restart = async (options: { serverUrl: string; token: string }): Promise<void> => {
    await stop();
    await start(options);
  };

  const status = (): DaemonStatus => {
    const data = readPidFile();
    if (!data) return 'stopped';
    if (isProcessRunning(data.pid)) return 'running';
    removePidFile();
    return 'stopped';
  };

  return { start, stop, restart, status };
};
