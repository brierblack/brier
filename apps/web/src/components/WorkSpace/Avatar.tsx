import type { Workspace } from '@/types';
import { memo } from 'react';

const COLORS = [
  'linear-gradient(135deg, #fe6e00, #f05100)',
  'linear-gradient(135deg, #8d54ff, #7008e7)',
  'linear-gradient(135deg, #00c758, #009a44)',
  'linear-gradient(135deg, #1677ff, #0050b3)',
  'linear-gradient(135deg, #f99c00, #d97706)',
];

export const Avatar = memo(({ workspace }: { workspace: Workspace }) => {
  if (workspace.avatar) {
    return (
      <img
        src={workspace.avatar}
        alt={workspace.name}
        className="size-5 rounded-sm shrink-0 object-cover"
      />
    );
  }

  const initial = workspace.name.slice(0, 1).toUpperCase();
  const colorIdx = workspace.name.charCodeAt(0) % COLORS.length;
  const bg = COLORS[colorIdx];

  return (
    <div
      className="size-5 rounded-sm shrink-0 flex items-center justify-center text-white text-[12px] font-bold"
      style={{ background: bg }}
    >
      {initial}
    </div>
  );
});
