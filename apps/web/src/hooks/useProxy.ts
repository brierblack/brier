import { useCallback, useMemo, useRef, useState } from 'react';

export const useProxy = <T extends object>(
  object: T,
  callback: (key: keyof T, value: T[keyof T]) => void,
) => {
  const [tick, setTick] = useState(0);
  const callbackRef = useRef<(key: keyof T, value: T[keyof T]) => void>(callback);

  const proxy = useMemo(() => {
    return new Proxy(object, {
      get(_, key) {
        return object[key as keyof T];
      },
      set(_, key, value) {
        object[key as keyof T] = value;
        callbackRef.current(key as keyof T, value);
        return true;
      },
    });
  }, [object]);

  const get = useCallback(
    (key: keyof T) => {
      return proxy[key];
    },
    [proxy, tick],
  );

  const set = useCallback(
    (key: keyof T) => {
      return (value: T[keyof T]) => {
        setTick((prev) => prev + 1);
        proxy[key] = value;
      };
    },
    [proxy],
  );

  return [get, set] as [typeof get, typeof set];
};
