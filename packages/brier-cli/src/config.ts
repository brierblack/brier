import { hostname as getHostname, type as osType, arch, platform, homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { accessSync, constants, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DaemonConfig } from './types.js';
import { RUNTIME_REGISTRY } from './runtimes.js';

export const BRIER_DIR = join(homedir(), '.brier');
export const PID_FILE = join(BRIER_DIR, 'daemon.pid');
export const LOG_FILE = join(BRIER_DIR, 'daemon.log');

/** CLI 自身版本（读取 dist 同级的 package.json）。 */
const readCliVersion = (): string => {
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

// macOS 自带磁盘分区工具 gpt(8) 位于 /usr/sbin/gpt，会与 OpenAI 的 gpt CLI 同名，
// macOS 自带磁盘分区工具 gpt(8) 位于 /usr/sbin/gpt，会与 OpenAI CLI 同名；
// 命中 /sbin、/usr/sbin 视为「未安装」，避免误报。
const SYSTEM_SBIN_RE = /^\/(usr\/)?sbin\//;

// shell 内建命令（如 continue、cd、type）会被 `command -v` 返回为无路径的裸名，
// 不是真实可执行文件，需排除。
const isRealExecutablePath = (hit: string): boolean =>
  Boolean(hit) && hit.includes('/') && !SYSTEM_SBIN_RE.test(hit);

const isExecutable = (file: string): boolean => {
  try {
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const expandHome = (p: string): string => (p.startsWith('~/') ? join(homedir(), p.slice(2)) : p);

const detectRuntimes = (): string[] => {
  const runtimes: string[] = [];

  for (const { name, command, fallbacks } of RUNTIME_REGISTRY) {
    let found = false;
    try {
      const hit = execSync(`command -v ${command}`, { stdio: 'pipe' }).toString().trim();
      found = isRealExecutablePath(hit);
    } catch {
      // 不在 PATH
    }
    if (!found) {
      const candidates = fallbacks ?? [`~/.local/bin/${command}`];
      found = candidates.some((p) => isExecutable(expandHome(p)));
    }
    if (found) runtimes.push(name);
  }

  return runtimes;
};
