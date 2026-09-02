import { Suspense, useEffect, useRef, useState, use } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Page } from '@brierb/brier-ui';
import { Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { listAgents } from '@/api/generated';
import type { Agent } from '../../../../types';
import { getConversationById, type ChatMessage } from '../../../../data/conversations';
import { InputBox, MessageBubble, TypingIndicator, getAgent } from '../shared';

const ConversationBody = ({ wsId }: { wsId: string }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const agents: Agent[] = use(listAgents(wsId));

  const firstMessage = (location.state as { firstMessage?: string } | null)?.firstMessage;
  const conversation = getConversationById(Number(id));

  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(agents[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (conversation) return [...conversation.messages];
    if (firstMessage) {
      return [{ id: Date.now(), role: 'user', content: firstMessage }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const title = conversation?.title ?? (firstMessage ? firstMessage.slice(0, 20) : '未命名会话');

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'agent',
        content: `收到！我是${selectedAgent?.name ?? 'Agent'}，正在处理你的请求："${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"\n\n这是一个模拟响应，实际接入 Agent 后将返回真实结果。`,
        agentId: selectedAgent ? Number(selectedAgent.id) : undefined,
      };
      setMessages((prev) => [...prev, agentMsg]);
      setLoading(false);
    }, 1200);
  };

  if (!selectedAgent) {
    return (
      <Page header={<span>无可用 Agent</span>}>
        <div className="flex h-full items-center justify-center text-sm text-muted">
          暂无可用 Agent
        </div>
      </Page>
    );
  }

  return (
    <Page
      header={
        <div className="flex items-center gap-3 py-2.5">
          <Button
            bordered={false}
            icon={
              <ArrowLeftOutlined
                className="shrink-0 cursor-pointer text-standard hover:text-brand"
                onClick={() => navigate('/space/chat')}
              />
            }
          />
          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate text-lg font-bold">{title}</h1>
          </div>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                agent={getAgent(msg, selectedAgent, agents)}
                user={user}
              />
            ))}
            {loading && <TypingIndicator agent={selectedAgent} />}
            <div ref={endRef} />
          </div>
        </div>

        <div className="shrink-0 px-4 pt-2 pb-4">
          <div className="mx-auto max-w-2xl">
            <InputBox
              agent={selectedAgent}
              agents={agents}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              loading={loading}
              onAgentSelect={setSelectedAgent}
            />
            <p className="mt-1.5 text-center text-[11px]">Enter 发送 · Shift+Enter 换行</p>
          </div>
        </div>
      </div>
    </Page>
  );
};

const ConversationDetailContent = () => {
  const { currentWsId } = useWorkspace();
  if (!currentWsId) {
    return (
      <Page header={<span>无可用空间</span>}>
        <div className="flex h-full items-center justify-center text-sm text-muted">
          请先创建工作空间
        </div>
      </Page>
    );
  }
  return <ConversationBody wsId={currentWsId} />;
};

const ConversationDetail = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spin />
        </div>
      }
    >
      <ConversationDetailContent />
    </Suspense>
  );
};

export default ConversationDetail;
