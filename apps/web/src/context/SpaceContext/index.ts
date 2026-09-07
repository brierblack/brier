import { createContext, useContext } from 'react';
import type { Workspace } from '@/api/generated';

export const STORAGE_KEY = 'brier.currentSpaceId';

export interface SpaceContextValue {
  /** 当前用户可访问的全部工作空间。 */
  spaces: Workspace[];
  /** 当前选中的工作空间 ID；无空间时为 undefined。 */
  currentSpaceId: string;
  /** 切换当前工作空间（持久化到 localStorage，刷新后保持）。 */
  setCurrentSpaceId: (id: string) => void;
}

export const SpaceContext = createContext<SpaceContextValue | undefined>(undefined);

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace 必须在 SpaceProvider 内部使用');
  }
  return context;
};
