import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * 应用文件路径常量。
 * 集中到 ~/.brier/ 下，保证与 daemon 启动时的工作目录无关。
 */

/** Brier 用户数据目录（~/.brier） */
export const BRIER_DIR = join(homedir(), '.brier');
/** daemon 运行状态文件（JSON，结构见 definitions/daemon.ts 的 DaemonState） */
export const DAEMON_STATE_FILE = join(BRIER_DIR, 'daemon.json');
/** daemon 运行日志文件 */
export const LOG_FILE = join(BRIER_DIR, 'daemon.log');
/** daemon 接入令牌持久化文件（0600，供 `daemon restart` 无参回退） */
export const CREDENTIALS_FILE = join(BRIER_DIR, 'credentials.json');
