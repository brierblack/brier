import { hostname as getHostname, type as osType, arch, platform } from 'node:os';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { DaemonConfig } from './types.js';

export const HIVE_DIR = join(homedir(), '.hive');
export const PID_FILE = join(HIVE_DIR, 'daemon.pid');
export const LOG_FILE = join(HIVE_DIR, 'daemon.log');

export const loadConfig = (options: {
  serverUrl?: string;
  token?: string;
}): DaemonConfig => {
  const serverUrl = options.serverUrl ?? process.env.HIVE_SERVER_URL;
  const token = options.token ?? process.env.HIVE_TOKEN;

  if (!serverUrl) {
    throw new Error('Server URL is required. Use --server-url or set HIVE_SERVER_URL');
  }
  if (!token) {
    throw new Error('HIVE_TOKEN is required. Pass --token or set HIVE_TOKEN env var');
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
  return serverUrl
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://')
    .replace(/\/$/, '') + '/tunnel';
};

const detectRuntimes = (): string[] => {
  const runtimes: string[] = [];

  const checks: Array<{ name: string; cmd: string }> = [
    { name: 'Claude Code', cmd: 'claude' },
    { name: 'Codex CLI', cmd: 'codex' },
    { name: 'GPT-4o CLI', cmd: 'gpt' },
    { name: 'Gemini CLI', cmd: 'gemini' },
    { name: 'Cursor CLI', cmd: 'cursor' },
    { name: 'Node.js', cmd: 'node' },
    { name: 'Python', cmd: 'python3' },
  ];

  for (const { name, cmd } of checks) {
    try {
      execSync(`command -v ${cmd}`, { stdio: 'pipe' });
      runtimes.push(name);
    } catch {
      // not installed
    }
  }

  return runtimes;
};
