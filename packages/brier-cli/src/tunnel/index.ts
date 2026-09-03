import type {
  ClientMessage,
  DaemonConfig,
  ServerMessage,
  TunnelState,
} from '../definitions/index.js';
import { toWsUrl } from './url.js';
import { logger } from '../core/index.js';
import { createBackoff } from './backoff.js';
import type { ServerMessageHandlers } from './dispatcher.js';
import { dispatchServerMessage } from './dispatcher.js';
import { createHeartbeat } from './heartbeat.js';
import { createWebSocketTransport } from './transport.js';

const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 50;

export interface TunnelClient {
  start: () => void;
  stop: () => Promise<void>;
  /** 发送上行消息；返回是否真正发出（未连接时为 false，调用方决定如何处理） */
  send: (message: ClientMessage) => boolean;
  getState: () => TunnelState;
  onStateChange: (callback: (state: TunnelState) => void) => () => void;
}

/**
 * 业务消息处理回调（组合点）。
 *
 * 隧道只负责“协议 → 消息分发”，不解释业务：task-start/task-cancel
 * 原样交给宿主实现（daemon/DaemonRunner 将其翻译成 TaskExecutor 调用）。
 * 隧道域因此不依赖任务执行域。
 */
export interface TunnelMessageHandlers {
  onTaskStart: (message: Extract<ServerMessage, { type: 'task-start' }>) => void;
  onTaskCancel: (taskId: string) => void;
}

/**
 * 隧道骨架：连接生命周期编排与状态仲裁的唯一入口。
 *
 * 本文件只做“编排”，不接触 ws 细节、不算退避、不解析消息：
 * - transport：负责底层连接与收发帧
 * - heartbeat：负责心跳节奏（只上报不决策）
 * - backoff：负责重连延迟计算（纯逻辑）
 * - dispatcher：负责服务端消息解析与分发
 *
 * 关键时序不变式（重构后保持与原实现一致）：
 * 1. 心跳仅在 auth-ok 后启动；
 * 2. close 后仅当 running 才退避重连，stop() 后绝不再连；
 * 3. 仅 auth-ok 归零退避计数；
 * 4. stop 时先优雅 close，3s 兜底 terminate。
 */
export const createTunnelClient = (
  config: DaemonConfig,
  messageHandlers: TunnelMessageHandlers,
): TunnelClient => {
  const transport = createWebSocketTransport();
  const backoff = createBackoff({
    baseMs: BASE_RECONNECT_DELAY_MS,
    maxMs: MAX_RECONNECT_DELAY_MS,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  let state: TunnelState = 'disconnected';
  let running = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(state: TunnelState) => void>();

  const notifyStateChange = (newState: TunnelState) => {
    state = newState;
    for (const callback of listeners) {
      callback(newState);
    }
  };

  const onStateChange = (callback: (state: TunnelState) => void): (() => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  };

  const getState = () => state;

  /**
   * 发送一条上行消息。
   * 同一事件循环内先判状态再发送，无异步间隙，因此不会抛出“未连接”异常；
   * 未连接时直接返回 false，由调用方显式决定（丢弃或缓冲）。
   */
  const send = (message: ClientMessage): boolean => {
    if (!transport.isOpen()) {
      return false;
    }
    transport.send(JSON.stringify(message));
    return true;
  };

  const sendHeartbeat = (): boolean => send({ type: 'heartbeat', timestamp: Date.now() });

  const heartbeat = createHeartbeat({
    intervalMs: HEARTBEAT_INTERVAL_MS,
    timeoutMs: HEARTBEAT_TIMEOUT_MS,
    onBeat: sendHeartbeat,
    onTimeout: () => {
      logger.warn('Heartbeat timeout, forcing reconnect');
      transport.close(4000, 'heartbeat timeout');
    },
  });

  const connect = () => {
    logger.info('Connecting to', toWsUrl(config.serverUrl));
    notifyStateChange('connecting');
    transport.connect(toWsUrl(config.serverUrl), {
      Authorization: `Bearer ${config.token}`,
      'X-Brier-Hostname': config.hostname,
      'X-Brier-OS': config.os,
    });
  };

  const scheduleReconnect = () => {
    if (!running) return;

    const delay = backoff.next();
    if (delay < 0) {
      logger.error('Max reconnect attempts reached, stopping');
      notifyStateChange('error');
      running = false;
      return;
    }

    logger.info(
      `Reconnecting in ${(delay / 1000).toFixed(0)}s (attempt ${backoff.attempts}/${MAX_RECONNECT_ATTEMPTS})`,
    );
    notifyStateChange('reconnecting');

    reconnectTimer = setTimeout(() => {
      if (running) {
        connect();
      }
    }, delay);
  };

  const dispatchHandlers: ServerMessageHandlers = {
    onAuthOk: (computerId) => {
      logger.info('Tunnel authenticated, computerId:', computerId);
      backoff.reset();
      notifyStateChange('connected');
      heartbeat.start();
    },
    onAuthFailed: (reason) => {
      logger.error('Authentication failed:', reason);
      notifyStateChange('error');
      running = false;
    },
    onHeartbeatAck: () => {
      heartbeat.ack();
    },
    onTaskStart: (message) => {
      logger.info('Task start:', message.taskId, message.command);
      messageHandlers.onTaskStart(message);
    },
    onTaskCancel: (taskId) => {
      logger.info('Task cancel:', taskId);
      messageHandlers.onTaskCancel(taskId);
    },
    onQueryRuntimes: () => {
      send({ type: 'runtime-info', runtimes: config.runtimes });
    },
  };

  // 传输事件 → 骨架仲裁（订阅一次，跨多次重连保持有效）
  transport.on('open', () => {
    logger.info('WebSocket connected, authenticating...');
    send({
      type: 'auth',
      token: config.token,
      hostname: config.hostname,
      os: config.os,
      runtimes: config.runtimes,
      version: config.version,
    });
  });
  transport.on('message', (data) => dispatchServerMessage(data, dispatchHandlers));
  transport.on('close', (code, reason) => {
    const reasonStr = reason || `code ${code}`;
    logger.warn(`WebSocket closed: ${reasonStr}`);
    heartbeat.stop();
    if (running) {
      scheduleReconnect();
    } else {
      notifyStateChange('disconnected');
    }
  });
  transport.on('error', (err) => {
    logger.error('WebSocket error:', err);
  });

  const start = () => {
    if (running) {
      logger.warn('Tunnel is already running');
      return;
    }
    running = true;
    backoff.reset();
    connect();
  };

  const stop = async () => {
    running = false;
    heartbeat.stop();
    // 取消运行中任务由宿主（DaemonRunner）在自身 shutdown 里处理，隧道只负责关闭连接
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    transport.close(1000, 'client shutdown');
    await transport.waitClosed(3000);
    if (transport.isOpen() || transport.isConnecting()) {
      transport.terminate();
    }

    notifyStateChange('disconnected');
    logger.info('Tunnel stopped');
  };

  return {
    start,
    stop,
    send,
    getState,
    onStateChange,
  };
};
