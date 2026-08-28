export interface RuntimeEntry {
  name: string;
  command: string;
}

export const RUNTIME_REGISTRY: readonly RuntimeEntry[] = [
  { name: 'Claude Code', command: 'claude' },
  { name: 'Codex CLI', command: 'codex' },
  { name: 'GPT-4o CLI', command: 'gpt' },
  { name: 'Gemini CLI', command: 'gemini' },
  { name: 'Cursor CLI', command: 'cursor' },
  { name: 'Node.js', command: 'node' },
  { name: 'Python', command: 'python3' },
] as const;

export const RUNTIME_COMMANDS: Record<string, string> = Object.fromEntries(
  RUNTIME_REGISTRY.map((r) => [r.name, r.command]),
);
