import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import type { DaemonState } from '../definitions/index.js';
import { BRIER_DIR, DAEMON_STATE_FILE } from '../config/index.js';

/**
 * daemon 运行状态契约（~/.brier/daemon.pid，JSON）。
 *
 * 前台 CLI 与 daemon 子进程之间唯一的持久契约：Manager 写初始记录并轮询 ready，
 * Runner 进入运行后置 ready/写 bootError、随隧道状态更新 tunnelState。
 * 本模块同时提供进程存活与身份校验，避免 PID 被系统复用后误判/误杀。
 */

const WAIT_POLL_MS = 200;

/** 仅判断 pid 是否存活（kill 0）。 */
export const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EPERM';
  }
};

/** 读取进程命令行；ps 不可用或进程不存在时返回 null。 */
const readProcessCommand = (pid: number): string | null => {
  try {
    const out = execSync(`ps -p ${pid} -o command=`, { stdio: ['ignore', 'pipe', 'ignore'] });
    return out.toString().trim();
  } catch {
    return null;
  }
};

/**
 * 校验状态记录对应的 daemon 是否存活：
 * pid 存活 + 命令行含 DaemonRunner（防止 PID 复用后指向无关进程）。
 * ps 不可用时退化为仅存活判断，避免跨平台误伤。
 */
export const isDaemonRunning = (state: DaemonState): boolean => {
  if (!isProcessAlive(state.pid)) return false;
  const command = readProcessCommand(state.pid);
  return command === null || command.includes('DaemonRunner');
};

/** 读取运行状态；文件缺失或字段不全（含旧版格式）时返回 null。 */
export const readDaemonState = (): DaemonState | null => {
  try {
    const data = JSON.parse(readFileSync(DAEMON_STATE_FILE, 'utf-8')) as Partial<DaemonState>;
    if (
      typeof data.pid !== 'number' ||
      typeof data.startTime !== 'number' ||
      typeof data.serverUrl !== 'string' ||
      typeof data.ready !== 'boolean'
    ) {
      return null;
    }
    return data as DaemonState;
  } catch {
    return null;
  }
};

/** 写入完整运行状态（Manager 启动时调用）。 */
export const writeDaemonState = (state: DaemonState): void => {
  mkdirSync(BRIER_DIR, { recursive: true });
  writeFileSync(DAEMON_STATE_FILE, JSON.stringify(state, null, 2));
};

/** 合并更新状态（Runner 侧置 ready/bootError/tunnelState，保留其余字段）。 */
export const updateDaemonState = (patch: Partial<DaemonState>): void => {
  const current = readDaemonState() ?? {
    pid: process.pid,
    startTime: Date.now(),
    serverUrl: '',
    ready: false,
  };
  writeDaemonState({ ...current, ...patch });
};

/** 清理运行状态文件（不存在时静默）。 */
export const removeDaemonState = (): void => {
  try {
    unlinkSync(DAEMON_STATE_FILE);
  } catch {
    /* 文件不存在则忽略 */
  }
};

/** 轮询等待 pid 退出；超时返回 false。 */
export const waitForProcessExit = (pid: number, timeoutMs = 5_000): Promise<boolean> => {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (!isProcessAlive(pid)) {
        resolve(true);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, WAIT_POLL_MS);
    };
    check();
  });
};
