// 域类型：从 generated.ts 重新导出，保持与后端 schema 一致
export type {
  Agent,
  AgentTeam,
  WorkComputer,
  Workspace,
  User,
  AgentId,
  AgentTeamId,
  WorkComputerId,
  WorkspaceId,
  UserId,
  AgentStatus,
  AgentVisibility,
  PublicScope,
  TeamMode,
  TeamStatus,
  WorkComputerType,
  WorkComputerStatus,
  UserStatus,
} from './api/generated';

// UI-only 类型：后端无对应表/接口，仅用于前端展示

export type SkillType = 'builtin' | 'mcp' | 'custom';
export type ServiceStatus = 'online' | 'error';
export type EntityStatus =
  'online' | 'offline' | 'connecting' | 'available' | 'unavailable' | 'error';
export type PageKey = 'agents' | 'team' | 'skills' | 'settings';

export interface Skill {
  name: string;
  type: SkillType;
  desc: string;
  agents: number;
  author: string;
  installs: number;
  category: string;
  source: 'internal' | 'community';
  installed: boolean;
  featured: boolean;
}

export interface TeamMember {
  icon: string;
  color: string;
}

export interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
}

export interface BackendService {
  computerId: string;
  version: string;
  latestVersion: string;
  lastHeartbeat: string;
  agentCount: number;
  runtime: string;
  status: ServiceStatus;
}

export interface ComputerAgent {
  id: string;
  name: string;
  desc: string;
  avatar?: string | null;
  status: 'online' | 'offline' | 'connecting';
  runtime: string;
  lastActive: string;
  computerId: string;
}
