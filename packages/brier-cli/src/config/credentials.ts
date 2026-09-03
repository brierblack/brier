import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { CREDENTIALS_FILE } from './paths.js';

/** 持久化内容：只存接入令牌（serverUrl 由 PID 文件记录，不重复落盘）。 */
interface StoredCredentials {
  token: string;
}

/** 读取持久化的接入令牌；文件缺失或损坏时返回 undefined。 */
export const readStoredToken = (): string | undefined => {
  try {
    const data = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8')) as StoredCredentials;
    return typeof data.token === 'string' && data.token.length > 0 ? data.token : undefined;
  } catch {
    return undefined;
  }
};

/**
 * 持久化接入令牌到 ~/.brier/credentials.json。
 * 写入使用 mode 0600，并对已存在的文件强制收紧权限（防止先前被宽权限创建）。
 * 失败会抛错，由调用方决定是否阻断启动。
 */
export const writeCredentials = (token: string): void => {
  mkdirSync(dirname(CREDENTIALS_FILE), { recursive: true });
  writeFileSync(CREDENTIALS_FILE, JSON.stringify({ token } satisfies StoredCredentials, null, 2), {
    mode: 0o600,
  });
  chmodSync(CREDENTIALS_FILE, 0o600);
};
