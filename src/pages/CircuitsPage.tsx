import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  solveCircuitFromText,
  type CircuitPhase,
  type CircuitSolve,
  type LoadNature,
} from "../calc/circuits.ts";
import { PowerTriangle } from "../components/diagrams.tsx";
import { ActionBar, Field, Panel, ResultList, Segmented } from "../components/ui.tsx";
import { useI18n } from "../context/LanguageContext.tsx";
import { useReportActions } from "../hooks/useReportActions.ts";
import { useSavedResult } from "../hooks/useSavedResult.ts";
import { fieldSignature, formatNumber, isResultStale, parseDecimal } from "../lib/numbers.ts";
import { line, type ReportModel } from "../lib/report.ts";
import type { PowerUnit } from "../calc/efficiency.ts";
import { toWatts } from "../calc/efficiency.ts";

type CircuitResult = Exclude<ReturnType<typeof solveCircuitFromText>, { ok: false }>;

function phaseOf(value: string | null): CircuitPhase {
  return value === "trifazat" ? "trifazat" : "monofazat";
}
function solveOf(value: string | null): CircuitSolve {
  return value === "power" ? "power" : "current";
}
function natureOf(value: string | null): LoadNature {
  return value === "capacitiva" ? "capacitiva" : "inductiva";
}
function unitOf(value: string | null): PowerUnit {
  return value === "kW" ? "kW" : "W";
}
function wattsText(text: string, unit: PowerUnit): string {
  if (unit === "W") return text;
  const parsed = parseDecimal(text);
  if (!parsed.ok) return text;
  return String(toWatts(parsed.value, "kW"));
}

