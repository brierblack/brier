/**
 * 应用层心跳策略。
 *
 * 只负责节奏：到点调用 onBeat() 发送心跳；onBeat 返回 true（已发出）时启动
 * ack 超时计时，收到 ack 由调用方调 ack() 解除；超时触发 onTimeout()。
 * 本模块“只上报不决策”——超时后如何处理（如关闭连接）由上层骨架决定。
 *
 * 注意：每次触发心跳前先清理上一次的 ack 超时计时器，避免重复计时器叠加。
 */

export interface HeartbeatOptions {
  /** 心跳发送间隔（ms） */
  intervalMs: number;
  /** 等待 ack 的超时（ms） */
  timeoutMs: number;
  /**
   * 心跳发送回调。返回是否已真正发出（连接未打开时返回 false，
   * 此时不启动 ack 超时计时）。
   */
  onBeat: () => boolean;
  /** ack 超时（对端无响应）回调，由上层决定如何处置 */
  onTimeout: () => void;
}

export interface Heartbeat {
  /** 启动心跳（幂等：先停止已有计时器再开始） */
  start(): void;
  /** 停止心跳并清理所有计时器 */
  stop(): void;
  /** 收到 ack 时调用：解除当前 ack 超时计时 */
  ack(): void;
}

export const createHeartbeat = (options: HeartbeatOptions): Heartbeat => {
  let intervalTimer: ReturnType<typeof setInterval> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimeoutTimer = () => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  };

  const clearAllTimers = () => {
    if (intervalTimer) {
      clearInterval(intervalTimer);
      intervalTimer = null;
    }
    clearTimeoutTimer();
  };

  const armTimeout = () => {
    clearTimeoutTimer();
    timeoutTimer = setTimeout(() => {
      timeoutTimer = null;
      options.onTimeout();
    }, options.timeoutMs);
  };

  const beat = () => {
    if (options.onBeat()) {
      armTimeout();
    }
  };

  return {
    start() {
      clearAllTimers();
      intervalTimer = setInterval(beat, options.intervalMs);
    },
    stop() {
      clearAllTimers();
    },
    ack() {
      clearTimeoutTimer();
    },
  };
};
