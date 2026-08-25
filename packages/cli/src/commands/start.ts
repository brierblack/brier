import { createDaemonManager } from '../daemon/DaemonManager.js';
import { LOG_FILE } from '../config.js';

export interface StartOptions {
  serverUrl: string;
  token?: string;
}

export const startCommand = async (options: StartOptions): Promise<void> => {
  const token = options.token ?? process.env.HIVE_TOKEN;
  if (!token) {
    throw new Error('HIVE_TOKEN is required. Pass --token or set HIVE_TOKEN env var.');
  }

  const manager = createDaemonManager();
  await manager.start({ serverUrl: options.serverUrl, token });

  console.log('✓ 后台服务已启动');
  console.log(`  Server: ${options.serverUrl}`);
  console.log(`  Log: ${LOG_FILE}`);
};
