/**
 * CLI 输出投影器：把 runtime 的原始输出流转换为“可展示过程文本”。
 *
 * 背景：OpenCode 以 `--format json` 输出结构化事件（每行一个 JSON），顶层 type 为事件类型：
 * - text：助手文本（part.text，按句输出）
 * - tool_use：工具调用（part.tool 工具名、part.state.input 参数、part.state.output 结果）
 * - step_start / 其他：过程边界等，当前不投影到正文（避免噪音）
 * 事件行均携带 sessionID，供会话线程内跨轮续接。
 *
 * 设计：
 * - 文本事件 → 直接追加为正文；
 * - 工具调用（status=completed）→ 投影为“工具行 + 命令/输入摘要 + 截断输出”，
 *   让过程视图能看到 AI 真正做了什么，而不只是最终回答；
 * - 非 JSON 行（异常/非严格模式）原样透传，保证不吞内容；
 * - 其他 runtime：透传原始 chunk（保持接入前行为）。
 */

export interface OutputProjector {
  /** 投喂一块原始输出，返回本轮新增的可展示文本（空串表示无可展示内容） */
  push: (chunk: string) => string;
  /** 已捕获的 CLI 会话 ID（未捕获为 null） */
  getSessionId: () => string | null;
  /** 最后一次工具调用之后的助手文本（最终回答）；未支持/无工具时返回空串 */
  getFinalText: () => string;
}

/** 截取字符串并保留行数限制（供工具输出预览用） */
const clipText = (text: string, maxChars: number, maxLines: number): string => {
  const allLines = text.split('\n');
  const kept = allLines.slice(0, maxLines).join('\n');
  const truncatedChars = kept.length > maxChars;
  const truncatedLines = allLines.length > maxLines;
  if (!truncatedChars && !truncatedLines) return kept;
  const base = truncatedChars ? kept.slice(0, maxChars) : kept;
  return `${base}\n…(输出过长已截断)`;
};

/** 工具输入摘要：优先展示 command 字段，其余按 JSON 截断 */
const formatToolInput = (input: unknown): string => {
  if (input === null || typeof input !== 'object') return '';
  const obj = input as Record<string, unknown>;
  if (typeof obj.command === 'string') return obj.command;
  const json = JSON.stringify(obj);
  return json.length > 160 ? `${json.slice(0, 160)}…` : json;
};

/** 工具输出预览：截取前若干行/字符，避免巨量输出刷屏 */
const formatToolOutput = (output: unknown): string => {
  if (typeof output !== 'string' || output.trim() === '') return '';
  const clipped = clipText(output, 400, 6);
  return `\n${clipped}`;
};

export const createOutputProjector = (runtime: string | null | undefined): OutputProjector => {
  if (runtime !== 'OpenCode') {
    // 其他 runtime：透传原始 chunk（保持接入前行为）
    return {
      push: (chunk) => chunk,
      getSessionId: () => null,
      getFinalText: () => '',
    };
  }

  let lineBuffer = '';
  let sessionId: string | null = null;
  /** 最后一次工具调用之后的助手文本（作为“最终回答”摘要来源） */
  let postToolText = '';

  const projectLine = (rawLine: string, line: string): string => {
    if (!line.startsWith('{')) {
      // 非 JSON（异常/非严格模式）：原样保留
      return `${rawLine}\n`;
    }
    let evt: unknown;
    try {
      evt = JSON.parse(line);
    } catch {
      // 非完整 JSON 行：原样保留，避免吞内容
      return `${rawLine}\n`;
    }
    if (evt === null || typeof evt !== 'object') return '';
    const obj = evt as {
      type?: unknown;
      sessionID?: unknown;
      part?: { type?: unknown; text?: unknown; tool?: unknown; state?: unknown };
    };
    if (typeof obj.sessionID === 'string' && sessionId === null) {
      sessionId = obj.sessionID;
    }
    const part = obj.part;
    if (part === undefined || typeof part !== 'object') return '';

    switch (obj.type) {
      case 'text': {
        if (typeof part.text === 'string' && part.text.length > 0) {
          const text = part.text.endsWith('\n') ? part.text : `${part.text}\n`;
          postToolText += text;
          return text;
        }
        return '';
      }
      case 'tool_use': {
        // 仅在工具完成时投影一次（运行中状态跳过，避免同一次调用多次重复展示）
        const state =
          part.state !== undefined && typeof part.state === 'object'
            ? (part.state as { status?: unknown; input?: unknown; output?: unknown })
            : undefined;
        if (state === undefined || state.status !== 'completed') return '';
        const toolName = typeof part.tool === 'string' ? part.tool : 'unknown';
        const inputBrief = formatToolInput(state.input);
        const outputPreview = formatToolOutput(state.output);
        const head = inputBrief ? `工具 ${toolName} · ${inputBrief}` : `工具 ${toolName}`;
        // 新一轮动作开始：此前文本属于过程叙述，不再计入“最终回答”
        postToolText = '';
        return `\n◇ ${head}${outputPreview}\n`;
      }
      default:
        // step_start/其他边界事件不投影到正文（避免过程区噪音）
        return '';
    }
  };

  return {
    push(chunk) {
      lineBuffer += chunk;
      const lines = lineBuffer.split('\n');
      // 最后一段可能是不完整行，留待下个 chunk 补全
      lineBuffer = lines.pop() ?? '';
      let visible = '';
      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        visible += projectLine(rawLine, trimmed);
      }
      return visible;
    },
    getSessionId: () => sessionId,
    getFinalText: () => postToolText.trim(),
  };
};