export function CircuitsPage() {
  const { locale, m } = useI18n();
  const [params] = useSearchParams();
  const query = params.toString();
  const [phase, setPhase] = useState<CircuitPhase>("monofazat");
  const [solve, setSolve] = useState<CircuitSolve>("current");
  const [nature, setNature] = useState<LoadNature>("inductiva");
  const [unit, setUnit] = useState<PowerUnit>("W");
  const [voltage, setVoltage] = useState("");
  const [current, setCurrent] = useState("");
  const [power, setPower] = useState("");
  const [cosPhi, setCosPhi] = useState("");
  const { saved, error, commit, fail, clear } = useSavedResult<CircuitResult>();
  const signature = fieldSignature([locale, phase, solve, nature, unit, voltage, current, power, cosPhi]);
  const stale = isResultStale(saved?.signature ?? null, signature);
  const result = saved?.result ?? null;

  useEffect(() => {
    const search = new URLSearchParams(query);
    if (search.get("autorun") !== "1") return;
    const next = {
      phase: phaseOf(search.get("phase")),
      solve: solveOf(search.get("solve")),
      nature: natureOf(search.get("nature")),
      unit: unitOf(search.get("unit")),
      voltage: search.get("U") ?? "",
      current: search.get("I") ?? "",
      power: search.get("P") ?? "",
      cosPhi: search.get("cos") ?? "",
    };
    setPhase(next.phase);
    setSolve(next.solve);
    setNature(next.nature);
    setUnit(next.unit);
    setVoltage(next.voltage);
    setCurrent(next.current);
    setPower(next.power);
    setCosPhi(next.cosPhi);
    const outcome = solveCircuitFromText({
      phase: next.phase,
      nature: next.nature,
      solve: next.solve,
      voltage: next.voltage,
      current: next.current,
      power: wattsText(next.power, next.unit),
      cosPhi: next.cosPhi,
      locale,
    });
    if (outcome.ok) commit(outcome, fieldSignature([locale, next.phase, next.solve, next.nature, next.unit, next.voltage, next.current, next.power, next.cosPhi]));
    else fail(outcome.message);
  }, [commit, fail, locale, query]);

  function calculate() {
    const outcome = solveCircuitFromText({
      phase,
      nature,
      solve,
      voltage,
      current,
      power: wattsText(power, unit),
      cosPhi,
      locale,
    });
    if (!outcome.ok) {
      fail(outcome.message);
      return;
    }
    commit(outcome, signature);
  }

  const report = useMemo<ReportModel | null>(() => {
    if (!result) return null;
    return {
      calculatorId: "circuits",
      calculatorName: m.navCircuits,
      calculatedAt: saved?.at ?? new Date().toISOString(),
      inputs: [
        line(m.regime, phase === "trifazat" ? m.balanced : m.mono),
        line(m.loadKind, nature === "inductiva" ? m.inductive : m.capacitive),
        line(m.voltage, formatNumber(result.U), "V"),
        line(solve === "power" ? m.enteredPower : m.current, solve === "power" ? power + " " + unit : formatNumber(result.I), solve === "power" ? "" : "A"),
        line("cos φ", formatNumber(result.cosPhi)),
      ],
      results: [
        line(`${m.activePowerOut} P`, formatNumber(result.P), "W"),
        line(`${m.activePowerOut} P`, formatNumber(result.P / 1000, 3), "kW"),
        line(`${m.reactivePower} Q`, formatNumber(result.Q), "var"),
        line(`${m.reactivePower} Q`, formatNumber(result.Q / 1000, 3), "kvar"),
        line(`${m.apparentPower} S`, formatNumber(result.S), "VA"),
        line(`${m.apparentPower} S`, formatNumber(result.S / 1000, 3), "kVA"),
        line(m.powerFactor, formatNumber(result.cosPhi)),
        line(m.phaseAngle, formatNumber(result.phiDeg, 2), "°"),
        line(m.currentOut, formatNumber(result.I), "A"),
      ],
      formulas: result.formulas,
      steps: result.steps,
      notes: result.notes,
    };
  }, [locale, m, nature, phase, power, result, saved?.at, solve, unit]);

  const actions = useReportActions(report, Boolean(result) && !stale);

  return (
    <form className="grid gap-6" onSubmit={(event) => { event.preventDefault(); calculate(); }}>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{m.navCircuits}</h1>
        <p className="lede">{m.circuitsLede}</p>
      </header>
      {phase === "trifazat" ? (
        <p className="alert alert-ok">{m.circuitTri}</p>
      ) : (
        <p className="alert alert-ok">{m.circuitMono}</p>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={m.inputs}>
          <div className="grid gap-4">
            <Segmented label={m.regime} value={phase} onChange={setPhase} options={[{ value: "monofazat", label: m.mono }, { value: "trifazat", label: m.tri }]} />
            <Segmented label={m.solveMode} value={solve} onChange={setSolve} options={[{ value: "current", label: m.fromUI }, { value: "power", label: m.fromP }]} />
            <Segmented label={m.loadKind} value={nature} onChange={setNature} options={[{ value: "inductiva", label: m.inductive }, { value: "capacitiva", label: m.capacitive }]} />
            <Field id="circuit-u" label={phase === "trifazat" ? m.lineVoltage : m.voltage} unit="V" hint={m.hintVoltageTri} value={voltage} placeholder="400" onChange={setVoltage} />
            {solve === "current" ? (
              <Field id="circuit-i" label={phase === "trifazat" ? m.lineCurrent : m.current} unit="A" hint={m.hintCurrentTri} value={current} placeholder="10" onChange={setCurrent} />
            ) : (
              <>
                <Segmented label={m.powerUnit} value={unit} onChange={setUnit} options={[{ value: "W", label: "W" }, { value: "kW", label: "kW" }]} />
                <Field id="circuit-p" label={m.activePower} unit={unit} hint={m.hintActivePower} value={power} placeholder="1000" onChange={setPower} />
              </>
            )}
            <Field id="circuit-cos" label={m.powerFactor} hint={m.hintPf} value={cosPhi} placeholder="0,8" onChange={setCosPhi} />
            {error ? <p className="alert alert-error">{error}</p> : null}
            <ActionBar
              canExport={Boolean(result) && !stale}
              onReset={() => { setPhase("monofazat"); setSolve("current"); setNature("inductiva"); setUnit("W"); setVoltage(""); setCurrent(""); setPower(""); setCosPhi(""); clear(); }}
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
                  { label: m.activePowerOut, value: `${formatNumber(result.P)} W`, unit: `${formatNumber(result.P / 1000, 3)} kW` },
                  { label: m.reactivePower, value: `${formatNumber(result.Q)} var`, unit: `${formatNumber(result.Q / 1000, 3)} kvar` },
                  { label: m.apparentPower, value: `${formatNumber(result.S)} VA`, unit: `${formatNumber(result.S / 1000, 3)} kVA` },
                  { label: m.powerFactor, value: formatNumber(result.cosPhi), unit: "" },
                  { label: m.phaseAngle, value: formatNumber(result.phiDeg, 2), unit: "°" },
                  { label: m.currentOut, value: formatNumber(result.I), unit: "A" },
                ]}
              />
            ) : <p className="lede">{m.circuitsEmpty}</p>}
          </Panel>
          <Panel title={m.triangle}>
            <PowerTriangle active={result?.P ?? null} reactive={result?.Q ?? null} apparent={result?.S ?? null} angle={result?.phiDeg ?? null} />
            <p className="lede mt-2">{result ? m.triangleHint : m.triangleEmpty}</p>
          </Panel>
        </div>
      </div>
      {result ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={m.formulas}><ul className="formula-list">{result.formulas.map((formula) => <li key={formula}><code>{formula}</code></li>)}</ul></Panel>
          <Panel title={m.steps}><ol className="step-list">{result.steps.map((step) => <li key={step}>{step}</li>)}</ol></Panel>
        </div>
      ) : null}
    </form>
  );
}
