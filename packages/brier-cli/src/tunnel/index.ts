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
/** auth 消息发出后等待 auth-ok/auth-failed 的最长时间，超时视为握手失败并重连 */
const AUTH_HANDSHAKE_TIMEOUT_MS = 10_000;
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
  /** auth 握手超时计时器（open 后启动，auth-ok/auth-failed/close 时清除） */
  let handshakeTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * 本次运行是否以“错误”终止（auth 失败 / 重连耗尽）。
   * 区分于 stop() 的正常停止：保证随后的 close 事件不把 error 覆盖成 disconnected。
   */
  let exitAsError = false;
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

  const send = (message: ClientMessage): boolean =>
    transport.send(JSON.stringify(message));

  const sendHeartbeat = (): boolean => send({ type: 'heartbeat', timestamp: Date.now() });

  const clearHandshakeTimer = () => {
    if (handshakeTimer) {
      clearTimeout(handshakeTimer);
      handshakeTimer = null;
    }
  };

  /**
   * 启动握手超时：若服务端不回 auth-ok/auth-failed，10s 后主动断开走重连，
   * 避免永久停留在 connecting（此时心跳尚未启动，无其他自愈路径）。
   */
  const armHandshakeTimeout = () => {
    clearHandshakeTimer();
    handshakeTimer = setTimeout(() => {
      logger.warn('Auth handshake timed out, reconnecting');
      transport.close(4000, 'auth timeout');
    }, AUTH_HANDSHAKE_TIMEOUT_MS);
  };

  const heartbeat = createHeartbeat({
    intervalMs: HEARTBEAT_INTERVAL_MS,
    timeoutMs: HEARTBEAT_TIMEOUT_MS,
    onBeat: sendHeartbeat,
    onTimeout: () => {
      logger.warn('Heartbeat timeout, forcing reconnect');
      transport.close(4000, 'heartbeat timeout');
    },
    onBeatError: (error) => {
      logger.error('Heartbeat send failed:', error);
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
      exitAsError = true;
      running = false;
      notifyStateChange('error');
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
      clearHandshakeTimer();
      logger.info('Tunnel authenticated, computerId:', computerId);
      backoff.reset();
      notifyStateChange('connected');
      heartbeat.start();
    },
    onAuthFailed: (reason) => {
      clearHandshakeTimer();
      logger.error('Authentication failed:', reason);
      exitAsError = true;
      running = false;
      notifyStateChange('error');
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
    armHandshakeTimeout();
  });
  transport.on('message', (data) => dispatchServerMessage(data, dispatchHandlers));
  transport.on('close', (code, reason) => {
    const reasonStr = reason || `code ${code}`;
    logger.warn(`WebSocket closed: ${reasonStr}`);
    clearHandshakeTimer();
    heartbeat.stop();
    if (running) {
      scheduleReconnect();
    } else {
      // 失败停机（auth 失败/重连耗尽）保持 error，正常 stop 才是 disconnected
      notifyStateChange(exitAsError ? 'error' : 'disconnected');
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
    exitAsError = false;
    backoff.reset();
    connect();
  };

  const stop = async () => {
    running = false;
    heartbeat.stop();
    clearHandshakeTimer();
    // 取消运行中任务由宿主（DaemonRunner）在自身 shutdown 里处理，隧道只负责关闭连接
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // 连接已完全关闭（从未连接/已断开/已 teardown）：close 事件不会再触发，
    // 直接返回，避免空等 waitClosed 的 3s 兜底超时。
    if (transport.isClosed()) {
      notifyStateChange('disconnected');
      logger.info('Tunnel stopped');
      return;
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
