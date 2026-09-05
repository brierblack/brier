/**
 * 运行转录（run transcript）数据模型与工具。
 *
 * 结构：一轮 agent 任务的“过程 + 结果”合并为**一条 agent 消息**落库，content 为 JSON 信封。
 * - v2（当前写入）：events 有序事件数组（text / tool），工具输出**全量保存**（离线可看全文），
 *   仅在最极端超限（单条 > MAX_CONTENT_CHARS）时从头部裁剪并置 truncated 标记；
 *   summary 为最终回答全文（不截断）。
 * - v1（历史兼容）：transcript 整段字符串 + 截断摘要；渲染侧保留旧路径。
 */

/** content 安全上限（防极端超大消息；日常全量保存不受影响） */
export const MAX_CONTENT_CHARS = 2_000_000;

export type RunVersion = 1 | 2;

export interface RunTextEvent {
  k: 'text';
  /** 助手文本（纯文本，可含换行） */
  d: string;
  /** 规划段标记：首个工具调用之前的文本（agent 的“计划/意图”），渲染时弱化 */
  p?: boolean;
}

export interface RunToolEvent {
  k: 'tool';
  /** 工具名（如 bash / read_file） */
  name: string;
  /** 命令/输入摘要 */
  cmd: string;
  /** 工具完整输出（全量保存，离线可看） */
  out: string;
}

export type RunEvent = RunTextEvent | RunToolEvent;

export interface RunTranscript {
  kind: 'run';
  version: RunVersion;
  /** 最终回答全文（v2 起不截断；渲染层自行折叠/滚动） */
  summary: string;
  /** v1 历史字段：整段过程文本 */
  transcript?: string;
  /** v1 历史字段：运行期用户回答（pty 时代） */
  answers?: string[];
  /** v2 过程事件（有序）；v1 无此字段 */
  events?: RunEvent[];
  /** 超出安全上限被裁剪标记（仅极端情况） */
  truncated?: boolean;
  /** CLI 原生会话 ID（如 opencode sessionID），供会话线程内跨轮续接 */
  sessionId?: string;
}

/** 去除 ANSI 转义序列与回车（\r\n→\n），保留纯文本过程 */
export const stripAnsi = (text: string): string => {
  // eslint-disable-next-line no-control-regex -- ANSI 转义以 ESC(0x1b) 起始，需按控制符匹配
  const ansiRe = /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
  return text.replace(ansiRe, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};

/** 尝试把消息 content 解析为 RunTranscript；非 run 消息/解析失败返回 null */
export const parseRunMessage = (content: string): RunTranscript | null => {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      (parsed as { kind?: unknown }).kind === 'run'
    ) {
      return parsed as RunTranscript;
    }
  } catch {
    // 非 JSON（普通消息），按普通文本处理
  }
  return null;
};

const MAX_TOOL_OUTPUT_KEEP = MAX_CONTENT_CHARS;

/** 序列化并施加安全上限：超限时从头部事件开始丢弃（保留末尾结果）并置 truncated */
const serializePayload = (payload: Omit<RunTranscript, 'kind'>): string => {
  let body: RunTranscript = { kind: 'run', ...payload };
  const stringify = () => JSON.stringify(body);
  if (stringify().length <= MAX_CONTENT_CHARS) return stringify();
  body = { ...body, truncated: true };
  const events = [...(body.events ?? [])];
  // 从头部丢弃（过程在前、结果在后），仍超限则极端截断工具输出尾部
  while (events.length > 1 && stringify().length > MAX_CONTENT_CHARS) {
    events.shift();
    body = { ...body, events };
  }
  const eventsFinal = [...events];
  if (stringify().length > MAX_CONTENT_CHARS && eventsFinal.length > 0) {
    const last = eventsFinal[eventsFinal.length - 1];
    if (last.k === 'tool' && last.out.length > 0) {
      last.out = `${last.out.slice(0, MAX_TOOL_OUTPUT_KEEP)}\n…(内容过长，超出单条上限已截断)`;
      body = { ...body, events: eventsFinal };
    }
  }
  return stringify();
};

/**
 * v2：组装转录 content（全量事件 + 全文摘要）。
 * @param events 过程事件（text/tool，工具输出全量）
 * @param summary 最终回答全文
 */
export const buildRunContentV2 = (input: {
  events: RunEvent[];
  summary: string;
  answers?: string[];
  sessionId?: string;
}): string => {
  const payload: Omit<RunTranscript, 'kind'> = {
    version: 2,
    summary: input.summary,
    events: input.events,
    answers: input.answers ?? [],
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  };
  return serializePayload(payload);
};

/**
 * 解析 opencode `--format json` 原始事件流为有序过程事件。
 * 文本事件 -> text；完成的工具调用（type=tool_use, state.status=completed）-> tool。
 */
export const parseOpenCodeRunEvents = (raw: string): RunEvent[] => {
  const events: RunEvent[] = [];
  let sawTool = false;
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
        text?: unknown;
        tool?: unknown;
        state?: { status?: unknown; input?: unknown; output?: unknown };
      };
    };
    const part = obj.part;
    if (part === undefined || typeof part !== 'object') continue;
    if (obj.type === 'text' && typeof part.text === 'string' && part.text.length > 0) {
      events.push({ k: 'text', d: stripAnsi(part.text), ...(sawTool ? {} : { p: true }) });
      continue;
    }
    if (obj.type !== 'tool_use') continue;
    const state = part.state;
    if (state === undefined || state.status !== 'completed') continue;
    sawTool = true;
    const input =
      state.input !== null && typeof state.input === 'object'
        ? (state.input as Record<string, unknown>)
        : undefined;
    const cmd =
      typeof input?.command === 'string' ? input.command : JSON.stringify(state.input ?? {});
    events.push({
      k: 'tool',
      name: typeof part.tool === 'string' ? part.tool : 'unknown',
      cmd,
      out: typeof state.output === 'string' ? state.output : '',
    });
  }
  return events;
};
