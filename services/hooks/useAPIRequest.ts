// src/services/hooks/useApiRequest.ts
import { useState, useCallback } from 'react';

type Options<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  debounceTime?: number;
};

export function useApiRequest<T>(
  requestFn: () => Promise<{ data: T }>,
  options?: Options<T>
) {
  const [loading, setLoading] = useState(false);
  const [lastCalled, setLastCalled] = useState<number>(0);

  const run = useCallback(async () => {
    const now = Date.now();
    const debounceGap = options?.debounceTime || 1000;
    if (loading || now - lastCalled < debounceGap) return;

    setLoading(true);
    setLastCalled(now);

    try {
      const res = await requestFn();
      options?.onSuccess?.(res.data);
    } catch (err: any) {
      console.error('❌ API 请求失败:', err);
      options?.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [requestFn, options, loading, lastCalled]);

  return { run, loading };
}
