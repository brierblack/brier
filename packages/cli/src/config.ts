import { hostname as getHostname, type as osType, arch, platform } from 'node:os';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { DaemonConfig } from './types.js';
import { RUNTIME_REGISTRY } from './runtimes.js';

export const BRIER_DIR = join(homedir(), '.brier');
export const PID_FILE = join(BRIER_DIR, 'daemon.pid');
export const LOG_FILE = join(BRIER_DIR, 'daemon.log');

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

const detectRuntimes = (): string[] => {
  const runtimes: string[] = [];

  for (const { name, command } of RUNTIME_REGISTRY) {
    try {
      execSync(`command -v ${command}`, { stdio: 'pipe' });
      runtimes.push(name);
    } catch {
      // not installed
    }
  }

  return runtimes;
};
