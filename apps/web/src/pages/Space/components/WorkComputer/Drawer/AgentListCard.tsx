import { memo } from 'react';
import { RightOutlined } from '@ant-design/icons';
import { Card } from '@/components/Card';
import type { ComputerAgent } from '@/types';

interface AgentListCardProps {
  agents: ComputerAgent[];
}

export const AgentListCard = memo(({ agents }: AgentListCardProps) => (
  <Card title={`Agents (${agents.length})`}>
    <div className="flex flex-col">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-transparent cursor-pointer hover:bg-[#fafafa] rounded transition-colors"
        >
          <div className="w-9 h-9 rounded-md bg-[#f0f0f0] flex items-center justify-center text-lg shrink-0">
            {agent.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{agent.name}</div>
            <div className="text-xs text-faint truncate">{agent.desc}</div>
          </div>
          <RightOutlined className="text-xs text-faint" />
        </div>
      ))}
    </div>
  </Card>
));
