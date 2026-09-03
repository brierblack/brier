import { createDaemonManager } from '../daemon/index.js';
import { existsSync, readFileSync } from 'node:fs';
import { PID_FILE } from '../config/index.js';
import type { PidFileData } from '../definitions/index.js';

export const statusCommand = (): void => {
  const manager = createDaemonManager();
  const status = manager.status();

  if (status === 'running') {
    let pidInfo: PidFileData | null = null;
    if (existsSync(PID_FILE)) {
      try {
        pidInfo = JSON.parse(readFileSync(PID_FILE, 'utf-8')) as PidFileData;
      } catch {
        // ignore
      }
    }

    console.log('● 后台服务运行中');
    if (pidInfo) {
      console.log(`  PID: ${pidInfo.pid}`);
      console.log(`  Server: ${pidInfo.serverUrl}`);
      console.log(`  Started: ${new Date(pidInfo.startTime).toLocaleString()}`);
    }
  } else {
    console.log('○ 后台服务未运行');
  }
};
