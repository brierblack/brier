import { createDaemonManager } from '../daemon/DaemonManager.js';
import { loadConfig } from '../config.js';

export interface RestartOptions {
  serverUrl?: string;
  token?: string;
}

export const restartCommand = async (options: RestartOptions): Promise<void> => {
  let serverUrl = options.serverUrl;
  let token = options.token ?? process.env.BRIER_TOKEN;

  if (!serverUrl || !token) {
    try {
      const config = loadConfig({});
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
