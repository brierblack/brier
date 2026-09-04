import type { StreamType } from '../definitions/index.js';

/**
 * 任务输出批量发送器（micro-batching）。
 *
 * 动机：task-output 是高频小消息，逐块上行会在传输、序列化与服务端逐帧 DB 写入上
 * 放大开销。本模块按 (taskId, stream) 缓冲，满足以下任一条件即 flush：
 * - 单缓冲累计达到 maxBatchBytes（大输出即时发送，不等时间窗）；
 * - 到达 flushIntervalMs（低流量输出不会滞留过久，保证可感知延迟有上界）。
 *
 * 语义保证：
 * - 同一 (taskId, stream) 严格保序，合并为一条消息发出；
 * - 不同 task/stream 互不阻塞，各自独立 flush；
 * - 只聚合、不截断、不背压（背压仍由上层 safeSend/连接层负责）。
 */
export interface OutputChunk {
  taskId: string;
  stream: StreamType;
  /** 该缓冲项合并后的完整数据 */
  data: string;
}

export interface OutputBatcherOptions {
  /** 单个 (taskId, stream) 缓冲的字节阈值（按字符串 length 近似），达到即立即 flush */
  maxBatchBytes?: number;
  /** 周期 flush 时间窗（ms），保证低流量也有延迟上界 */
  flushIntervalMs?: number;
  /** flush 回调：一次回调可含多个缓冲项 */
  onFlush: (chunks: OutputChunk[]) => void;
}

export interface OutputBatcher {
  /** 追加一块输出；达到字节阈值会立即触发 flush */
  push: (taskId: string, stream: StreamType, data: string) => void;
  /** 立即 flush 指定 task 的全部缓冲（发送终态消息前调用，避免尾输出丢失） */
  flushTask: (taskId: string) => void;
  /** 立即 flush 全部缓冲（停止前调用） */
  flushAll: () => void;
  /** 清理定时器与残留缓冲（调用前应先 flushAll） */
  dispose: () => void;
}

const DEFAULT_MAX_BATCH_BYTES = 16 * 1024;
const DEFAULT_FLUSH_INTERVAL_MS = 50;

interface PendingEntry {
  taskId: string;
  stream: StreamType;
  parts: string[];
  bytes: number;
}

const keyOf = (taskId: string, stream: StreamType): string => `${taskId}\u0000${stream}`;

export const createOutputBatcher = (options: OutputBatcherOptions): OutputBatcher => {
  const maxBatchBytes = options.maxBatchBytes ?? DEFAULT_MAX_BATCH_BYTES;
  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
  const pending = new Map<string, PendingEntry>();
  let timer: ReturnType<typeof setInterval> | null = null;

  const flushEntry = (key: string, entry: PendingEntry) => {
    pending.delete(key);
    options.onFlush([
      {
        taskId: entry.taskId,
        stream: entry.stream,
        data: entry.parts.join(''),
      },
    ]);
  };

  const ensureTimer = () => {
    if (timer) return;
    timer = setInterval(() => {
      if (pending.size === 0) return;
      const entries = [...pending.entries()];
      for (const [key, entry] of entries) {
        if (pending.has(key)) {
          try {
            flushEntry(key, entry);
          } catch (err) {
            pending.delete(key);
            // flush 回调抛错不应杀死进程（setInterval 回调中的异常成为 uncaughtException）
            // 丢弃该缓冲项，其余继续
          }
        }
      }
    }, flushIntervalMs);
  };

  return {
    push(taskId, stream, data) {
      if (data.length === 0) return;
      ensureTimer();
      const key = keyOf(taskId, stream);
      let entry = pending.get(key);
      if (!entry) {
        entry = { taskId, stream, parts: [], bytes: 0 };
        pending.set(key, entry);
      }
      entry.parts.push(data);
      entry.bytes += data.length;
      if (entry.bytes >= maxBatchBytes) {
        flushEntry(key, entry);
      }
    },

    flushTask(taskId) {
      const entries = [...pending.entries()].filter(([, e]) => e.taskId === taskId);
      for (const [key, entry] of entries) {
        flushEntry(key, entry);
      }
    },

    flushAll() {
      const entries = [...pending.entries()];
      for (const [key, entry] of entries) {
        flushEntry(key, entry);
      }
    },

    dispose() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      pending.clear();
    },
  };
};
