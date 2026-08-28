import { memo } from 'react';

export interface DragAreaProps {
  isDragging: boolean;
  ref: React.Ref<HTMLDivElement>;
}

export const DragArea = memo(({ isDragging, ref }: DragAreaProps) => {
  if (!isDragging) {
    return null;
  }
  return <div ref={ref} className="fixed inset-0 z-50" style={{ cursor: 'col-resize' }} />;
});
