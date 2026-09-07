import type { PageKey } from './types';

export const STATUS_MAP = {
  online: { label: '在线', color: '!text-emerald-700 !bg-emerald-500/10' },
  connecting: { label: '连接中', color: '!text-[#1677ff] !bg-[#1677ff]/10' },
  offline: { label: '离线', color: '!text-[#90a1b9] !bg-[#90a1b9]/10' },
} as const;

export const MODE_MAP = {
  coordinator: { label: '协调者', color: '#111111' },
  sequential: { label: '顺序流转', color: '#4b5563' },
  graph: { label: '图编排', color: '#9ca3af' },
} as const;

export const SKILL_TYPE_MAP = {
  builtin: { label: '内置', color: '#111111' },
  mcp: { label: 'MCP', color: '#4b5563' },
  custom: { label: '自定义', color: '#9ca3af' },
} as const;

export const WS_TYPE_MAP = {
  local: { label: '本地', color: '#111111' },
  ssh: { label: 'SSH', color: '#4b5563' },
  cloud: { label: '云主机', color: '#9ca3af' },
} as const;

export const PAGE_TITLES: Record<PageKey, { title: string; subtitle: string }> = {
  agents: { title: 'Agents', subtitle: '管理所有 AI Agent，配置模型、技能与工具' },
  team: { title: 'Agent 团队', subtitle: '编排多 Agent 协作，实现复杂工作流' },
  skills: { title: 'Skills', subtitle: '内置工具、MCP 服务与自定义技能' },
  settings: { title: '设置', subtitle: '空间基础信息、Agent 个性化与已安装技能' },
};

export const MODELS = ['GPT-4o', 'GPT-4o mini', 'Claude 3.5 Sonnet', 'DeepSeek V3', 'Qwen Max'];
/**
 * 支持的 AI Runtime 注册表（与 brier-cli `RUNTIME_REGISTRY` 保持一致）。
 * 新建 Agent 时若电脑未上报 runtimes，用它作为兜底选项。
 */
export const AI_RUNTIMES = [
  'OpenCode',
  'Claude Code',
  'Codex CLI',
  'OpenAI CLI',
  'Gemini CLI',
  'Cursor CLI',
  'Aider',
  'Goose',
  'Cody',
] as const;
export const AGENT_ICONS = ['📊', '🔍', '💬', '📄', '🛡️', '⚙️', '🌐', '🧪'];
export const TEAMS_LIST = ['工程效能', '数据洞察', '客户成功', '安全合规'];
export const CREATE_STEPS = ['基本信息', '模型配置', '技能加载', '工具配置', '确认创建'];
