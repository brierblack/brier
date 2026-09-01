import type { Workspace } from '@/types';
import { memo } from 'react';

const COLORS = [
  'linear-gradient(135deg, #0a0a0a, #262626)',
  'linear-gradient(135deg, #262626, #404040)',
  'linear-gradient(135deg, #404040, #595959)',
  'linear-gradient(135deg, #1f2937, #111827)',
  'linear-gradient(135deg, #3f3f46, #27272a)',
];

export const Avatar = memo(({ workspace }: { workspace: Workspace }) => {
  if (workspace.avatar) {
    return (
      <img
        src={workspace.avatar}
        alt={workspace.name}
        className="size-5 shrink-0 rounded-sm object-cover"
      />
    );
  }

  const initial = workspace.name.slice(0, 1).toUpperCase();
  const colorIdx = workspace.name.charCodeAt(0) % COLORS.length;
  const bg = COLORS[colorIdx];

  return (
    <div
      className="flex size-5 shrink-0 items-center justify-center rounded-sm text-[12px] font-bold text-white"
      style={{ background: bg }}
    >
      {initial}
    </div>
  );
});
