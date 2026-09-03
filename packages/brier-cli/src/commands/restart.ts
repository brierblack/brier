import { existsSync, readFileSync } from 'node:fs';
import { createDaemonManager } from '../daemon/DaemonManager.js';
import { loadConfig, PID_FILE, readStoredToken } from '../config/index.js';
import type { PidFileData } from '../definitions/index.js';

export interface RestartOptions {
  serverUrl?: string;
  token?: string;
}

/** 读取 PID 文件中记录的 serverUrl（重启时回退用）。 */
const readSavedServerUrl = (): string | undefined => {
  if (!existsSync(PID_FILE)) return undefined;
  try {
    const data = JSON.parse(readFileSync(PID_FILE, 'utf-8')) as PidFileData;
    return data.serverUrl;
  } catch {
    return undefined;
  }
};

export const restartCommand = async (options: RestartOptions): Promise<void> => {
  let serverUrl = options.serverUrl;
  // token 优先级：--token → BRIER_TOKEN 环境变量 → 持久化的接入令牌（0600 的 credentials.json）
  let token = options.token ?? process.env.BRIER_TOKEN ?? readStoredToken();

  // 未显式指定 server-url 时，优先沿用当前 daemon 记录的地址（PID 文件），再退回环境变量
  if (!serverUrl) {
    serverUrl = readSavedServerUrl();
  }

  if (!serverUrl || !token) {
    try {
      const config = loadConfig();
      if (!serverUrl) serverUrl = config.serverUrl;
      if (!token) token = config.token;
    } catch {
      // Will be caught below
    }
  }

  if (!serverUrl) {
    throw new Error('Server URL is required. Pass --server-url or set BRIER_SERVER_URL.');
  }
  if (!token) {
    throw new Error('BRIER_TOKEN is required. Pass --token or set BRIER_TOKEN env var.');
  }

  const manager = createDaemonManager();
  await manager.restart({ serverUrl, token });

  console.log('✓ 后台服务已重启');
  console.log(`  Server: ${serverUrl}`);
};
