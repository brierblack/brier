import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * hook 内部状态流转一律用 unknown，对外精确类型由重载签名提供。
 * 唯一例外：AnyFetcher 必须用 any（函数参数逆变，unknown 无法被具体签名接受），
 * 且只出现在签名 / ref 边界，不外泄。
 */

/** 剥离 fetcher 参数表末尾可选的 RequestInit——该位置由 hook 注入 { signal } */
type DropOptionalInit<P extends unknown[]> = P extends [...infer Rest, init?: RequestInit]
  ? Rest
  : P;

/** 任意异步请求函数：多参 API 函数或单 init 闭包 */
type AnyFetcher = (...args: any[]) => Promise<unknown>;

type ParamsOf<F extends AnyFetcher> = DropOptionalInit<Parameters<F>>;

/** 参数元组每项允许 undefined：未就绪（路由参数/当前空间未加载）时自动跳过请求 */
type WithUndefined<P extends unknown[]> = { [K in keyof P]: P[K] | undefined };

/** 主动取消（abort）不算错误，不应写入 error */
const isAbortError = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError';

interface UseRequestResult<P, Params extends unknown[]> {
  data: P | null;
  loading: boolean;
  error: Error | null;
  /** 手动重取，参数与 fetcherParams 一致 */
  run: (...args: Params) => Promise<void>;
}

/**
 * 数据获取 hook：自动请求 + 自动取消 + 手动刷新。
 *
 * 触发与重取：
 * - mount 后自动请求一次；
 * - fetcherParams 逐项比较（Object.is），任一值变化自动重取；含 undefined 视为未就绪，
 *   自动跳过，值就绪后再次触发；
 * - 事件驱动刷新（删除/保存/SSE 后）调用 run(...)。
 *
 * fetcherParams 使用注意：
 * - 传入稳定的基础类型值（string / number / boolean）；
 * - 对象 / 数组等引用类型需调用方自行持久化（useMemo 或模块级常量）保证引用稳定，
 *   否则每次渲染引用变化都会触发不必要的重复请求。
 *
 * 取消与错误：每次请求的 init（含 signal）由 hook 内部注入；卸载或发起新请求会自动
 * 取消在飞请求，过期结果不回写状态，主动取消不会置 error。
 *
 * 用法：
 *   useRequest(getTeam, [wsId, teamId])                 // 直传 API 函数 + 参数
 *   useRequest(listWorkComputers, [])                   // 零参接口
 *   useRequest((init) => listAgents(wsId, init), [])    // 自定义请求逻辑（闭包）
 */
export function useRequest<P>(
  fetcher: (init?: RequestInit) => Promise<P>,
  fetcherParams: [],
): UseRequestResult<P, []>;
export function useRequest<F extends AnyFetcher>(
  fetcher: F,
  fetcherParams: WithUndefined<ParamsOf<F>>,
): UseRequestResult<Awaited<ReturnType<F>>, WithUndefined<ParamsOf<F>>>;
export function useRequest(fetcher: AnyFetcher, fetcherParams: unknown[] = []) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef<AnyFetcher>(fetcher);
  const abortControllerRef = useRef<AbortController>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const run = useCallback(async (...params: unknown[]) => {
    // 取消在飞请求，防止过期结果回写
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const result = await fetcherRef.current(...params, { signal: controller.signal });
      if (abortControllerRef.current.signal.aborted) return; // 已被更新的请求取代
      setData(result);
    } catch (e: unknown) {
      if (abortControllerRef.current.signal.aborted) return; // 过期请求的失败，忽略
      if (isAbortError(e)) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (!abortControllerRef.current.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    run(...fetcherParams);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [run, ...fetcherParams]);

  return {
    data,
    loading,
    error,
    run,
  };
}
