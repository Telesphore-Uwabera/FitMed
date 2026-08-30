import { useCallback, useRef, useState } from "react";

export function useBusyAction() {
  const busyRef = useRef(new Set<string>());
  const [, setTick] = useState(0);

  const isBusy = useCallback((key: string) => busyRef.current.has(key), []);

  const run = useCallback(async <T,>(key: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (busyRef.current.has(key)) return undefined;
    busyRef.current.add(key);
    setTick((n) => n + 1);
    try {
      return await fn();
    } finally {
      busyRef.current.delete(key);
      setTick((n) => n + 1);
    }
  }, []);

  return { isBusy, run };
}
