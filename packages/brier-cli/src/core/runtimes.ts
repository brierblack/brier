import { execSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface RuntimeEntry {
  name: string;
  command: string;
  /** 命令不在 PATH 时的兜底可执行文件（~ 开头表示用户主目录），存在即视为已安装 */
  fallbacks?: readonly string[];
}

export const RUNTIME_REGISTRY: readonly RuntimeEntry[] = [
  { name: 'Claude Code', command: 'claude', fallbacks: ['~/.claude/bin/claude'] },
  { name: 'Codex CLI', command: 'codex' },
  { name: 'OpenAI CLI', command: 'openai' },
  { name: 'Gemini CLI', command: 'gemini' },
  { name: 'Cursor CLI', command: 'cursor' },
  {
    name: 'OpenCode',
    command: 'opencode',
    fallbacks: ['~/.opencode/bin/opencode', '~/.local/bin/opencode'],
  },
  { name: 'Aider', command: 'aider', fallbacks: ['~/.local/bin/aider'] },
  { name: 'Goose', command: 'goose', fallbacks: ['~/.local/bin/goose'] },
  { name: 'Cody', command: 'cody', fallbacks: ['~/.local/bin/cody'] },
] as const;

export const RUNTIME_COMMANDS: Record<string, string> = Object.fromEntries(
  RUNTIME_REGISTRY.map((r) => [r.name, r.command]),
);

/**
 * AI runtime 单次（非交互）执行参数模板：命令前缀 flags，后面紧跟 prompt。
 * 服务端 task-start 携带 prompt 时，CLI 用它拼出
 * `spawn(<command>, [...flags, prompt])`；未列出的 runtime 按裸参数执行。
 */
export const RUNTIME_PROMPT_FLAGS: Record<string, readonly string[]> = {
  OpenCode: ['run'],
  'Claude Code': ['-p'],
  'Codex CLI': ['exec'],
  'Gemini CLI': ['-p'],
  Aider: ['--message'],
  Goose: ['run'],
};

// macOS 自带磁盘分区工具 gpt(8) 位于 /usr/sbin/gpt，命中系统目录视为未安装。
const SYSTEM_SBIN_RE = /^\/(usr\/)?sbin\//;

const isExecutable = (file: string): boolean => {
  try {
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const expandHome = (p: string): string => (p.startsWith('~/') ? join(homedir(), p.slice(2)) : p);

/**
 * 解析 runtime 的可执行文件**绝对路径**：
 * 1. PATH 中查找（排除系统目录误报，如 /usr/sbin/gpt）
 * 2. 未命中则检查官方安装目录（如 opencode → ~/.opencode/bin/opencode）
 *
 * 探测（runtimes 上报）与执行（spawn 任务）都走这里，保证"探测到"的
 * runtime 一定可被执行，不依赖 daemon 进程的 PATH。
 */
export const resolveRuntimeExecutable = (runtime: string): string | null => {
  const entry = RUNTIME_REGISTRY.find((r) => r.name === runtime);
  if (!entry) return null;

  try {
    const hit = execSync(`command -v ${entry.command}`, { stdio: 'pipe' }).toString().trim();
    if (hit.includes('/') && !SYSTEM_SBIN_RE.test(hit)) return hit;
  } catch {
    // 不在 PATH
  }

  const candidates = entry.fallbacks ?? [`~/.local/bin/${entry.command}`];
  return candidates.map(expandHome).find(isExecutable) ?? null;
};

/**
 * 探测本机已安装的 AI runtime 名称列表。
 * 过滤注册表：只保留 resolveRuntimeExecutable 能解析出可执行文件的项
 * （探测与执行共用同一解析，保证“探测到”的 runtime 一定能被 spawn）。
 */
export const detectInstalledRuntimes = (): string[] =>
  RUNTIME_REGISTRY.filter((r) => resolveRuntimeExecutable(r.name) !== null).map((r) => r.name);
