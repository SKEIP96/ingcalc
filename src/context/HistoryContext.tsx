import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { appendHistory, clearHistory, createId, readHistory, removeHistory, type HistoryEntry } from "../lib/history.ts";
import type { ReportModel } from "../lib/report.ts";

type HistoryApi = {
  entries: HistoryEntry[];
  add: (report: ReportModel) => boolean;
  remove: (id: string) => boolean;
  clear: () => boolean;
};

const HistoryContext = createContext<HistoryApi | null>(null);

function browserStore() {
  return localStorage;
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => {
    try {
      if (typeof localStorage === "undefined") return [];
      return readHistory(localStorage);
    } catch {
      return [];
    }
  });

  const add = useCallback((report: ReportModel) => {
    const entry: HistoryEntry = {
      id: createId(),
      createdAt: report.calculatedAt,
      calculatorId: report.calculatorId,
      calculatorName: report.calculatorName,
      inputs: report.inputs,
      results: report.results,
      formulas: report.formulas,
      steps: report.steps,
      notes: report.notes,
    };
    try {
      const next = appendHistory(browserStore(), entry);
      if (!next) return false;
      setEntries(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  const remove = useCallback((id: string) => {
    try {
      const next = removeHistory(browserStore(), id);
      if (!next) return false;
      setEntries(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clear = useCallback(() => {
    try {
      if (!clearHistory(browserStore())) return false;
      setEntries([]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(() => ({ entries, add, remove, clear }), [entries, add, remove, clear]);
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error("Istoricul nu este disponibil.");
  return context;
}
