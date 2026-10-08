import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { solveResistanceFromText, type Connection } from "../calc/resistance.ts";
import { ResistanceScheme } from "../components/diagrams.tsx";
import { ActionBar, Field, Panel, ResultList, Segmented } from "../components/ui.tsx";
import { useI18n } from "../context/LanguageContext.tsx";
import { useReportActions } from "../hooks/useReportActions.ts";
import { createId } from "../lib/history.ts";
import { formatNumber } from "../lib/numbers.ts";
import { line, type ReportModel } from "../lib/report.ts";

type Resistor = { id: string; value: string };

function makeResistor(value = ""): Resistor {
  return { id: createId(), value };
}

export function ResistancePage() {
  const { locale, m } = useI18n();
  const [params] = useSearchParams();
  const query = params.toString();
  const [mode, setMode] = useState<Connection>("serie");
  const [items, setItems] = useState<Resistor[]>([makeResistor(), makeResistor()]);
  const [voltage, setVoltage] = useState("");
  const outcome = useMemo(
    () => solveResistanceFromText(mode, items.map((item) => item.value), voltage, locale),
    [items, locale, mode, voltage],
  );

  useEffect(() => {
    const search = new URLSearchParams(query);
    if (search.get("autorun") !== "1") return;
    const nextMode = search.get("mode") === "paralel" ? "paralel" : "serie";
    const parts = (search.get("r") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    setMode(nextMode);
    setItems((parts.length >= 2 ? parts : ["", ""]).slice(0, 12).map((value) => makeResistor(value)));
    setVoltage(search.get("U") ?? "");
  }, [query]);

  const started = items.some((item) => item.value.trim() !== "") || voltage.trim() !== "";
  const report = useMemo<ReportModel | null>(() => {
    if (!outcome.ok) return null;
    const notes = [...outcome.notes];
    if (outcome.currentIssue) notes.push(outcome.currentIssue);
    return {
      calculatorId: "resistance",
      calculatorName: m.navResistance,
      calculatedAt: new Date().toISOString(),
      inputs: [
        line(m.connection, mode === "serie" ? m.seriesWord : m.parallelWord),
        ...outcome.resistances.map((value, index) => line(`R${index + 1}`, formatNumber(value), "Ω")),
        ...(outcome.voltage === null ? [] : [line(m.voltage, formatNumber(outcome.voltage), "V")]),
      ],
      results: [
        line(m.req, formatNumber(outcome.req), "Ω"),
        ...(outcome.current === null ? [] : [line(m.totalCurrent, formatNumber(outcome.current), "A")]),
      ],
      formulas: outcome.formulas,
      steps: outcome.steps,
      notes,
    };
  }, [locale, m, mode, outcome]);

  const actions = useReportActions(report, outcome.ok);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{m.navResistance}</h1>
        <p className="lede">{m.resLede}</p>
      </header>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={m.inputs}>
          <div className="grid gap-4">
            <Segmented label={m.connection} value={mode} onChange={setMode} options={[{ value: "serie", label: m.series }, { value: "paralel", label: m.parallel }]} />
            {items.map((item, index) => (
              <div key={item.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Field id={`res-${item.id}`} label={`R${index + 1}`} unit="Ω" value={item.value} placeholder="100" onChange={(value) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, value } : row))} />
                </div>
                <button className="btn btn-danger" type="button" disabled={items.length <= 2} onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}>{m.delete}</button>
              </div>
            ))}
            <button className="btn btn-secondary" type="button" disabled={items.length >= 12} onClick={() => setItems((current) => [...current, makeResistor()])}>{m.addResistor}</button>
            <Field id="res-u" label={m.optionalVoltage} unit="V" hint={m.hintOptionalU} value={voltage} onChange={setVoltage} />
            {started && !outcome.ok ? <p className="alert alert-error">{outcome.message}</p> : null}
            {outcome.ok && outcome.currentIssue ? <p className="alert alert-warn">{outcome.currentIssue}</p> : null}
            <ActionBar
              showCalculate={false}
              canExport={outcome.ok && started}
              onReset={() => { setMode("serie"); setItems([makeResistor(), makeResistor()]); setVoltage(""); }}
              onSave={actions.save}
              onCopy={actions.copy}
              onPdf={actions.pdf}
            />
          </div>
        </Panel>
        <div className="grid content-start gap-4">
          <Panel title={m.printResult}>
            {outcome.ok ? (
              <ResultList
                stale={false}
                rows={[
                  { label: m.req, value: formatNumber(outcome.req), unit: "Ω" },
                  ...(outcome.current === null ? [] : [{ label: m.totalCurrent, value: formatNumber(outcome.current), unit: "A" }]),
                ]}
              />
            ) : <p className="lede">{m.resEmpty}</p>}
          </Panel>
          <Panel title={mode === "serie" ? m.schemeSeries : m.schemeParallel}>
            <ResistanceScheme mode={mode} voltage={voltage} labels={items.map((item, index) => (item.value.trim() ? `R${index + 1}=${item.value}` : `R${index + 1}`))} />
          </Panel>
        </div>
      </div>
      {outcome.ok ? (
        <Panel title={m.substitution}>
          <ol className="step-list">{outcome.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </Panel>
      ) : null}
    </div>
  );
}
