import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
import { AgentAvatar, InputBox, MessageBubble } from './shared';
import { createOutputProjector, type OutputProjector } from './outputProjector';
import {
  buildRunContentV2,
  parseOpenCodeRunEvents,
  parseRunMessage,
  stripAnsi,
} from './transcript';
import type { RunEvent } from './transcript';

/** 任务是否已进入终态（SSE 事件驱动收尾依据）。 */
const isTerminalStatus = (s: TaskStatus): boolean =>
  s === 'completed' || s === 'failed' || s === 'cancelled';

/**
 * 会话线程：消息列表 + 输入框 + 任务下发/终态等待（SSE 为主、空窗兜底）。
 *
 * 被两处复用：
 * - /space/session/:id 会话详情页（autoRun 来自新会话板的首条跳转）
 * - Agent 详情内"新会话"tab（autoRun 来自锁定 Agent 的首条创建）
 *
 * Agent 由会话自身绑定（session.agent_id），会话内不可切换，天然锁定。
 */
/** 实时过程视图（Trae 模式）：文本段 + 操作计数摘要，不显示文件内容 */
const RunningProcess = ({ text }: { text: string }) => {
  const phases = useMemo(() => {
    const clean = stripAnsi(text);
    if (!clean.trim()) return [];
    const out: Array<{ intent: string; tools: string[] }> = [];
    let current: { intent: string; tools: string[] } | null = null;
    for (const line of clean.split('\n')) {
      const toolMatch = line.match(/^◇ 工具 (.*)$/);
      if (toolMatch) {
        if (!current) current = { intent: '', tools: [] };
        current.tools.push(toolMatch[1].split('\n')[0]);
      } else if (line.trim()) {
        if (current) out.push(current);
        current = { intent: line.trim(), tools: [] };
      }
    }
    if (current) out.push(current);
    return out;
  }, [text]);

  if (text.length === 0) {
    return <p className="m-0 p-3 text-xs text-muted">等待输出…</p>;
  }
  return (
    <div className="max-h-80 space-y-1.5 overflow-auto p-3">
      {phases.map((phase, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {phase.intent && (
            <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
              {phase.intent}
            </p>
          )}
          {phase.tools.length > 0 && (
            <span className="text-xs text-muted">执行 {phase.tools.length} 条操作</span>
          )}
        </div>
      ))}
    </div>
  );
};

