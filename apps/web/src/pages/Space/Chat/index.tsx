import { useState, useRef, useEffect } from 'react';
import { Avatar, Button, Dropdown, Input } from 'antd';
import { ArrowUpOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { agents } from '../../../data/mockData';
import { useAuth } from '../../../auth-context';
import { Logo } from '../../../components/Logo';
import type { Agent } from '../../../types';

interface ChatMessage {
  id: number;
  role: 'user' | 'agent';
  content: string;
  agentId?: number;
}

const SUGGESTIONS = [
  { icon: '📊', text: '帮我分析数据并生成可视化报告' },
  { icon: '🔍', text: '审查我的代码并提出改进建议' },
  { icon: '🧪', text: '为当前项目编写自动化测试用例' },
  { icon: '📄', text: '根据需求文档生成技术方案' },
];

const AVAILABLE_AGENTS = agents.filter((a) => a.status !== 'offline');

const AgentAvatar = ({ agent, size = 32 }: { agent: Agent; size?: number }) => {
  return (
    <div
      className="flex items-center justify-center rounded-md shrink-0"
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

const MessageBubble = ({
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
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-brand text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-[75%]">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
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
            {user?.login?.slice(0, 2).toUpperCase() ?? 'U'}
          </Avatar>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <AgentAvatar agent={agent} size={32} />
      <div className="flex flex-col gap-1 max-w-[75%]">
        <div className="text-[11px] font-medium text-faint">{agent.name}</div>
        <div className="bg-surface text-ink px-4 py-2.5 rounded-2xl rounded-bl-md border border-line">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = ({ agent }: { agent: Agent }) => {
  return (
    <div className="flex items-start gap-3">
      <AgentAvatar agent={agent} size={32} />
      <div className="flex flex-col gap-1">
        <div className="text-[11px] font-medium text-faint">{agent.name}</div>
        <div className="bg-surface border border-line px-4 py-3 rounded-2xl rounded-bl-md">
          <div className="flex items-center gap-1">
            <span
              className="size-1.5 rounded-full bg-faint animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="size-1.5 rounded-full bg-faint animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="size-1.5 rounded-full bg-faint animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentSelector = ({ agent, onSelect }: { agent: Agent; onSelect: (a: Agent) => void }) => {
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: AVAILABLE_AGENTS.map((a) => ({
          key: String(a.id),
          label: (
            <div className="flex items-center gap-2.5">
              <AgentAvatar agent={a} size={20} />
              <span className="text-sm font-medium text-ink">{a.name}</span>
              {a.id === agent.id && <CheckOutlined className="text-xs text-brand ml-auto" />}
            </div>
          ),
        })),
        onClick: ({ key }) => {
          const next = AVAILABLE_AGENTS.find((a) => String(a.id) === key);
          if (next) onSelect(next);
        },
      }}
    >
      <div className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-surface transition-colors">
        <AgentAvatar agent={agent} size={20} />
        <span className="text-xs font-medium text-ink">{agent.name}</span>
        <DownOutlined className="text-[9px] text-faint" />
      </div>
    </Dropdown>
  );
};

const InputBox = ({
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
    <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-sm transition-colors focus-within:border-brand">
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="给 Agent 发送消息…"
        autoSize={{ minRows: 1, maxRows: 6 }}
        variant="borderless"
        className="!px-4 !py-3 !text-sm"
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

const Chat = () => {
  const { user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AVAILABLE_AGENTS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'agent',
        content: `收到！我是${selectedAgent.name}，正在处理你的请求："${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"\n\n这是一个模拟响应，实际接入 Agent 后将返回真实结果。`,
        agentId: selectedAgent.id,
      };
      setMessages((prev) => [...prev, agentMsg]);
      setLoading(false);
    }, 1200);
  };

  // Empty state — centered input
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <Logo className="w-14 h-10" />
          <h1 className="text-xl font-bold text-ink">有什么可以帮你？</h1>
          <div className="w-full max-w-2xl">
            <InputBox
              agent={selectedAgent}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              loading={loading}
              onAgentSelect={setSelectedAgent}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 w-full max-w-2xl">
            {SUGGESTIONS.map((s, i) => (
              <div
                key={i}
                onClick={() => setInput(s.text)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-line bg-white hover:border-brand hover:bg-[#fff5ed] cursor-pointer transition-all"
              >
                <span className="text-base shrink-0">{s.icon}</span>
                <span className="text-sm text-muted">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active conversation — messages + bottom input
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-5">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              agent={
                msg.agentId
                  ? (agents.find((a) => a.id === msg.agentId) ?? selectedAgent)
                  : selectedAgent
              }
              user={user}
            />
          ))}
          {loading && <TypingIndicator agent={selectedAgent} />}
          <div ref={endRef} />
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-2xl mx-auto">
          <InputBox
            agent={selectedAgent}
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={loading}
            onAgentSelect={setSelectedAgent}
          />
          <p className="text-[11px] text-faint mt-1.5 text-center">Enter 发送 · Shift+Enter 换行</p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
