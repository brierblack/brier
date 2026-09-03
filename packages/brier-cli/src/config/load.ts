import { arch, hostname as getHostname, platform, type as osType } from 'node:os';
import type { DaemonConfig } from '../definitions/index.js';
import { detectInstalledRuntimes } from '../core/index.js';
import { readCliVersion } from './version.js';

/**
 * daemon 装配配置加载：从 BRIER_SERVER_URL / BRIER_TOKEN 环境变量
 * 读取 serverUrl / token，并组合本机信息（hostname/os/runtimes/version）。
 * 校验失败（缺少必填项）时抛出带说明的错误。
 */
export const loadConfig = (): DaemonConfig => {
  const serverUrl = process.env.BRIER_SERVER_URL;
  const token = process.env.BRIER_TOKEN;

  if (!serverUrl) {
    throw new Error('Server URL is required. Use --server-url or set BRIER_SERVER_URL');
  }
  if (!token) {
    throw new Error('BRIER_TOKEN is required. Pass --token or set BRIER_TOKEN env var');
  }

  return {
    serverUrl,
    token,
    hostname: getHostname(),
    os: `${osType()} ${platform()} ${arch()}`,
    runtimes: detectInstalledRuntimes(),
    version: readCliVersion(),
  };
};
