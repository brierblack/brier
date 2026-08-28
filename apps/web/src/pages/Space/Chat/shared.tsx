import { Avatar, Input } from 'antd';
import { Button, Dropdown } from '@brierb/brier-ui';
import { ArrowUpOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { agents } from '../../../data/mockData';
import { useAuth } from '../../../auth-context';
import type { Agent } from '../../../types';
import type { ChatMessage } from './conversations';

export const AVAILABLE_AGENTS = agents.filter((a) => a.status !== 'offline');

export const AgentAvatar = ({ agent, size = 32 }: { agent: Agent; size?: number }) => {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md"
      style={{
        width: size,
        height: size,
        backgroundColor: agent.color + '1a',
        fontSize: size * 0.5,
      }}
    >
      {agent.icon}
    </div>
  );
};

export const MessageBubble = ({
  message,
  agent,
  user,
}: {
  message: ChatMessage;
  agent: Agent;
  user: ReturnType<typeof useAuth>['user'];
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-white">
          <p className="leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
        </div>
        {user?.avatar_url ? (
          <Avatar
            size={32}
            src={user.avatar_url}
            className="shrink-0"
            style={{ borderRadius: 8 }}
          />
        ) : (
          <Avatar
            size={32}
            className="shrink-0"
            style={{
              borderRadius: 8,
              background: 'linear-gradient(135deg, #8d54ff, #7008e7)',
            }}
          >
            {user?.username?.slice(0, 2).toUpperCase() ?? 'U'}
          </Avatar>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <AgentAvatar agent={agent} size={32} />
      <div className="flex max-w-[75%] flex-col gap-1">
        <div className="text-[11px] font-medium">{agent.name}</div>
        <div className="rounded-2xl rounded-bl-md border border-ghost px-4 py-2.5">
          <p className="leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator = ({ agent }: { agent: Agent }) => {
  return (
    <div className="flex items-start gap-3">
      <AgentAvatar agent={agent} size={32} />
      <div className="flex flex-col gap-1">
        <div className="text-[11px] font-medium">{agent.name}</div>
        <div className="rounded-2xl rounded-bl-md border border-ghost px-4 py-3">
          <div className="flex items-center gap-1">
            <span
              className="size-1.5 animate-bounce rounded-full"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="size-1.5 animate-bounce rounded-full"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="size-1.5 animate-bounce rounded-full"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgentSelector = ({
  agent,
  onSelect,
}: {
  agent: Agent;
  onSelect: (a: Agent) => void;
}) => {
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: AVAILABLE_AGENTS.map((a) => ({
          key: String(a.id),
          label: (
            <div className="flex items-center gap-2.5">
              <AgentAvatar agent={a} size={20} />
              <span className="text-standard font-medium">{a.name}</span>
              {a.id === agent.id && <CheckOutlined className="ml-auto text-xs text-brand" />}
            </div>
          ),
        })),
        onClick: ({ key }) => {
          const next = AVAILABLE_AGENTS.find((a) => String(a.id) === key);
          if (next) onSelect(next);
        },
      }}
    >
      <div className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 transition-colors">
        <AgentAvatar agent={agent} size={20} />
        <span className="text-xs font-medium">{agent.name}</span>
        <DownOutlined className="text-[9px]" />
      </div>
    </Dropdown>
  );
};

export const InputBox = ({
  agent,
  value,
  onChange,
  onSend,
  loading,
  onAgentSelect,
}: {
  agent: Agent;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  onAgentSelect: (a: Agent) => void;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-ghost bg-white shadow-sm transition-colors focus-within:border-brand">
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="给 Agent 发送消息…"
        autoSize={{ minRows: 1, maxRows: 6 }}
        variant="borderless"
        className="!px-4 !py-3 !text-standard"
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <AgentSelector agent={agent} onSelect={onAgentSelect} />
        <Button
          type="primary"
          shape="circle"
          size="small"
          icon={<ArrowUpOutlined />}
          onClick={onSend}
          disabled={!value.trim() || loading}
          className="shrink-0"
        />
      </div>
    </div>
  );
};

export const getAgent = (message: ChatMessage, fallback: Agent): Agent => {
  if (message.agentId) {
    return agents.find((a) => a.id === message.agentId) ?? fallback;
  }
  return fallback;
};
