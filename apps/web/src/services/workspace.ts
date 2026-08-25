import type { Workspace } from '../types';

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  description?: string | null;
  avatar?: string | null;
  instructions?: string | null;
  repositories?: string[];
  auto_pr_review?: boolean;
  auto_issue_assign?: boolean;
}

export const fetchWorkspaces = async (): Promise<Workspace[]> => {
  const res = await fetch('/api/workspaces');
  if (!res.ok) return [];
  return res.json();
};

export const createWorkspace = async (data: CreateWorkspaceRequest): Promise<Workspace> => {
  const res = await fetch('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '创建失败' }));
    throw new Error(err.error || '创建空间失败');
  }
  return res.json();
};
