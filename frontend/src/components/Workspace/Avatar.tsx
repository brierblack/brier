import type { Workspace } from "@/types";
import { memo } from "react";

const workspaceColors: Record<string, string> = {
  local: 'linear-gradient(135deg, #fe6e00, #f05100)',
  ssh: 'linear-gradient(135deg, #8d54ff, #7008e7)',
  cloud: 'linear-gradient(135deg, #00c758, #009a44)',
};

export const Avatar = memo(({ workspace }: { workspace: Workspace }) => {
  const initial = workspace.name.slice(0, 1).toUpperCase();
  const bg = workspaceColors[workspace.type] ?? workspaceColors.local;

  return (
    <div
      className="size-5 rounded-sm shrink-0 flex items-center justify-center text-white text-[12px] font-bold"
      style={{ background: bg }}
    >
      {initial}
    </div>
  );
});
