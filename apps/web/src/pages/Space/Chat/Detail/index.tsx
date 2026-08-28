import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Page } from '@brierb/brier-ui';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../auth-context';
import { getConversationById, type ChatMessage } from '../conversations';
import { AVAILABLE_AGENTS, InputBox, MessageBubble, TypingIndicator, getAgent } from '../shared';

const ConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const firstMessage = (location.state as { firstMessage?: string } | null)?.firstMessage;
  const conversation = getConversationById(Number(id));

  const [selectedAgent, setSelectedAgent] = useState(AVAILABLE_AGENTS[0]);
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
        content: `收到！我是${selectedAgent.name}，正在处理你的请求："${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"\n\n这是一个模拟响应，实际接入 Agent 后将返回真实结果。`,
        agentId: selectedAgent.id,
      };
      setMessages((prev) => [...prev, agentMsg]);
      setLoading(false);
    }, 1200);
  };

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
                agent={getAgent(msg, selectedAgent)}
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

export default ConversationDetail;
