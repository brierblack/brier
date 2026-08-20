import { createContext, useContext } from 'react';

interface UIContextValue {
  openDrawer: () => void;
}

export const UIContext = createContext<UIContextValue | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIContext.Provider');
  return ctx;
}
