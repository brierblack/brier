import { useEffect, useRef } from 'react';

export type WorkComputerEventType = 'updated' | 'deleted';

/**
 * 订阅工作电脑状态 SSE（GET /api/work-computers/events，走会话 Cookie 鉴权）。
 *
 * 服务端在电脑上线 / 下线 / 删除时推送事件；收到后由调用方刷新列表（事件驱动拉取）。
 * EventSource 断线自动重连，无需额外处理；组件卸载或 enabled 置 false 时关闭连接。
 */
export const useWorkComputerEvents = (
  enabled: boolean,
  onEvent: (type: WorkComputerEventType) => void,
) => {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource('/api/work-computers/events');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { type?: string };
        if (data.type === 'updated' || data.type === 'deleted') {
          callbackRef.current(data.type);
        }
      } catch {
        // 忽略无法解析的事件
      }
    };
    // onerror 不处理：EventSource 断线后按浏览器策略自动重连
    return () => es.close();
  }, [enabled]);
};
