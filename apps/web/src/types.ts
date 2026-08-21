export type AgentStatus = 'online' | 'offline' | 'connecting';
export type WorkspaceStatus = 'online' | 'offline';
export type TeamStatus = 'available' | 'unavailable';
export type ServiceStatus = 'online' | 'error';
export type WorkspaceType = 'local' | 'ssh' | 'cloud';
export type TeamMode = 'coordinator' | 'sequential' | 'graph';
export type SkillType = 'builtin' | 'mcp' | 'custom';
export type EntityStatus = AgentStatus | WorkspaceStatus | TeamStatus | ServiceStatus;
export type PageKey = 'agents' | 'team' | 'skills' | 'config';

export type AgentVisibility = 'private' | 'public';
export type PublicScope = 'all' | 'joined_spaces' | 'specified_spaces';

export interface Agent {
  id: number;
  name: string;
  model: string;
  status: AgentStatus;
  skills: number;
  tools: number;
  team: string | null;
  desc: string;
  workspace: string;
  icon: string;
  color: string;
  runs: number;
  visibility: AgentVisibility;
  publicScope?: PublicScope;
  workComputer: string;
  runtime: string;
  lastActive: string;
}

export interface Workspace {
  id: number;
  name: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
  agents: number;
  cpu: number;
  mem: number;
  host: string;
  os: string;
}

export interface TeamMember {
  icon: string;
  color: string;
}

export interface Team {
  id: number;
  name: string;
  mode: TeamMode;
  agents: number;
  status: TeamStatus;
  desc: string;
  runs: number;
  members: TeamMember[];
  workComputer: string;
  runtime: string;
  creator: string;
  lastActive: string;
}

export interface Skill {
  name: string;
  type: SkillType;
  desc: string;
  agents: number;
}

export interface UserInfo {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
}

export interface WorkComputer {
  id: number;
  name: string;
  hostname: string;
  status: WorkspaceStatus;
  os: string;
  lastHeartbeat: string;
  agentCount: number;
  runtime: string;
}

export interface BackendService {
  computerId: number;
  version: string;
  latestVersion: string;
  lastHeartbeat: string;
  agentCount: number;
  runtime: string;
  status: ServiceStatus;
}

export interface ComputerAgent {
  id: number;
  name: string;
  status: AgentStatus;
  runtime: string;
  lastActive: string;
  computerId: number;
}
