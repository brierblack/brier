import { useState, useMemo } from 'react';
import { Avatar, Input } from 'antd';
import { Button, Dropdown } from '@brierb/brier-ui';
import { ArrowUpOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { getTask } from '@/api/generated';
import type { SessionMessage } from '@/api/generated';
import type { Agent } from '../../../types';
import { parseRunMessage, type RunTranscript, type RunEvent } from './transcript';

/** 从任务原始输出（opencode JSON 事件流）解析出的工具调用完整结果 */
interface ParsedToolOutput {
  tool: string;
  command: string;
  output: string;
}

/** 解析工具输出原始事件：type=tool_use 且 state.status=completed */
const parseToolOutputs = (raw: string): ParsedToolOutput[] => {
  const tools: ParsedToolOutput[] = [];
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('{')) continue;
    let evt: unknown;
    try {
      evt = JSON.parse(line);
    } catch {
      continue;
    }
    if (evt === null || typeof evt !== 'object') continue;
    const obj = evt as {
      type?: unknown;
      part?: {
        type?: unknown;
        tool?: unknown;
        state?: { status?: string; input?: unknown; output?: unknown };
      };
    };
    if (obj.type !== 'tool_use' || obj.part === undefined) continue;
    const { part } = obj;
    const state = part.state;
    if (state === undefined || state.status !== 'completed') continue;
    const input =
      state.input !== null && typeof state.input === 'object'
        ? (state.input as Record<string, unknown>)
        : undefined;
    const command =
      typeof input?.command === 'string' ? input.command : JSON.stringify(state.input ?? {});
    const output = typeof state.output === 'string' ? state.output : '';
    tools.push({ tool: typeof part.tool === 'string' ? part.tool : 'unknown', command, output });
  }
  return tools;
};

