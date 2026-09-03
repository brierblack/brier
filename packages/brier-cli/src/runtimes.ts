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
