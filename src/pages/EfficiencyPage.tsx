import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fromWatts, solveEfficiencyFromText, type EfficiencyMode, type PowerUnit } from "../calc/efficiency.ts";
import { LossChart } from "../components/charts.tsx";
import { EfficiencyDiagram } from "../components/diagrams.tsx";
import { ActionBar, Field, Panel, ResultList, Segmented } from "../components/ui.tsx";
import { useI18n } from "../context/LanguageContext.tsx";
import { useReportActions } from "../hooks/useReportActions.ts";
import { useSavedResult } from "../hooks/useSavedResult.ts";
import { fieldSignature, formatNumber, isResultStale } from "../lib/numbers.ts";
import { line, type ReportModel } from "../lib/report.ts";

type EfficiencyResult = Exclude<ReturnType<typeof solveEfficiencyFromText>, { ok: false }>;

export function EfficiencyPage() {
  const { locale, m } = useI18n();
  const [params] = useSearchParams();
  const query = params.toString();
  const [mode, setMode] = useState<EfficiencyMode>("powers");
  const [unit, setUnit] = useState<PowerUnit>("W");
  const [pin, setPin] = useState("");
  const [pout, setPout] = useState("");
  const [eta, setEta] = useState("");
  const { saved, error, commit, fail, clear } = useSavedResult<EfficiencyResult>();
  const signature = fieldSignature([locale, mode, unit, pin, pout, eta]);
  const stale = isResultStale(saved?.signature ?? null, signature);
  const result = saved?.result ?? null;

  useEffect(() => {
    const search = new URLSearchParams(query);
    if (search.get("autorun") !== "1") return;
    const nextMode = search.get("mode") === "efficiency" ? "efficiency" : "powers";
    const nextUnit = search.get("unit") === "kW" ? "kW" : "W";
    const next = { pin: search.get("pin") ?? "", pout: search.get("pout") ?? "", eta: search.get("eta") ?? "" };
    setMode(nextMode);
    setUnit(nextUnit);
    setPin(next.pin);
    setPout(next.pout);
    setEta(next.eta);
    const outcome = solveEfficiencyFromText({ mode: nextMode, unit: nextUnit, ...next, locale });
    if (outcome.ok) commit(outcome, fieldSignature([locale, nextMode, nextUnit, next.pin, next.pout, next.eta]));
    else fail(outcome.message);
  }, [commit, fail, locale, query]);

  function calculate() {
    const outcome = solveEfficiencyFromText({ mode, unit, pin, pout, eta, locale });
    if (!outcome.ok) {
      fail(outcome.message);
      return;
    }
    commit(outcome, signature);
  }

  const report = useMemo<ReportModel | null>(() => {
    if (!result) return null;
    return {
      calculatorId: "efficiency",
      calculatorName: m.navEfficiency,
      calculatedAt: saved?.at ?? new Date().toISOString(),
      inputs: mode === "powers"
        ? [line(m.pin, pin, unit), line(m.useful, pout, unit)]
        : [line(m.pin, pin, unit), line(m.eta, eta, "%")],
      results: [
        line(m.eta, formatNumber(result.etaPercent), "%"),
        line(m.pin, formatNumber(fromWatts(result.pinW, unit)), unit),
        line(m.useful, formatNumber(fromWatts(result.poutW, unit)), unit),
        line(m.losses, formatNumber(fromWatts(result.lossW, unit)), unit),
        line(m.pin, formatNumber(result.pinW), "W"),
        line(m.useful, formatNumber(result.poutW), "W"),
        line(m.losses, formatNumber(result.lossW), "W"),
      ],
      formulas: result.formulas,
      steps: result.steps,
      notes: result.notes,
    };
  }, [eta, locale, m, mode, pin, pout, result, saved?.at, unit]);

  const actions = useReportActions(report, Boolean(result) && !stale);

  return (
    <form className="grid gap-6" onSubmit={(event) => { event.preventDefault(); calculate(); }}>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{m.navEfficiency}</h1>
        <p className="lede">{m.effLede}</p>
      </header>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={m.inputs}>
          <div className="grid gap-4">
            <Segmented label={m.solveMode} value={mode} onChange={setMode} options={[{ value: "powers", label: m.fromPowers }, { value: "efficiency", label: m.fromEta }]} />
            <Segmented label={m.unit} value={unit} onChange={setUnit} options={[{ value: "W", label: "W" }, { value: "kW", label: "kW" }]} />
            <Field id="eff-pin" label={m.pin} unit={unit} hint={m.hintPin} value={pin} placeholder="1000" onChange={setPin} />
            {mode === "powers" ? (
              <Field id="eff-pout" label={m.pout} unit={unit} hint={m.hintPout} value={pout} placeholder="850" onChange={setPout} />
            ) : (
              <Field id="eff-eta" label={m.eta} unit="%" hint={m.hintEta} value={eta} placeholder="85" onChange={setEta} />
            )}
            {error ? <p className="alert alert-error">{error}</p> : null}
            <ActionBar
              canExport={Boolean(result) && !stale}
              onReset={() => { setMode("powers"); setUnit("W"); setPin(""); setPout(""); setEta(""); clear(); }}
              onSave={actions.save}
              onCopy={actions.copy}
              onPdf={actions.pdf}
            />
          </div>
        </Panel>
        <div className="grid gap-4">
          <Panel title={m.results}>
            {result ? (
              <ResultList
                stale={stale}
                rows={[
                  { label: m.eta, value: formatNumber(result.etaPercent), unit: "%" },
                  { label: m.useful, value: formatNumber(fromWatts(result.poutW, unit)), unit },
                  { label: m.losses, value: formatNumber(fromWatts(result.lossW, unit)), unit },
                ]}
              />
            ) : <p className="lede">{m.effEmpty}</p>}
          </Panel>
          <Panel title={m.distribution}>
            <EfficiencyDiagram eta={result?.etaPercent ?? null} useful={result?.poutW ?? 0} loss={result?.lossW ?? 0} />
            {result ? <LossChart useful={result.poutW} loss={result.lossW} /> : null}
          </Panel>
        </div>
      </div>
      {result ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={m.formulas}><ul className="formula-list">{result.formulas.map((formula) => <li key={formula}><code>{formula}</code></li>)}</ul></Panel>
          <Panel title={m.solution}><ol className="step-list">{result.steps.map((step) => <li key={step}>{step}</li>)}</ol></Panel>
        </div>
      ) : null}
    </form>
  );
}
