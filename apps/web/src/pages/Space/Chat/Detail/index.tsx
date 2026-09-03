import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Page } from '@brierb/brier-ui';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { createTask, getTask, listAgents } from '@/api/generated';
import { useApi } from '@/hooks/useApi';
import type { Agent } from '../../../../types';
import { getConversationById, type ChatMessage } from '../../../../data/conversations';
import { InputBox, MessageBubble, TypingIndicator, getAgent, pickDefaultAgent } from '../shared';

const POLL_MS = 1500;
/** 轮询超过该次数（约 60s）仍未终态则停止，提示去事项页查看，避免界面永久 loading。 */
const MAX_POLLS = 40;

const ConversationBody = ({ wsId }: { wsId: string }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { data: agents } = useApi(() => listAgents(wsId), [wsId]);

  const firstMessage = (location.state as { firstMessage?: string } | null)?.firstMessage;
  const conversation = getConversationById(Number(id));

  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
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
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 最新值 ref：轮询回调与自动发送需要读到当前 Agent，且避免并发重入
  const selectedAgentRef = useRef<Agent | undefined>(undefined);
  const loadingRef = useRef(false);

  // 数据到达后默认选中一个可执行任务的 Agent（已绑电脑 + runtime）
  useEffect(() => {
    if (!selectedAgent && agents?.length) {
      setSelectedAgent(pickDefaultAgent(agents));
    }
  }, [agents, selectedAgent]);

  useEffect(() => {
    selectedAgentRef.current = selectedAgent;
  }, [selectedAgent]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 卸载时停止轮询
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const title = conversation?.title ?? (firstMessage ? firstMessage.slice(0, 20) : '未命名会话');

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  /** 追加一条 Agent 消息（完成/失败/取消或下发失败提示）。 */
  const pushAgentMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        role: 'agent',
        content,
        agentId: selectedAgentRef.current?.id,
      },
    ]);
  };

  /**
   * 把一段文本作为真实任务下发给当前 Agent，并轮询直到终态回填回复。
   * （用户消息的插入由调用方负责：手动发送插入后调用；首条消息已在初始化 messages 中。）
   */
  const sendPrompt = async (text: string) => {
    const trimmed = text.trim();
    const agent = selectedAgentRef.current;
    if (!trimmed || !agent || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    // 真实链路：创建 Agent 任务（B4），下发到绑定电脑执行
    let taskId: string;
    try {
      const task = await createTask(wsId, {
        agent_id: agent.id,
        title: trimmed.slice(0, 40),
        prompt: trimmed,
      });
      taskId = task.id;
    } catch (e) {
      pushAgentMessage(
        `任务下发失败：${e instanceof Error ? e.message : String(e)}。请确认该 Agent 已绑定在线工作电脑并配置了 runtime。`,
      );
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    // 轮询任务直至终态，把真实输出回填为回复
    let pollCount = 0;
    pollTimerRef.current = setInterval(async () => {
      pollCount += 1;
      try {
        const task = await getTask(wsId, taskId);
        if (task.status === 'completed') {
          stopPolling();
          pushAgentMessage(task.output || '（任务执行完成，无输出）');
          loadingRef.current = false;
          setLoading(false);
        } else if (task.status === 'failed') {
          stopPolling();
          pushAgentMessage(`任务失败：${task.error ?? '未知错误'}`);
          loadingRef.current = false;
          setLoading(false);
        } else if (task.status === 'cancelled') {
          stopPolling();
          pushAgentMessage('任务已取消');
          loadingRef.current = false;
          setLoading(false);
        } else if (pollCount >= MAX_POLLS) {
          stopPolling();
          pushAgentMessage(
            '任务仍在执行中，为不阻塞对话已停止跟随。可前往「Agent 事项」查看实时输出与进度。',
          );
          loadingRef.current = false;
          setLoading(false);
        }
      } catch {
        // 轮询瞬时失败忽略，下轮重试
      }
    }, POLL_MS);
  };

  // 来自首页的首条消息：Agent 就绪后自动下发一次真实任务
  const firstSentRef = useRef(false);
  useEffect(() => {
    if (firstMessage && selectedAgent && !firstSentRef.current) {
      firstSentRef.current = true;
      void sendPrompt(firstMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent, firstMessage]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading || !selectedAgent) return;

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    void sendPrompt(text);
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
                agent={getAgent(msg, selectedAgent, agents ?? [])}
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
              agents={agents ?? []}
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
  return <ConversationDetailContent />;
};

export default ConversationDetail;
