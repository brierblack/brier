import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Workspace } from '@/api/generated';

const STORAGE_KEY = 'brier.currentWorkspaceId';

export interface WorkspaceContextValue {
  /** 当前用户可访问的全部工作空间。 */
  workspaces: Workspace[];
  /** 当前选中的工作空间 ID；无空间时为 undefined。 */
  currentWsId: string | undefined;
  /** 切换当前工作空间（持久化到 localStorage，刷新后保持）。 */
  setCurrentWsId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider = ({
  workspaces,
  children,
}: {
  workspaces: Workspace[];
  children: ReactNode;
}) => {
  const [currentWsId, setCurrentWsIdState] = useState<string | undefined>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // 校验保存的 ID 仍属于当前用户的空间列表，避免空间被删后悬空
    return saved && workspaces.some((w) => w.id === saved) ? saved : workspaces[0]?.id;
  });

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      currentWsId,
      setCurrentWsId: (id: string) => {
        setCurrentWsIdState(id);
        localStorage.setItem(STORAGE_KEY, id);
      },
    }),
    [workspaces, currentWsId],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace 必须在 WorkspaceProvider 内部使用');
  }
  return context;
};
