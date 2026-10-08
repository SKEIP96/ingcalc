import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PrintSheet } from "../components/PrintSheet.tsx";
import type { ReportModel } from "../lib/report.ts";

type PrintApi = { open: (report: ReportModel) => void };
const PrintContext = createContext<PrintApi | null>(null);

export function PrintProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<ReportModel | null>(null);
  const open = useCallback((report: ReportModel) => setJob(report), []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    if (!job) return;
    const timer = window.setTimeout(() => window.print(), 80);
    const done = () => setJob(null);
    window.addEventListener("afterprint", done);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [job]);

  return (
    <PrintContext.Provider value={value}>
      {children}
      {job ? <PrintSheet report={job} /> : null}
    </PrintContext.Provider>
  );
}

export function usePrint() {
  const context = useContext(PrintContext);
  if (!context) throw new Error("Exportul PDF nu este disponibil.");
  return context;
}
