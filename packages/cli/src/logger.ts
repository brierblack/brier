import { mkdirSync, appendFileSync, statSync, renameSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

type LogLevel = 'info' | 'warn' | 'error';

const MAX_LOG_SIZE = 5 * 1024 * 1024;

let logFile: string | undefined;

export const configureLogger = (filePath: string | undefined) => {
  logFile = filePath;
};

const formatMessage = (level: LogLevel, message: string, ...args: unknown[]): string => {
  const timestamp = new Date().toISOString();
  const levelTag = level.toUpperCase().padEnd(5);
  const rest =
    args.length > 0
      ? ' ' + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
      : '';
  return `${timestamp} [${levelTag}] ${message}${rest}`;
};

const rotateIfNeeded = () => {
  if (!logFile) return;
  try {
    if (!existsSync(logFile)) return;
    if (statSync(logFile).size < MAX_LOG_SIZE) return;
    const backup = logFile + '.1';
    if (existsSync(backup)) {
      try { renameSync(backup, backup + '.old'); } catch { /* ignore */ }
    }
    renameSync(logFile, backup);
  } catch {
    // rotation failed, continue writing to current file
  }
};

const write = (level: LogLevel, message: string, ...args: unknown[]) => {
  const formatted = formatMessage(level, message, ...args);
  if (logFile) {
    try {
      mkdirSync(dirname(logFile), { recursive: true });
      rotateIfNeeded();
      appendFileSync(logFile, formatted + '\n');
    } catch {
      console.error(formatted);
    }
  } else {
    const method = level === 'info' ? 'log' : level;
    console[method](formatted);
  }
};

export const logger = {
  info: (message: string, ...args: unknown[]) => write('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => write('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => write('error', message, ...args),
};
