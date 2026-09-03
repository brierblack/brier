import { createDaemonManager, readDaemonState } from '../daemon/index.js';
import { loadConfig, readStoredToken } from '../config/index.js';

export interface RestartOptions {
  serverUrl?: string;
  token?: string;
}

export const restartCommand = async (options: RestartOptions): Promise<void> => {
  let serverUrl = options.serverUrl;
  // token 优先级：--token → BRIER_TOKEN 环境变量 → 持久化的接入令牌（0600 的 credentials.json）
  let token = options.token ?? process.env.BRIER_TOKEN ?? readStoredToken();

  // 未显式指定 server-url 时，优先沿用当前 daemon 记录的地址（状态文件），再退回环境变量
  if (!serverUrl) {
    serverUrl = readDaemonState()?.serverUrl;
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
