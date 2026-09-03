import { createDaemonManager, readDaemonState } from '../daemon/index.js';

/** `brier daemon status`：展示 daemon 运行状态与状态文件详情。 */
export const statusCommand = (): void => {
  const manager = createDaemonManager();
  const status = manager.status();

  if (status === 'running') {
    const state = readDaemonState();
    console.log('● 后台服务运行中');
    if (state) {
      console.log(`  PID: ${state.pid}`);
      console.log(`  Server: ${state.serverUrl}`);
      console.log(`  Started: ${new Date(state.startTime).toLocaleString()}`);
      console.log(`  Ready: ${state.ready ? '是' : '否（启动中）'}`);
      if (state.tunnelState) {
        console.log(`  隧道状态: ${state.tunnelState}`);
      }
    }
  } else {
    console.log('○ 后台服务未运行');
  }
};
