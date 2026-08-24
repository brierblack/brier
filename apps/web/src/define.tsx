import {
  RobotOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import type { PageKey } from './types';

export const STATUS_MAP = {
  online: { label: '在线', color: '#389e0d' },
  connecting: { label: '连接中', color: '#1677ff' },
  offline: { label: '离线', color: '#90a1b9' },
  error: { label: '异常', color: '#fb2c36' },
  available: { label: '可用', color: '#389e0d' },
  unavailable: { label: '不可用', color: '#90a1b9' },
} as const;

export const MODE_MAP = {
  coordinator: { label: '协调者', color: '#fe6e00' },
  sequential: { label: '顺序流转', color: '#8d54ff' },
  graph: { label: '图编排', color: '#f99c00' },
} as const;

export const SKILL_TYPE_MAP = {
  builtin: { label: '内置', color: '#fe6e00' },
  mcp: { label: 'MCP', color: '#00c758' },
  custom: { label: '自定义', color: '#f99c00' },
} as const;

export const WS_TYPE_MAP = {
  local: { label: '本地', color: '#fe6e00' },
  ssh: { label: 'SSH', color: '#8d54ff' },
  cloud: { label: '云主机', color: '#f99c00' },
} as const;

export const PAGE_TITLES: Record<PageKey, { title: string; subtitle: string }> = {
  agents: { title: 'Agents', subtitle: '管理所有 AI Agent，配置模型、技能与工具' },
  team: { title: 'Agent 团队', subtitle: '编排多 Agent 协作，实现复杂工作流' },
  skills: { title: 'Skills', subtitle: '内置工具、MCP 服务与自定义技能' },
  settings: { title: '设置', subtitle: '空间基础信息、Agent 个性化与已安装技能' },
};

export const NAV_ITEMS: { key: PageKey; label: string; icon: React.ReactNode; section: string }[] =
  [
    { key: 'agents', label: 'Agents', icon: <RobotOutlined />, section: '导航' },
    { key: 'team', label: 'Agent 团队', icon: <TeamOutlined />, section: '导航' },
    { key: 'skills', label: 'Skills', icon: <ThunderboltOutlined />, section: '导航' },
    { key: 'settings', label: '设置', icon: <SettingOutlined />, section: '导航' },
  ];

export const MODELS = ['GPT-4o', 'GPT-4o mini', 'Claude 3.5 Sonnet', 'DeepSeek V3', 'Qwen Max'];
export const AGENT_ICONS = ['📊', '🔍', '💬', '📄', '🛡️', '⚙️', '🌐', '🧪'];
export const TEAMS_LIST = ['工程效能', '数据洞察', '客户成功', '安全合规'];
export const CREATE_STEPS = ['基本信息', '模型配置', '技能加载', '工具配置', '确认创建'];
