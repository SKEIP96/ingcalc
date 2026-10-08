import { useCallback, useState } from "react";

export function useSavedResult<T>() {
  const [saved, setSaved] = useState<{ result: T; signature: string; at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback((result: T, signature: string) => {
    setSaved({ result, signature, at: new Date().toISOString() });
    setError(null);
  }, []);

  const fail = useCallback((message: string) => {
    setSaved(null);
    setError(message);
  }, []);

  const clear = useCallback(() => {
    setSaved(null);
    setError(null);
  }, []);

  return { saved, error, commit, fail, clear };
}
