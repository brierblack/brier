import { memo } from 'react';
import { RightOutlined } from '@ant-design/icons';
import { Card } from '@brierb/brier-ui';
import type { ComputerAgent } from '@/types';

interface AgentListCardProps {
  agents: ComputerAgent[];
}

export const AgentListCard = memo(({ agents }: AgentListCardProps) => (
  <Card title={`Agents (${agents.length})`}>
    {agents.length === 0 ? (
      <div className="px-4 py-6 text-center text-xs text-muted">暂无 Agent 绑定到这台电脑</div>
    ) : (
      <div className="flex flex-col">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex cursor-pointer items-center gap-3 rounded border-b border-ghost px-4 py-3 transition-colors last:border-transparent hover:bg-[#fafafa]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f0f0f0] text-lg">
              {agent.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-standard font-medium">{agent.name}</div>
              <div className="truncate text-xs">{agent.desc}</div>
            </div>
            <RightOutlined className="text-xs" />
          </div>
        ))}
      </div>
    )}
  </Card>
));