/** run 消息展开区：查看每个工具调用的完整输出（从任务原始记录解析） */
const FullToolOutputs = ({ wsId, taskId }: { wsId?: string; taskId?: string | null }) => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{
    loading: boolean;
    items?: ParsedToolOutput[];
    error?: string;
  }>({
    loading: false,
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next || state.items || state.loading) return;
    if (!wsId || !taskId) {
      setState({ loading: false, error: '缺少任务信息，无法获取完整输出' });
      return;
    }
    setState({ loading: true });
    void getTask(wsId, taskId)
      .then((task) => setState({ loading: false, items: parseToolOutputs(task.output ?? '') }))
      .catch((err: unknown) =>
        setState({ loading: false, error: err instanceof Error ? err.message : String(err) }),
      );
  };

  return (
    <div className="mt-2 border-t border-ghost pt-2">
      <button
        type="button"
        onClick={toggle}
        className="cursor-pointer border-none bg-transparent p-0 text-xs text-muted hover:text-brand"
      >
        {open ? '收起完整输出' : '查看完整工具输出'}
      </button>
      {open && (
        <div className="mt-2">
          {state.loading && <div className="text-xs text-muted">加载中…</div>}
          {state.error && <div className="text-xs text-[#cf3f3f]">加载失败：{state.error}</div>}
          {!state.loading && !state.error && state.items && state.items.length === 0 && (
            <div className="text-xs text-muted">（该轮无工具调用输出）</div>
          )}
          {!state.loading &&
            !state.error &&
            state.items?.map((item, i) => (
              <div key={i} className="mb-2 rounded-lg border border-ghost bg-white/60">
                <div className="border-b border-ghost px-2.5 py-1.5 text-xs font-medium break-all">
                  ◇ 工具 {item.tool} · {item.command}
                </div>
                <pre className="m-0 max-h-80 overflow-auto px-2.5 py-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
                  {item.output || '（无输出）'}
                </pre>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export const AgentAvatar = ({ agent, size = 32 }: { agent: Agent; size?: number }) => {
  const color = agent.color ?? '#666666';
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md"
      style={{
        width: size,
        height: size,
        backgroundColor: color + '1a',
        fontSize: size * 0.5,
      }}
    >
      {agent.icon ?? agent.name.charAt(0).toUpperCase()}
    </div>
  );
};

/** 判断某工具调用是否属于“读取类”（文件/查看/搜索/输出查看），用于自动折叠 */
const FILE_READ_TOOLS = new Set([
  'read',
  'read_file',
  'view',
  'cat',
  'show',
  'show_file',
  'open',
  'open_file',
  'grep',
  'find',
  'search',
  'head',
  'tail',
  'less',
  'more',
  'sed',
  'awk',
  'wc',
]);
const FILE_READ_CMD_RE = /(^|\s)(cat|head|tail|less|more|sed\s+-n|awk|grep|find|wc)(\s|$)/;

const isFileRead = (name: string, cmd: string): boolean =>
  FILE_READ_TOOLS.has(name) || FILE_READ_CMD_RE.test(cmd);

/** 思考阶段：一段意图文本 + 后续连续的工具操作 */
interface ThinkingPhase {
  intent: string;
  plan: boolean;
  tools: { name: string; cmd: string }[];
}

/** 把有序事件流按"text → 紧跟的 tools"分组为思考阶段 */
const groupPhases = (events: RunEvent[]): ThinkingPhase[] => {
  const phases: ThinkingPhase[] = [];
  let current: ThinkingPhase | null = null;
  let sawTool = false;
  for (const ev of events) {
    if (ev.k === 'text') {
      if (current) phases.push(current);
      current = { intent: ev.d, plan: !sawTool, tools: [] };
    } else {
      if (!current) current = { intent: '', plan: false, tools: [] };
      current.tools.push({ name: ev.name, cmd: ev.cmd });
      sawTool = true;
    }
  }
  if (current) phases.push(current);
  return phases;
};

/** 从命令中提取文件名（用于"已阅读 X.md"展示） */
const extractFileName = (cmd: string): string => {
  const m = cmd.match(/(\S+\.\w+)\b/);
  return m ? m[1] : cmd.replace(/\s+/g, ' ').trim().slice(0, 60);
};

/** 操作摘要行：按操作类型聚合计数（Trae 模式） */
const OperationBlock = ({ tools }: { tools: { name: string; cmd: string }[] }) => {
  const reads = tools.filter((t) => isFileRead(t.name, t.cmd));
  const execs = tools.filter((t) => !isFileRead(t.name, t.cmd));
  const parts: string[] = [];
  if (reads.length > 0) parts.push(`已读取 ${reads.length} 个文件`);
  if (execs.length > 0) parts.push(`执行 ${execs.length} 条命令`);

  return (
    <details className="group">
      <summary className="cursor-pointer py-0.5 text-xs text-muted select-none hover:text-brand">
        {parts.join('，')} ▼
      </summary>
      <div className="mt-1 flex flex-col gap-0.5 pl-3">
        {reads.map((t, i) => (
          <span key={`r${i}`} className="text-xs text-muted">
            已阅读 {extractFileName(t.cmd)}
          </span>
        ))}
        {execs.map((t, i) => (
          <span key={`e${i}`} className="font-mono text-xs text-muted">
            {t.cmd.replace(/\s+/g, ' ').trim().slice(0, 80)}
          </span>
        ))}
      </div>
    </details>
  );
};

/** v2 过程视图（Trae 模式）：思考阶段 → 意图文本 + 操作摘要折叠 */
const RunEventsView = ({ run }: { run: RunTranscript }) => {
  const phases = useMemo(() => groupPhases(run.events ?? []), [run.events]);
  if (phases.length === 0 && !run.transcript) return null;
  return (
    <div className="mt-2 border-t border-ghost pt-2">
      <div className="mb-1.5 text-xs font-medium text-muted">思考过程</div>
      {phases.map((phase, i) => (
        <div key={i} className="mb-2 flex flex-col gap-0.5">
          {phase.intent && (
            <p
              className={
                phase.plan
                  ? 'border-l-2 border-ghost pl-2 text-xs leading-relaxed break-words whitespace-pre-wrap text-muted italic'
                  : 'text-[13px] leading-relaxed break-words whitespace-pre-wrap'
              }
            >
              {phase.intent}
            </p>
          )}
          {phase.tools.length > 0 && <OperationBlock tools={phase.tools} />}
        </div>
      ))}
      {run.truncated && (
        <div className="text-[11px] text-muted">（内容过长，超出单条上限的部分已省略）</div>
      )}
    </div>
  );
};

export const MessageBubble = ({
  message,
  agent,
  user,
  wsId,
}: {
  message: SessionMessage;
  agent: Agent;
  user: ReturnType<typeof useAuth>['user'];
  /** 工作空间 ID（可选）：提供时 run 消息可拉取任务的完整工具输出 */
  wsId?: string;
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-white">
          <p className="leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
        </div>
        {user?.avatar_url ? (
          <Avatar size={32} src={user.avatar_url} className="shrink-0 !rounded-[8px]" />
        ) : (
          <Avatar
            size={32}
            className="shrink-0 !rounded-[8px] !bg-[linear-gradient(135deg,#0a0a0a,#3a3a3a)]"
          >
            {user?.username?.slice(0, 2).toUpperCase() ?? 'U'}
          </Avatar>
        )}
      </div>
    );
  }

  // 运行转录消息（kind=run 的 JSON 信封）：摘要（全文）+ 过程（v2 事件折叠 / v1 整段兼容）
  const run = parseRunMessage(message.content);
  if (run) {
    const answers = run.answers ?? [];
    const hasV2 = (run.events?.length ?? 0) > 0;
    const summaryLong = run.summary.length > 1600;
    return (
      <div className="flex items-start gap-3">
        <AgentAvatar agent={agent} size={32} />
        <div className="flex max-w-[85%] flex-col gap-1">
          <div className="text-[11px] font-medium">{agent.name}</div>
          <div className="rounded-2xl rounded-bl-md border border-ghost px-4 py-2.5">
            <div className={summaryLong ? 'max-h-[420px] overflow-y-auto' : undefined}>
              <p className="leading-relaxed break-words whitespace-pre-wrap">{run.summary}</p>
            </div>
            <details className="mt-2 border-t border-ghost pt-2">
              <summary className="cursor-pointer text-xs text-muted select-none hover:text-brand">
                {hasV2
                  ? `查看执行过程（${run.events?.length ?? 0} 个步骤）`
                  : `查看执行过程${answers.length > 0 ? `（${answers.length} 次回答）` : ''}`}
              </summary>
              {hasV2 ? (
                <RunEventsView run={run} />
              ) : (
                <>
                  <pre className="m-0 mt-2 max-h-96 overflow-auto font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
                    {run.transcript ?? ''}
                  </pre>
                  {answers.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5 border-t border-ghost pt-2">
                      {answers.map((answer, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="shrink-0 text-brand">你的回答 {i + 1}:</span>
                          <span className="min-w-0 break-words whitespace-pre-wrap">{answer}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {run.truncated && (
                    <div className="mt-1.5 text-[11px] text-muted">（过程过长，已截断展示）</div>
                  )}
                  <FullToolOutputs wsId={wsId} taskId={message.task_id} />
                </>
              )}
            </details>
          </div>
        </div>
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
            <span className="size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgentSelector = ({
  agent,
  agents,
  onSelect,
}: {
  agent: Agent;
  agents: Agent[];
  onSelect: (a: Agent) => void;
}) => {
  // Agent 状态语义暂不完整（新建均为 offline），先全部展示便于选择
  const availableAgents = agents;
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: availableAgents.map((a) => ({
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
          const next = availableAgents.find((a) => String(a.id) === key);
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
  agents,
  value,
  onChange,
  onSend,
  loading,
  onAgentSelect,
}: {
  agent: Agent;
  agents: Agent[];
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
        autoSize={{ minRows: 3, maxRows: 6 }}
        variant="borderless"
        className="!px-4 !py-3 !text-standard"
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <AgentSelector agent={agent} agents={agents} onSelect={onAgentSelect} />
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

export const getAgent = (message: SessionMessage, fallback: Agent, agents: Agent[] = []): Agent => {
  if (message.agent_id) {
    return agents.find((a) => String(a.id) === String(message.agent_id)) ?? fallback;
  }
  return fallback;
};

/**
 * 默认选中的 Agent：优先"已绑定工作电脑且配置了 runtime"（能真正下发任务）；
 * 都没有时退回第一个。避免默认选中未绑定的旧 Agent 导致"任务下发失败"。
 */
export const pickDefaultAgent = (agents: Agent[]): Agent | undefined =>
  agents.find((a) => a.work_computer_id && a.runtime) ?? agents[0];
