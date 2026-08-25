import { mkdirSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';

type LogLevel = 'info' | 'warn' | 'error';

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

const write = (level: LogLevel, message: string, ...args: unknown[]) => {
  const formatted = formatMessage(level, message, ...args);
  if (logFile) {
    try {
      mkdirSync(dirname(logFile), { recursive: true });
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
