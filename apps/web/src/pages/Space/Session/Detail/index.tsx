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
import type { Agent, AgentTask, SessionMessage, TaskStatus } from '@/api/generated';
import { useApi } from '@/hooks/useApi';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import { InputBox, MessageBubble, getAgent, AgentAvatar } from '../shared';

/** 任务是否已进入终态（SSE 事件驱动收尾依据）。 */
const isTerminalStatus = (s: TaskStatus): boolean =>
  s === 'completed' || s === 'failed' || s === 'cancelled';

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
  const loadingRef = useRef(false);
  const agentRef = useRef<Agent | undefined>(undefined);
  useEffect(() => {
    agentRef.current = sessionAgent;
  }, [sessionAgent]);

  // 终态等待器：runTask 创建任务后挂起，SSE 事件 / 空窗兜底驱动 resolve
  const waiterRef = useRef<{
    taskId: string;
    resolve: (task: AgentTask) => void;
  } | null>(null);
  // 最近一次收到"本会话关注任务"事件的时间，空窗才触发兜底检查
  const lastTaskEventAtRef = useRef(0);
  // 正在执行任务的实时输出（仅本地预览，终态后以落库消息为准）
  const [runningText, setRunningText] = useState('');

  // 任务事件订阅（会话跟随）：task_output 实时渲染预览；终态事件驱动等待结束
  useTaskEvents(!!wsId, wsId, (e) => {
    const w = waiterRef.current;
    if (!w || e.task_id !== w.taskId) return;
    if (e.type === 'task_output') {
      lastTaskEventAtRef.current = Date.now();
      setRunningText((prev) => prev + e.data);
      return;
    }
    if (e.type === 'task_updated' && isTerminalStatus(e.status)) {
      void getTask(wsId, e.task_id)
        .then((task) => w.resolve(task))
        .catch(() => {
          // 终态事件已到但拉取失败：清空时间戳，让兜底周期立即重试
          lastTaskEventAtRef.current = 0;
        });
    }
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, runningText]);

  // 卸载时释放等待器（避免卸载后 resolve 触发 setState）
  useEffect(() => {
    return () => {
      waiterRef.current = null;
    };
  }, []);

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
    setRunningText('');

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

    // 2) 创建任务
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

    // 3) 等待任务终态：SSE 事件驱动为主（见组件级 useTaskEvents），
    //    注册后立即快检一次覆盖竞态；仅在事件静默超时（SSE 断线）时低频兜底。
    const finalTask = await new Promise<AgentTask>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setInterval> | undefined = undefined;
      const settle = (task: AgentTask) => {
        if (settled) return;
        settled = true;
        if (timer) clearInterval(timer);
        waiterRef.current = null;
        resolve(task);
      };
      waiterRef.current = { taskId, resolve: settle };

      const check = async () => {
        try {
          const task = await getTask(wsId, taskId);
          if (isTerminalStatus(task.status)) settle(task);
          // 未终态：保持等待，由 SSE 终态事件驱动收尾
        } catch {
          // 瞬时失败忽略，下次兜底重试
        }
      };

      // 立即检查一次：覆盖"注册前任务已完成"的竞态
      void check();
      // 静默兜底：>10s 无该任务事件才主动检查（正常输出/事件流下不触发）
      timer = setInterval(() => {
        if (Date.now() - lastTaskEventAtRef.current > 10_000) {
          void check();
        }
      }, 5_000);
    });

    loadingRef.current = false;
    setLoading(false);
    try {
      if (finalTask.status === 'completed') {
        await appendAgentReply(finalTask.output || '（任务执行完成，无输出）', finalTask.id);
      } else if (finalTask.status === 'failed') {
        await appendAgentReply(`任务失败：${finalTask.error ?? '未知错误'}`, finalTask.id);
      } else {
        await appendAgentReply('任务已取消', finalTask.id);
      }
    } finally {
      // 正式消息已落库入列，移除实时预览（与 pushMessage 同批渲染，避免内容重复闪现）
      setRunningText('');
    }
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
            {loading && (
              <div className="flex items-start gap-3">
                <AgentAvatar agent={sessionAgent ?? (agents ?? [])[0]} size={32} />
                <div className="flex max-w-[75%] flex-col gap-1">
                  <div className="text-[11px] font-medium">
                    {sessionAgent?.name ?? (agents ?? [])[0]?.name}
                  </div>
                  <div className="overflow-hidden rounded-2xl rounded-bl-md border border-ghost">
                    <div className="flex items-center gap-1.5 border-b border-ghost bg-[#fafafa] px-3 py-1.5 text-[11px] text-muted">
                      <span className="size-1.5 animate-pulse rounded-full bg-[#52c41a]" />
                      任务执行中…
                    </div>
                    <pre className="m-0 max-h-72 overflow-auto p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
                      {runningText || '等待输出…'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
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
