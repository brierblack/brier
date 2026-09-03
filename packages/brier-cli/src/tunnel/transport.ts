import { WebSocket } from 'ws';

/**
 * WebSocket 传输层封装：屏蔽 ws 库细节，向骨架暴露统一事件与命令。
 *
 * 职责边界：
 * - connect() 每次调用会先清理上一个连接（移除监听 + terminate），再建立新连接；
 * - 事件（open/message/close/error）通过 on() 订阅，订阅一次后跨多次重连保持有效；
 * - 协议层 ping 自动回 pong，调用方无需感知。
 * - send() 在未连接时抛错（与旧实现语义一致），是否吞掉由上层决策。
 */

export interface TransportEventMap {
  /** 连接建立（TCP+TLS+WS 握手完成） */
  open: () => void;
  /** 连接关闭：code 为关闭码，reason 为关闭原因（已转字符串） */
  close: (code: number, reason: string) => void;
  /** 收到文本消息（已转字符串） */
  message: (data: string) => void;
  /** 底层错误（通常随后触发 close） */
  error: (message: string) => void;
}

export interface Transport {
  /** 建立到 url 的连接（携带自定义请求头）；会清理上一次连接 */
  connect(url: string, headers: Record<string, string>): void;
  /** 发送文本帧；未连接时抛 'Tunnel is not connected' */
  send(data: string): void;
  /** 优雅关闭（仅当连接处于打开/连接中） */
  close(code: number, reason: string): void;
  /** 强制终止底层连接（不触发事件） */
  terminate(): void;
  isOpen(): boolean;
  isConnecting(): boolean;
  /** 等待下一次 close 事件，超时 resolve（用于 stop 的优雅关闭兜底） */
  waitClosed(timeoutMs: number): Promise<void>;
  /** 订阅事件，返回取消订阅函数 */
  on<K extends keyof TransportEventMap>(event: K, callback: TransportEventMap[K]): () => void;
}

export const createWebSocketTransport = (): Transport => {
  let ws: WebSocket | null = null;

  const listeners: { [K in keyof TransportEventMap]: Set<TransportEventMap[K]> } = {
    open: new Set(),
    close: new Set(),
    message: new Set(),
    error: new Set(),
  };

  const emit = <K extends keyof TransportEventMap>(
    event: K,
    ...args: Parameters<TransportEventMap[K]>
  ) => {
    // 泛型下 Parameters 的元组关系无法直接展开，统一按 rest 参数调用
    for (const callback of listeners[event]) {
      (callback as (...fireArgs: unknown[]) => void)(...args);
    }
  };

  const teardown = () => {
    if (ws) {
      ws.removeAllListeners();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
      }
      ws = null;
    }
  };

  const readyState = (): WebSocket['readyState'] | -1 => (ws ? ws.readyState : -1);

  return {
    connect(url, headers) {
      teardown();
      const socket = new WebSocket(url, { headers });
      ws = socket;

      socket.on('open', () => emit('open'));
      socket.on('message', (data) => emit('message', data.toString()));
      socket.on('close', (code, reason) => emit('close', code, reason.toString()));
      socket.on('error', (err) => emit('error', err.message));
      socket.on('ping', () => socket.pong());
    },

    send(data) {
      if (ws === null || ws.readyState !== WebSocket.OPEN) {
        throw new Error('Tunnel is not connected');
      }
      ws.send(data);
    },

    close(code, reason) {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close(code, reason);
      }
    },

    terminate() {
      ws?.terminate();
    },

    isOpen() {
      return readyState() === WebSocket.OPEN;
    },

    isConnecting() {
      return readyState() === WebSocket.CONNECTING;
    },

    waitClosed(timeoutMs) {
      return new Promise<void>((resolve) => {
        let settled = false;
        const onClose: TransportEventMap['close'] = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        };
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        }, timeoutMs);
        const cleanup = () => {
          clearTimeout(timer);
          listeners.close.delete(onClose);
        };
        listeners.close.add(onClose);
      });
    },

    on(event, callback) {
      listeners[event].add(callback);
      return () => {
        listeners[event].delete(callback);
      };
    },
  };
};
