import { memo, type ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export { DragLine } from './DragLine';

export const Resizable = memo(({ children }: { children: ReactNode }) => {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
});
