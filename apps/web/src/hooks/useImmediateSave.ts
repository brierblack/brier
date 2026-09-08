import { useEffect, useState } from 'react';

/**
 * 详情属性行"切换即保存"：
 * - 本地受控展示 value，随外部 source（agent 真实字段）变化自动同步；
 * - change(next) 乐观更新，onSave 抛错时自动回滚；成功/失败提示由调用方在 onSave 内处理。
 */
export function useImmediateSave<T extends string | number | null>(
  source: T,
  onSave: (next: T) => Promise<void>,
): { value: T; change: (next: T) => void } {
  const [value, setValue] = useState<T>(source);

  useEffect(() => {
    setValue(source);
  }, [source]);

  const change = (next: T) => {
    const prev = value;
    setValue(next);
    onSave(next).catch(() => setValue(prev));
  };

  return { value, change };
}
