export type AgentStatus = 'online' | 'busy' | 'idle' | 'error';
export type WorkspaceStatus = 'online' | 'offline';
export type TeamStatus = 'active' | 'paused';
export type WorkspaceType = 'local' | 'ssh' | 'cloud';
export type TeamMode = 'coordinator' | 'sequential' | 'graph';
export type SkillType = 'builtin' | 'mcp' | 'custom';
export type EntityStatus = AgentStatus | WorkspaceStatus | TeamStatus;
export type PageKey = 'agents' | 'team' | 'skills' | 'monitor' | 'config';

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
}

export interface Skill {
  name: string;
  type: SkillType;
  desc: string;
  agents: number;
}

export interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
}
