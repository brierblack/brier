import { use, useMemo, useState, type ReactNode } from 'react';
import { SpaceContext, STORAGE_KEY, type SpaceContextValue } from '.';
import type { Workspace } from '@/api/generated';
import { Navigate } from 'react-router-dom';

export const SpaceProvider = ({
  promiseSpaces,
  children,
}: {
  promiseSpaces: Promise<Workspace[]>;
  children: ReactNode;
}) => {
  const spaces = use(promiseSpaces);

  const [currentSpaceId, setCurrentSpaceId] = useState<string | undefined>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // 校验保存的 ID 仍属于当前用户的空间列表，避免空间被删后悬空
    return saved && spaces.some((w) => w.id === saved) ? saved : spaces[0]?.id;
  });

  const value = useMemo(() => {
    return {
      spaces: spaces || [],
      currentSpaceId,
      setCurrentSpaceId,
    };
  }, [spaces, currentSpaceId, setCurrentSpaceId]);

  if (value.spaces.length === 0 || typeof value.currentSpaceId === 'undefined') {
    return <Navigate to="/space/new" replace />;
  }

  return (
    <SpaceContext.Provider value={value as SpaceContextValue}>{children}</SpaceContext.Provider>
  );
};
