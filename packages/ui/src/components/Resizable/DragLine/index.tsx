import { memo, useState, type ReactNode } from 'react';
import { useDrop } from 'react-dnd';
import { clampWidth, DEFAULT_WIDTH, DRAG_TYPE, MAX_WIDTH, MIN_WIDTH } from './utils';
import { DragHandle, type DragItem } from './DragHandle';
import { DragArea } from './DragArea';

export interface DragLineProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const DragLine = memo(
  ({
    children,
    defaultWidth = DEFAULT_WIDTH,
    minWidth = MIN_WIDTH,
    maxWidth = MAX_WIDTH,
  }: DragLineProps) => {
    const [width, setWidth] = useState(defaultWidth);
    const [isDragging, setIsDragging] = useState(false);

    const [, drop] = useDrop<DragItem, void, unknown>(
      () => ({
        accept: DRAG_TYPE,
        hover: (item, monitor) => {
          const delta = monitor.getDifferenceFromInitialOffset();
          if (delta) {
            setWidth(clampWidth(item.start + delta.x, minWidth, maxWidth));
          }
        },
      }),
      [minWidth, maxWidth],
    );

    return (
      <div className="relative shrink-0" style={{ width }}>
        {children}
        <DragHandle start={width} onDraggingChange={setIsDragging} />
        <DragArea isDragging={isDragging} ref={drop as unknown as React.Ref<HTMLDivElement>} />
      </div>
    );
  },
);
