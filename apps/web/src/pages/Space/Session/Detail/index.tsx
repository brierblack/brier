import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Page } from '@brierb/brier-ui';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  appendMessage,
  createTask,
  getTask,
  listAgents,
  listMessages,
  listSessions,
} from '@/api/generated';
import type { Agent, SessionMessage } from '@/api/generated';
import { useApi } from '@/hooks/useApi';
import { InputBox, MessageBubble, TypingIndicator, getAgent } from '../shared';

const POLL_MS = 1500;
/** 轮询超过该次数（约 60s）仍未终态则停止跟随，提示去事项页查看。 */
const MAX_POLLS = 40;

const SessionDetailBody = ({ wsId }: { wsId: string }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { data: sessions } = useApi(() => listSessions(wsId), [wsId]);
  const session = (sessions ?? []).find((s) => s.id === id);

  const { data: agents } = useApi(() => listAgents(wsId), [wsId]);
  // 会话绑定 Agent（会话创建时选定，会话内不切换）
  const sessionAgent = useMemo(
    () => (session ? (agents ?? []).find((a) => a.id === session.agent_id) : undefined),
    [agents, session],
  );

  const { data: history } = useApi(
    () => (id ? listMessages(wsId, id) : Promise.resolve([])),
    [wsId, id],
  );
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingRef = useRef(false);
  const agentRef = useRef<Agent | undefined>(undefined);
  useEffect(() => {
    agentRef.current = sessionAgent;
  }, [sessionAgent]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 卸载时停止轮询
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const pushMessage = (m: SessionMessage) => {
    setMessages((prev) => [...prev, m]);
  };

  const appendAgentReply = async (content: string, taskId: string | null) => {
    if (!session) return;
    const text = (content || '').trim();
    try {
      const created = await appendMessage(wsId, session.id, {
        role: 'agent',
        content: text || '（无输出）',
        agent_id: session.agent_id,
        task_id: taskId,
      });
      pushMessage(created);
    } catch {
      // 落库失败不阻塞 UI
    }
  };

  /** 执行任务并回填 agent 回复（user 消息按需先落库）。 */
  const runTask = async (text: string, persistUser: boolean) => {
    const agent = agentRef.current;
    const sid = session?.id;
    if (!agent || !sid) return;

    loadingRef.current = true;
    setLoading(true);

    // 1) user 消息落库（首条由建会话时已落库，persistUser=false）
    if (persistUser) {
      try {
        const created = await appendMessage(wsId, sid, {
          role: 'user',
          content: text,
          agent_id: agent.id,
          task_id: null,
        });
        pushMessage(created);
      } catch {
        // 落库失败仍继续执行
      }
    }

    // 2) 创建任务并轮询
    let taskId: string;
    try {
      const task = await createTask(wsId, {
        agent_id: agent.id,
        title: text.slice(0, 40),
        prompt: text,
      });
      taskId = task.id;
    } catch (e) {
      await appendAgentReply(
        `任务下发失败：${e instanceof Error ? e.message : String(e)}。请确认该 Agent 已绑定在线工作电脑并配置了 runtime。`,
        null,
      );
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    let pollCount = 0;
    pollTimerRef.current = setInterval(async () => {
      pollCount += 1;
      try {
        const task = await getTask(wsId, taskId);
        if (task.status === 'completed') {
          stopPolling();
          await appendAgentReply(task.output || '（任务执行完成，无输出）', task.id);
          loadingRef.current = false;
          setLoading(false);
        } else if (task.status === 'failed') {
          stopPolling();
          await appendAgentReply(`任务失败：${task.error ?? '未知错误'}`, task.id);
          loadingRef.current = false;
          setLoading(false);
        } else if (task.status === 'cancelled') {
          stopPolling();
          await appendAgentReply('任务已取消', task.id);
          loadingRef.current = false;
          setLoading(false);
        } else if (pollCount >= MAX_POLLS) {
          stopPolling();
          await appendAgentReply(
            '任务仍在执行中，为不阻塞对话已停止跟随。可前往「Agent 事项」查看实时输出与进度。',
            task.id,
          );
          loadingRef.current = false;
          setLoading(false);
        }
      } catch {
        // 轮询瞬时失败忽略，下轮重试
      }
    }, POLL_MS);
  };

  // 来自新会话板的首条：Agent/消息已就绪后自动执行一次（不重复落库 user 消息）
  const bootRunRef = useRef(false);
  const boot = (location.state as { runAgentId?: string; runPrompt?: string } | null) ?? null;
  useEffect(() => {
    if (boot?.runPrompt && sessionAgent && !bootRunRef.current) {
      bootRunRef.current = true;
      void runTask(boot.runPrompt, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boot?.runPrompt, sessionAgent]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loadingRef.current || !sessionAgent) return;
    setInput('');
    void runTask(text, true);
  };

  if (!session || !sessionAgent) {
    return (
      <Page header={<span>会话未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该会话或加载中</p>
            <Button onClick={() => navigate('/space/session')}>返回</Button>
          </div>
        </div>
      </Page>
    );
  }

  const title =
    session.title || (messages[0]?.content ? messages[0].content.slice(0, 20) : '新会话');

  return (
    <Page
      header={
        <div className="flex items-center gap-3 py-2.5">
          <Button bordered={false} onClick={() => navigate('/space/session')}>
            <ArrowLeftOutlined className="shrink-0 cursor-pointer text-standard hover:text-brand" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate text-lg font-bold">{title}</h1>
            <p className="mt-0.5 text-xs text-muted">
              {sessionAgent ? `与 ${sessionAgent.name} 的会话` : '会话'}
            </p>
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
                agent={getAgent(msg, sessionAgent ?? (agents ?? [])[0], agents ?? [])}
                user={user}
              />
            ))}
            {loading && <TypingIndicator agent={sessionAgent ?? (agents ?? [])[0]} />}
            <div ref={endRef} />
          </div>
        </div>

        <div className="shrink-0 px-4 pt-2 pb-4">
          <div className="mx-auto max-w-2xl">
            <InputBox
              agent={sessionAgent ?? (agents ?? [])[0]}
              agents={sessionAgent ? [sessionAgent] : []}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              loading={loading}
              onAgentSelect={() => {}}
            />
            <p className="mt-1.5 text-center text-[11px]">Enter 发送 · Shift+Enter 换行</p>
          </div>
        </div>
      </div>
    </Page>
  );
};

const SessionDetailContent = () => {
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
  return <SessionDetailBody wsId={currentWsId} />;
};

const SessionDetail = () => {
  return <SessionDetailContent />;
};

export default SessionDetail;
