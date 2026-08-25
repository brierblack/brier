import { memo, useEffect, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { DRAG_TYPE } from './utils';

export interface DragItem {
  start: number;
}

export interface HandleProps {
  start: number;
  onDraggingChange: (dragging: boolean) => void;
}

export const Handle = memo(({ start, onDraggingChange }: HandleProps) => {
  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>(
    () => ({
      type: DRAG_TYPE,
      item: () => ({ start }),
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [start],
  );

  useEffect(() => {
    onDraggingChange(isDragging);
  }, [isDragging, onDraggingChange]);

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const lineStyle = useMemo(() => {
    return isDragging ? { background: 'var(--color-brand)' } : undefined;
  }, [isDragging]);

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className="group absolute top-0 -right-0.75 z-10 h-full w-1.5 cursor-col-resize"
      style={{ touchAction: 'none' }}
    >
      <div
        className="h-full w-0.5 transition-colors delay-150 duration-200 bg-transparent group-hover:bg-brand"
        style={lineStyle}
      />
    </div>
  );
});
