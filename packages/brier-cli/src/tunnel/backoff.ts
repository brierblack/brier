/**
 * 重连退避策略（纯逻辑，无 IO、无副作用）。
 *
 * 与原实现的等价行为：指数退避（1s 起步、封顶 maxMs），累计 maxAttempts 次后放弃。
 * next() 返回 -1 表示“已耗尽、应停止重连”；attempts 仅供日志展示尝试次数。
 */
export interface BackoffOptions {
  /** 基础延迟（ms），首次重连即使用该值 */
  baseMs: number;
  /** 延迟封顶（ms） */
  maxMs: number;
  /** 最大重连尝试次数，达到后放弃 */
  maxAttempts: number;
}

export interface Backoff {
  /**
   * 计算下一次等待毫秒数。
   * 已尝试次数达到 maxAttempts 时返回 -1（调用方应停止重连）。
   */
  next(): number;
  /** 已排定/已执行的尝试次数（供日志与判断） */
  readonly attempts: number;
  /** 连接成功后归零 */
  reset(): void;
}

export const createBackoff = (options: BackoffOptions): Backoff => {
  let attempts = 0;

  return {
    next() {
      if (attempts >= options.maxAttempts) {
        return -1;
      }
      attempts += 1;
      return Math.min(options.baseMs * Math.pow(2, attempts - 1), options.maxMs);
    },
    get attempts() {
      return attempts;
    },
    reset() {
      attempts = 0;
    },
  };
};
