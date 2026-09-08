import { memo } from 'react';

export const PropertyRow = memo(
  ({ label, children }: { label: string; children: React.ReactNode }) => {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="shrink-0 text-standard">{label}</span>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    );
  },
);