export const SessionThread = ({
  wsId,
  sessionId,
  autoRun,
}: {
  wsId: string;
  sessionId: string;
  /** 会话创建后需要自动执行一次的首条（user 消息已在创建时落库，不重复落库） */
  autoRun?: { prompt: string } | null;
}) => {
  const { user } = useAuth();

  const { data: sessions } = useApi(() => listSessions(wsId), [wsId]);
  const session = (sessions ?? []).find((s) => s.id === sessionId);

  const { data: agents } = useApi(() => listAgents(wsId), [wsId]);
  const sessionAgent = useMemo(
    () => (session ? (agents ?? []).find((a) => a.id === session.agent_id) : undefined),
    [agents, session],
  );

  const { data: history } = useApi(
    () => (sessionId ? listMessages(wsId, sessionId) : Promise.resolve([])),
    [wsId, sessionId],
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
  // 正在执行任务的实时输出（仅本地预览，终态后以落库消息为准；已投影为可读文本）
  const [runningText, setRunningText] = useState('');
  /** 运行期原始输出原文累积（opencode = JSON 事件流；终态据此还原全量过程事件） */
  const runningRawRef = useRef('');
  /** 当前任务的输出投影器（按 runtime 决定解析/透传；仅用于实时可读展示） */
  const projectorRef = useRef<OutputProjector | null>(null);
  /** 当前任务的 runtime（决定终态过程事件的解析方式） */
  const runtimeRef = useRef<string | null>(null);
  /** 当前任务捕获到的 CLI 会话 ID（如 opencode sessionID） */
  const sessionIdRef = useRef<string | null>(null);

  // 任务事件订阅（会话跟随）：task_output 实时渲染预览；终态事件驱动等待结束
  useTaskEvents(!!wsId, wsId, (e) => {
    const w = waiterRef.current;
    if (!w || e.task_id !== w.taskId) return;
    if (e.type === 'task_output') {
      lastTaskEventAtRef.current = Date.now();
      // 原文全量累积（终态据此还原全量过程事件，保证离线全文）
      runningRawRef.current += e.data;
      const projector = projectorRef.current;
      if (projector) {
        const text = projector.push(e.data);
        if (text) {
          setRunningText((prev) => prev + text);
        }
        if (sessionIdRef.current === null) {
          sessionIdRef.current = projector.getSessionId();
        }
      } else {
        // 无投影器（理论不出现）：原文即展示
        setRunningText((prev) => prev + e.data);
      }
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

  /** 终态成功后落一条“运行转录”消息（content 由调用方按 v2 组装，含全量过程与全文摘要） */
  const appendRunMessage = async (content: string, taskId: string | null) => {
    if (!session) return;
    try {
      const created = await appendMessage(wsId, session.id, {
        role: 'agent',
        content,
        agent_id: session.agent_id,
        task_id: taskId,
      });
      pushMessage(created);
    } catch {
      // 落库失败不阻塞 UI（转录丢失，输出仍可从任务记录查）
    }
  };

  /** 会话线程内最近一条已完成的 agent run 转录中的 CLI 会话 ID（用于跨轮续接） */
  const lastRunSessionId = (list: SessionMessage[]): string | undefined => {
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      if (m.role !== 'agent') continue;
      const run = parseRunMessage(m.content);
      if (run?.sessionId) return run.sessionId;
    }
    return undefined;
  };

  /** 执行任务并回填 agent 回复（user 消息按需先落库）。 */
  const runTask = async (text: string, persistUser: boolean) => {
    const agent = agentRef.current;
    const sid = session?.id;
    if (!agent || !sid) return;

    loadingRef.current = true;
    setLoading(true);
    setRunningText('');
    runningRawRef.current = '';
    projectorRef.current = createOutputProjector(agent.runtime);
    runtimeRef.current = agent.runtime ?? null;
    sessionIdRef.current = null;

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

    // 2) 创建任务（会话线程内自动续接上一次 opencode 会话，实现多轮上下文）
    let taskId: string;
    try {
      const resumeSessionId = lastRunSessionId(messages);
      const task = await createTask(wsId, {
        agent_id: agent.id,
        title: text.slice(0, 40),
        prompt: text,
        ...(resumeSessionId ? { resume_session_id: resumeSessionId } : {}),
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
        // v2 转录：全量过程事件 + 全文摘要（不再按 600/40k 截断）
        const runtime = runtimeRef.current;
        const raw = runningRawRef.current;
        const events: RunEvent[] =
          runtime === 'OpenCode'
            ? parseOpenCodeRunEvents(raw)
            : raw.trim()
              ? [{ k: 'text', d: stripAnsi(raw) }]
              : [];
        const finalText = projectorRef.current?.getFinalText() ?? '';
        const summary =
          finalText.trim() ||
          events
            .filter((ev): ev is Extract<RunEvent, { k: 'text' }> => ev.k === 'text')
            .map((ev) => ev.d)
            .join('\n')
            .trim() ||
          finalTask.output?.trim() ||
          '（任务执行完成，无输出）';
        const content = buildRunContentV2({
          events,
          summary,
          answers: [],
          sessionId: sessionIdRef.current ?? undefined,
        });
        await appendRunMessage(content, finalTask.id);
      } else if (finalTask.status === 'failed') {
        await appendAgentReply(`任务失败：${finalTask.error ?? '未知错误'}`, finalTask.id);
      } else {
        await appendAgentReply('任务已取消', finalTask.id);
      }
    } finally {
      // 正式消息已落库入列，移除实时预览（与 pushMessage 同批渲染，避免内容重复闪现）
      setRunningText('');
      runningRawRef.current = '';
      projectorRef.current = null;
      runtimeRef.current = null;
      sessionIdRef.current = null;
    }
  };

  // 首条自动执行：由父级传入（新会话板跳转 / Agent 详情新建）。
  // 幂等判定：历史已存在 agent 回复（含失败回执）则跳过，保证组件重挂载（如切 tab）不重复下发。
  const bootRunRef = useRef(false);
  const historyRef = useRef<SessionMessage[]>([]);
  useEffect(() => {
    historyRef.current = history ?? [];
  }, [history]);
  useEffect(() => {
    if (bootRunRef.current || !sessionAgent || !autoRun || !history) return;
    bootRunRef.current = true;
    const hasAgentReply = historyRef.current.some((m) => m.role === 'agent');
    if (!hasAgentReply) {
      void runTask(autoRun.prompt, false);
    }
  }, [sessionAgent, autoRun, history]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loadingRef.current || !sessionAgent) return;
    setInput('');
    void runTask(text, true);
  };

  if (!session || !sessionAgent) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">会话加载中…</div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              agent={sessionAgent}
              user={user}
              wsId={wsId}
            />
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <AgentAvatar agent={sessionAgent} size={32} />
              <div className="flex max-w-[75%] flex-col gap-1">
                <div className="text-[11px] font-medium">{sessionAgent.name}</div>
                <div className="overflow-hidden rounded-2xl rounded-bl-md border border-ghost">
                  <div className="flex items-center gap-1.5 border-b border-ghost bg-[#fafafa] px-3 py-1.5 text-[11px] text-muted">
                    <span className="size-1.5 animate-pulse rounded-full bg-[#52c41a]" />
                    任务执行中…
                  </div>
                  <RunningProcess text={runningText} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="shrink-0 px-4 pt-2 pb-4">
        <div className="mx-auto max-w-3xl">
          <InputBox
            agent={sessionAgent}
            agents={[sessionAgent]}
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={loading}
            onAgentSelect={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
