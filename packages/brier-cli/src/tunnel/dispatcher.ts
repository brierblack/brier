import { logger } from '../core/index.js';
import type { ServerMessage } from '../definitions/index.js';

/**
 * 服务端下行消息解析与分发。
 *
 * 只做两件事：把 WS 文本帧 JSON.parse 成 ServerMessage，再按 type 分发给对应回调。
 * 不接触 ws、状态机或执行器——骨架通过回调把“协议 → 业务动作”接起来，
 * 本模块因此不依赖网络与运行状态，职责保持单一。
 */

export interface ServerMessageHandlers {
  /** 鉴权通过（携带服务端分配的工作电脑 ID） */
  onAuthOk: (computerId: string) => void;
  /** 鉴权失败（reason 为原因） */
  onAuthFailed: (reason: string) => void;
  /** 心跳回执 */
  onHeartbeatAck: (timestamp: number) => void;
  /** 任务下发 */
  onTaskStart: (message: Extract<ServerMessage, { type: 'task-start' }>) => void;
  /** 任务取消 */
  onTaskCancel: (taskId: string) => void;
  /** 服务端查询本机 runtime 清单 */
  onQueryRuntimes: () => void;
}

/** 解析并分发一条服务端消息；JSON 解析失败或未知 type 记日志后静默返回。 */
export const dispatchServerMessage = (raw: string, handlers: ServerMessageHandlers): void => {
  let message: ServerMessage;
  try {
    message = JSON.parse(raw) as ServerMessage;
  } catch (err) {
    logger.error('Failed to parse server message:', err);
    return;
  }

  switch (message.type) {
    case 'auth-ok':
      handlers.onAuthOk(message.computerId);
      break;
    case 'auth-failed':
      handlers.onAuthFailed(message.reason);
      break;
    case 'heartbeat-ack':
      handlers.onHeartbeatAck(message.timestamp);
      break;
    case 'task-start':
      handlers.onTaskStart(message);
      break;
    case 'task-cancel':
      handlers.onTaskCancel(message.taskId);
      break;
    case 'query-runtimes':
      handlers.onQueryRuntimes();
      break;
    default:
      // 协议演进中可能出现未知消息，忽略即可（记录以利于排查）
      logger.warn('Unknown server message type:', (message as { type?: string }).type);
  }
};
