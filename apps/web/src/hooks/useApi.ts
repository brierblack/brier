import { useEffect, useState } from 'react';

/**
 * 统一的异步数据获取 hook（useEffect + useState 实现，不使用 React 19 use()）。
 *
 * - fetcher 每次依赖变化时重新执行；cancelled 竞态保护避免卸载后 setState
 * - 请求失败静默保持 data 为 undefined，由调用方展示空态/错误态
 *
 * @example
 * const { data: workspaces } = useApi(listWorkspaces, []);
 * const { data: agents } = useApi(() => listAgents(wsId), [wsId]);
 */
export const useApi = <T>(fetcher: () => Promise<T>, deps: unknown[]) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        // 静默失败：保持 data 为空，调用方展示空态
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
};
