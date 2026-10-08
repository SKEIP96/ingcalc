import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ToastTone = "ok" | "error";
type ToastItem = { id: number; tone: ToastTone; text: string };
type ToastApi = { success: (text: string) => void; error: (text: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const push = useCallback((tone: ToastTone, text: string) => {
    setToast({ id: Date.now(), tone, text });
  }, []);

  const success = useCallback((text: string) => push("ok", text), [push]);
  const error = useCallback((text: string) => push("error", text), [push]);
  const value = useMemo(() => ({ success, error }), [success, error]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="toast no-print" role={toast.tone === "error" ? "alert" : "status"}>
          {toast.text}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("Notificările nu sunt disponibile.");
  return context;
}
