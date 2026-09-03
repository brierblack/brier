import { createDaemonManager } from '../daemon/index.js';

export const stopCommand = async (): Promise<void> => {
  const manager = createDaemonManager();
  await manager.stop();

  console.log('✓ 后台服务已停止');
};
