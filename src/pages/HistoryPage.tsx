import { useRef, useState } from "react";
import { useHistory } from "../context/HistoryContext.tsx";
import { useI18n } from "../context/LanguageContext.tsx";
import { usePrint } from "../context/PrintContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { toCsv, downloadText } from "../lib/csv.ts";
import type { HistoryEntry } from "../lib/history.ts";
import { formatDateTime } from "../lib/numbers.ts";
import { reportToText, type ReportModel } from "../lib/report.ts";

function toReport(entry: HistoryEntry): ReportModel {
  return {
    calculatorId: entry.calculatorId,
    calculatorName: entry.calculatorName,
    calculatedAt: entry.createdAt,
    inputs: entry.inputs,
    results: entry.results,
    formulas: entry.formulas,
    steps: entry.steps,
    notes: entry.notes,
  };
}

export function HistoryPage() {
  const { locale, m } = useI18n();
  const history = useHistory();
  const print = usePrint();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function exportCsv() {
    const rows = [
      [m.printDate, m.calculator, m.printInputs, m.results, m.formulas],
      ...history.entries.map((entry) => [
        formatDateTime(entry.createdAt, locale),
        entry.calculatorName,
        entry.inputs.map((item) => `${item.label}: ${item.value} ${item.unit}`.trim()).join(" | "),
        entry.results.map((item) => `${item.label}: ${item.value} ${item.unit}`.trim()).join(" | "),
        entry.formulas.join(" | "),
      ]),
    ];
    downloadText("electrolab-istoric.csv", toCsv(rows), "text/csv;charset=utf-8");
  }

  async function copyEntry(entry: HistoryEntry) {
    try {
      await navigator.clipboard.writeText(reportToText(toReport(entry), locale));
      toast.success(m.copied);
    } catch {
      toast.error(m.copyFailedShort);
    }
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{m.navHistory}</h1>
        <p className="lede">{m.historyLede}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-secondary" type="button" onClick={exportCsv} disabled={history.entries.length === 0}>{m.exportCsv}</button>
        <button className="btn btn-danger" type="button" onClick={() => dialogRef.current?.showModal()} disabled={history.entries.length === 0}>{m.clearHistory}</button>
      </div>
      {history.entries.length === 0 ? (
        <section className="panel p-6">
          <p>{m.historyEmpty}</p>
        </section>
      ) : (
        <div className="grid gap-3">
          {history.entries.map((entry) => {
            const open = openId === entry.id;
            return (
              <article key={entry.id} className="panel p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-semibold">{entry.calculatorName}</h2>
                    <p className="lede">{formatDateTime(entry.createdAt, locale)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-secondary" type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : entry.id)}>
                      {open ? m.close : m.details}
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={() => { print.open(toReport(entry)); toast.success(m.printOpened); }}>{m.exportPdf}</button>
                    <button className="btn btn-ghost" type="button" onClick={() => void copyEntry(entry)}>{m.copyResult}</button>
                    <button className="btn btn-danger" type="button" onClick={() => { if (history.remove(entry.id)) toast.success(m.deleted); }}>{m.delete}</button>
                  </div>
                </div>
                {open ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 font-semibold">{m.printInputs}</h3>
                      <ul className="step-list">{entry.inputs.map((item) => <li key={`${entry.id}-${item.label}`}>{item.label}: {item.value} {item.unit}</li>)}</ul>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">{m.results}</h3>
                      <ul className="step-list">{entry.results.map((item) => <li key={`${entry.id}-r-${item.label}-${item.unit}`}>{item.label}: {item.value} {item.unit}</li>)}</ul>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="mb-2 font-semibold">{m.formulas}</h3>
                      <ul className="formula-list">{entry.formulas.map((formula) => <li key={formula}><code>{formula}</code></li>)}</ul>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      <dialog ref={dialogRef} aria-labelledby="clear-title">
        <h2 id="clear-title" className="mb-2 text-xl font-semibold">{m.clearTitle}</h2>
        <p className="lede">{m.clearText}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn btn-secondary" type="button" onClick={() => dialogRef.current?.close()}>{m.cancel}</button>
          <button className="btn btn-danger" type="button" onClick={() => { if (history.clear()) toast.success(m.historyCleared); dialogRef.current?.close(); }}>{m.clearHistory}</button>
        </div>
      </dialog>
    </div>
  );
}
