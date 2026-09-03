import { createDaemonManager } from '../daemon/DaemonManager.js';
import { LOG_FILE } from '../config/index.js';

export interface StartOptions {
  serverUrl: string;
  token?: string;
}

export const startCommand = async (options: StartOptions): Promise<void> => {
  const token = options.token ?? process.env.BRIER_TOKEN;
  if (!token) {
    throw new Error('BRIER_TOKEN is required. Pass --token or set BRIER_TOKEN env var.');
  }

  const manager = createDaemonManager();
  await manager.start({ serverUrl: options.serverUrl, token });

  console.log('✓ 后台服务已启动');
  console.log(`  Server: ${options.serverUrl}`);
  console.log(`  Log: ${LOG_FILE}`);
};
