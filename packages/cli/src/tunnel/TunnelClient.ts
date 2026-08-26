import { WebSocket } from 'ws';
import type { ClientMessage, ServerMessage, DaemonConfig, TunnelState } from '../types.js';
import type { TaskExecutor } from '../daemon/TaskExecutor.js';
import { toWsUrl } from '../config.js';
import { logger } from '../logger.js';

const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 50;

export interface TunnelClient {
  start: () => void;
  stop: () => Promise<void>;
  send: (message: ClientMessage) => void;
  getState: () => TunnelState;
  onStateChange: (callback: (state: TunnelState) => void) => () => void;
}

export const createTunnelClient = (
  config: DaemonConfig,
  taskExecutor: TaskExecutor,
): TunnelClient => {
  let ws: WebSocket | null = null;
  let state: TunnelState = 'disconnected';
  let running = false;
  let reconnectAttempts = 0;

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
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

  const send = (message: ClientMessage) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('Tunnel is not connected');
    }
    ws.send(JSON.stringify(message));
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        send({ type: 'heartbeat', timestamp: Date.now() });
        heartbeatTimeoutTimer = setTimeout(() => {
          logger.warn('Heartbeat timeout, forcing reconnect');
          ws?.close(4000, 'heartbeat timeout');
        }, HEARTBEAT_TIMEOUT_MS);
      }
    }, HEARTBEAT_INTERVAL_MS);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (heartbeatTimeoutTimer) {
      clearTimeout(heartbeatTimeoutTimer);
      heartbeatTimeoutTimer = null;
    }
  };

  const handleServerMessage = (message: ServerMessage) => {
    switch (message.type) {
      case 'auth-ok':
        logger.info('Tunnel authenticated, computerId:', message.computerId);
        reconnectAttempts = 0;
        notifyStateChange('connected');
        startHeartbeat();
        break;

      case 'auth-failed':
        logger.error('Authentication failed:', message.reason);
        notifyStateChange('error');
        running = false;
        break;

      case 'heartbeat-ack':
        if (heartbeatTimeoutTimer) {
          clearTimeout(heartbeatTimeoutTimer);
          heartbeatTimeoutTimer = null;
        }
        break;

      case 'task-start':
        logger.info('Task start:', message.taskId, message.command);
        taskExecutor.execute({
          taskId: message.taskId,
          runtime: message.runtime,
          command: message.command,
          args: message.args,
          cwd: message.cwd,
          env: message.env,
        });
        break;

      case 'task-cancel':
        logger.info('Task cancel:', message.taskId);
        taskExecutor.cancel(message.taskId);
        break;

      case 'query-runtimes':
        send({ type: 'runtime-info', runtimes: config.runtimes });
        break;
    }
  };

  const scheduleReconnect = () => {
    if (!running) return;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnect attempts reached, stopping');
      notifyStateChange('error');
      running = false;
      return;
    }

    reconnectAttempts++;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1),
      MAX_RECONNECT_DELAY_MS,
    );

    logger.info(
      `Reconnecting in ${(delay / 1000).toFixed(0)}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
    );
    notifyStateChange('reconnecting');

    reconnectTimer = setTimeout(() => {
      if (running) {
        connect();
      }
    }, delay);
  };

  const connect = () => {
    if (ws) {
      ws.removeAllListeners();
      ws.terminate();
      ws = null;
    }

    const wsUrl = toWsUrl(config.serverUrl);

    logger.info('Connecting to', wsUrl);
    notifyStateChange('connecting');

    ws = new WebSocket(wsUrl, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'X-Hive-Hostname': config.hostname,
        'X-Hive-OS': config.os,
      },
    });

    ws.on('open', () => {
      logger.info('WebSocket connected, authenticating...');
      send({
        type: 'auth',
        token: config.token,
        hostname: config.hostname,
        os: config.os,
        runtimes: config.runtimes,
      });
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as ServerMessage;
        handleServerMessage(message);
      } catch (err) {
        logger.error('Failed to parse server message:', err);
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      const reasonStr = reason.toString() || `code ${code}`;
      logger.warn(`WebSocket closed: ${reasonStr}`);
      stopHeartbeat();

      if (running) {
        scheduleReconnect();
      } else {
        notifyStateChange('disconnected');
      }
    });

    ws.on('error', (err: Error) => {
      logger.error('WebSocket error:', err.message);
    });

    ws.on('ping', () => {
      ws?.pong();
    });
  };

  const start = () => {
    if (running) {
      logger.warn('Tunnel is already running');
      return;
    }
    running = true;
    reconnectAttempts = 0;
    connect();
  };

  const stop = async () => {
    running = false;
    stopHeartbeat();
    taskExecutor.cancelAll();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      const closePromise = new Promise<void>((resolve) => {
        if (ws!.readyState === WebSocket.OPEN || ws!.readyState === WebSocket.CONNECTING) {
          ws!.once('close', () => resolve());
          ws!.close(1000, 'client shutdown');
          setTimeout(() => {
            if (ws && ws.readyState !== WebSocket.CLOSED) {
              ws.terminate();
            }
            resolve();
          }, 3000);
        } else {
          resolve();
        }
      });

      await closePromise;
      ws = null;
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
