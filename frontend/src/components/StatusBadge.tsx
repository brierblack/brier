import { STATUS_MAP } from '../define';
import type { EntityStatus } from '../types';

interface StatusBadgeProps {
  status: EntityStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status];
  if (!config) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block size-[7px] rounded-full"
        style={{ background: config.color, boxShadow: `0 0 6px ${config.color}80` }}
      />
      <span className="text-xs font-medium" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
