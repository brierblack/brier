import { useEffect, useRef } from 'react';

/**
 * 订阅任务状态 SSE（与工作电脑事件同一 user 事件流端点）。
 *
 * 服务端在任务开始执行 / 完成 / 失败 / 取消时推送 `{ type: 'task_updated', ... }`；
 * 收到后由调用方刷新任务列表（事件驱动拉取，替代定时轮询）。
 * EventSource 断线自动重连；组件卸载或 enabled 置 false 时关闭连接。
 */
export const useTaskEvents = (enabled: boolean, onEvent: () => void) => {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource('/api/work-computers/events');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { type?: string };
        if (data.type === 'task_updated') {
          callbackRef.current();
        }
      } catch {
        // 忽略无法解析的事件
      }
    };
    return () => es.close();
  }, [enabled]);
};
