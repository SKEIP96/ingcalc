import { useCallback } from "react";
import { useHistory } from "../context/HistoryContext.tsx";
import { useI18n } from "../context/LanguageContext.tsx";
import { usePrint } from "../context/PrintContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { reportToText, type ReportModel } from "../lib/report.ts";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "true");
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy");
}

export function useReportActions(report: ReportModel | null, enabled: boolean) {
  const history = useHistory();
  const toast = useToast();
  const print = usePrint();
  const { locale, m } = useI18n();

  const save = useCallback(() => {
    if (!report || !enabled) return;
    if (history.add(report)) toast.success(m.saved);
    else toast.error(m.saveFailed);
  }, [enabled, history, m.saveFailed, m.saved, report, toast]);

  const copy = useCallback(() => {
    if (!report || !enabled) return;
    copyText(reportToText(report, locale))
      .then(() => toast.success(m.copied))
      .catch(() => toast.error(m.copyFailed));
  }, [enabled, locale, m.copied, m.copyFailed, report, toast]);

  const pdf = useCallback(() => {
    if (!report || !enabled) return;
    print.open(report);
    toast.success(m.printOpened);
  }, [enabled, m.printOpened, print, report, toast]);

  return { save, copy, pdf };
}
