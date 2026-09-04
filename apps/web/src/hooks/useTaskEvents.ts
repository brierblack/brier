import { useEffect, useRef } from 'react';
import type { TaskStatus } from '@/api/generated';

/** SSE 推送的任务事件负载（与后端 TaskEvent 序列化对齐）。 */
export type TaskSseEvent =
  | {
      type: 'task_updated';
      task_id: string;
      workspace_id: string;
      status: TaskStatus;
    }
  | {
      type: 'task_output';
      task_id: string;
      workspace_id: string;
      /** 本块在任务累计输出中的起始偏移（字节），用于快照增量去重/补缺。 */
      offset: number;
      data: string;
    };

/**
 * 订阅任务事件 SSE（工作电脑事件同一端点，按 workspace 过滤）。
 *
 * 服务端在任务开始执行 / 完成 / 失败 / 取消时推送 `task_updated`，
 * 执行过程中推送 `task_output`（输出增量块）。
 * - `workspaceId`：订阅该工作空间的任务事件（端点按会话过滤，避免无关事件干扰）；
 * - 收到事件后由调用方决定刷新列表或追加输出。
 *
 * EventSource 断线自动重连；组件卸载或 enabled 置 false 时关闭连接。
 */
export const useTaskEvents = (
  enabled: boolean,
  workspaceId: string | undefined,
  onEvent: (e: TaskSseEvent) => void,
) => {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const url = `/api/work-computers/events?workspace_id=${encodeURIComponent(workspaceId)}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { type?: string };
        if (data.type === 'task_updated' || data.type === 'task_output') {
          callbackRef.current(data as TaskSseEvent);
        }
      } catch {
        // 忽略无法解析的事件
      }
    };
    // onerror 不处理：EventSource 断线后按浏览器策略自动重连
    return () => es.close();
  }, [enabled, workspaceId]);
};
