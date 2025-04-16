import { useState, useCallback } from 'react';

type Options<T, P> = {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  debounceTime?: number;
};

export function usePostRequest<T = any, P = any>(
  requestFn: (params: P) => Promise<{ data: T }>,
  options?: Options<T, P>
) {
  const [loading, setLoading] = useState(false);
  const [lastCalled, setLastCalled] = useState<number>(0);

  const run = useCallback(
    async (params: P) => {
      const now = Date.now();
      const debounceGap = options?.debounceTime || 1000;
      if (loading || now - lastCalled < debounceGap) return;

      setLoading(true);
      setLastCalled(now);

      try {
        const res = await requestFn(params);
        options?.onSuccess?.(res.data);
      } catch (err:any) {
        options?.onError?.(err);
      } finally {
        setLoading(false);
      }
    },
    [requestFn, options, loading, lastCalled]
  );

  return {
    run,
    loading,
  };
}
