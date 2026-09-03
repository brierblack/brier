import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * 应用文件路径常量。
 * 集中到 ~/.brier/ 下，保证与 daemon 启动时的工作目录无关。
 */

/** Brier 用户数据目录（~/.brier） */
export const BRIER_DIR = join(homedir(), '.brier');
/** daemon 进程 PID 文件（前台 CLI 与 daemon 子进程之间通信的载体） */
export const PID_FILE = join(BRIER_DIR, 'daemon.pid');
/** daemon 运行日志文件 */
export const LOG_FILE = join(BRIER_DIR, 'daemon.log');
/** daemon 接入令牌持久化文件（0600，供 `daemon restart` 无参回退） */
export const CREDENTIALS_FILE = join(BRIER_DIR, 'credentials.json');
