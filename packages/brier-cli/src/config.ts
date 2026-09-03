import { hostname as getHostname, type as osType, arch, platform, homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DaemonConfig } from './definitions/index.js';
import { resolveRuntimeExecutable, RUNTIME_REGISTRY } from './runtimes.js';

export const BRIER_DIR = join(homedir(), '.brier');
export const PID_FILE = join(BRIER_DIR, 'daemon.pid');
export const LOG_FILE = join(BRIER_DIR, 'daemon.log');

/** CLI 自身版本（读取 dist 同级的 package.json）。 */
export const readCliVersion = (): string => {
  try {
    const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

export const loadConfig = (options: { serverUrl?: string; token?: string }): DaemonConfig => {
  const serverUrl = options.serverUrl ?? process.env.BRIER_SERVER_URL;
  const token = options.token ?? process.env.BRIER_TOKEN;

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
    runtimes: detectRuntimes(),
    version: readCliVersion(),
  };
};

export const toWsUrl = (serverUrl: string): string => {
  return (
    serverUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://')
      .replace(/\/$/, '') + '/tunnel'
  );
};

/** 探测本机已安装的 AI runtime（与执行共用同一可执行文件解析）。 */
const detectRuntimes = (): string[] =>
  RUNTIME_REGISTRY.filter((r) => resolveRuntimeExecutable(r.name) !== null).map((r) => r.name);
