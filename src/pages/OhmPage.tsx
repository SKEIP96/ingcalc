import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OHM_PAIRS, ohmLabel, ohmUnit, solveOhmFromText, type OhmSymbol } from "../calc/ohm.ts";
import { OhmCircuit } from "../components/diagrams.tsx";
import { ActionBar, Field, Panel, ResultList } from "../components/ui.tsx";
import { useI18n } from "../context/LanguageContext.tsx";
import { useReportActions } from "../hooks/useReportActions.ts";
import { useSavedResult } from "../hooks/useSavedResult.ts";
import { fieldSignature, formatNumber, isResultStale } from "../lib/numbers.ts";
import { line, type ReportModel } from "../lib/report.ts";

type OhmRaw = Record<OhmSymbol, string>;
const EMPTY: OhmRaw = { U: "", I: "", R: "", P: "" };
const SYMBOLS: OhmSymbol[] = ["U", "I", "R", "P"];

function asSymbol(value: string | null): OhmSymbol | null {
  return SYMBOLS.find((item) => item === value) ?? null;
}

export function OhmPage() {
  const { locale, m } = useI18n();
  const [params] = useSearchParams();
  const query = params.toString();
  const [pair, setPair] = useState<[OhmSymbol, OhmSymbol]>(["U", "R"]);
  const [raw, setRaw] = useState<OhmRaw>(EMPTY);
  const { saved, error, commit, fail, clear } = useSavedResult<Exclude<ReturnType<typeof solveOhmFromText>, { ok: false }>>();
  const signature = fieldSignature([locale, pair[0], pair[1], raw[pair[0]], raw[pair[1]]]);
  const stale = isResultStale(saved?.signature ?? null, signature);
  const result = saved?.result ?? null;
  const hints: Record<OhmSymbol, string> = { U: m.hintU, I: m.hintI, R: m.hintR, P: m.hintP };

  useEffect(() => {
    const search = new URLSearchParams(query);
    if (search.get("autorun") !== "1") return;
    const a = asSymbol(search.get("a"));
    const b = asSymbol(search.get("b"));
    if (!a || !b || a === b) return;
    const next: OhmRaw = {
      U: search.get("U") ?? "",
      I: search.get("I") ?? "",
      R: search.get("R") ?? "",
      P: search.get("P") ?? "",
    };
    setPair([a, b]);
    setRaw(next);
    const outcome = solveOhmFromText(a, next[a], b, next[b], locale);
    if (outcome.ok) commit(outcome, fieldSignature([locale, a, b, next[a], next[b]]));
    else fail(outcome.message);
  }, [commit, fail, locale, query]);

  function calculate() {
    const outcome = solveOhmFromText(pair[0], raw[pair[0]], pair[1], raw[pair[1]], locale);
    if (!outcome.ok) {
      fail(outcome.message);
      return;
    }
    commit(outcome, signature);
  }

  const report = useMemo<ReportModel | null>(() => {
    if (!result) return null;
    return {
      calculatorId: "ohm",
      calculatorName: m.navOhm,
      calculatedAt: saved?.at ?? new Date().toISOString(),
      inputs: [
        line(m.knownPair, `${pair[0]} ${m.and} ${pair[1]}`),
        line(ohmLabel(pair[0], locale), formatNumber(result[pair[0]]), ohmUnit(pair[0])),
        line(ohmLabel(pair[1], locale), formatNumber(result[pair[1]]), ohmUnit(pair[1])),
      ],
      results: SYMBOLS.map((symbol) => line(ohmLabel(symbol, locale), formatNumber(result[symbol]), ohmUnit(symbol))),
      formulas: result.formulas,
      steps: result.steps,
      notes: [m.ohmNote],
    };
  }, [locale, m, pair, result, saved?.at]);

  const actions = useReportActions(report, Boolean(result) && !stale);

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        calculate();
      }}
    >
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{m.navOhm}</h1>
        <p className="lede">{m.ohmLede}</p>
      </header>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={m.inputs}>
          <div className="grid gap-4">
            <div className="seg" role="radiogroup" aria-label={m.knownPair}>
              {OHM_PAIRS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={pair[0] === item.a && pair[1] === item.b}
                  onClick={() => setPair([item.a, item.b])}
                >
                  {item.a} {m.and} {item.b}
                </button>
              ))}
            </div>
            <Field id="ohm-a" label={ohmLabel(pair[0], locale)} unit={ohmUnit(pair[0])} hint={hints[pair[0]]} value={raw[pair[0]]} placeholder="220" onChange={(value) => setRaw((current) => ({ ...current, [pair[0]]: value }))} />
            <Field id="ohm-b" label={ohmLabel(pair[1], locale)} unit={ohmUnit(pair[1])} hint={hints[pair[1]]} value={raw[pair[1]]} placeholder="110" onChange={(value) => setRaw((current) => ({ ...current, [pair[1]]: value }))} />
            {error ? <p className="alert alert-error">{error}</p> : null}
            <ActionBar showCalculate canExport={Boolean(result) && !stale} onReset={() => { setPair(["U", "R"]); setRaw(EMPTY); clear(); }} onSave={actions.save} onCopy={actions.copy} onPdf={actions.pdf} />
          </div>
        </Panel>
        <div className="grid gap-4">
          <Panel title={m.results}>
            {result ? (
              <ResultList
                stale={stale}
                rows={SYMBOLS.map((symbol) => ({ label: ohmLabel(symbol, locale), value: formatNumber(result[symbol]), unit: ohmUnit(symbol) }))}
              />
            ) : (
              <p className="lede">{m.ohmEmpty}</p>
            )}
          </Panel>
          <Panel title={m.ohmScheme}>
            <OhmCircuit
              voltage={result ? `${formatNumber(result.U)} V` : "—"}
              current={result ? `${formatNumber(result.I)} A` : "—"}
              resistance={result ? `${formatNumber(result.R)} Ω` : "—"}
              power={result ? `${formatNumber(result.P)} W` : "—"}
              dimmed={stale}
            />
          </Panel>
        </div>
      </div>
      {result ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title={m.formulas}>
            <ul className="formula-list">{result.formulas.map((formula) => <li key={formula}><code>{formula}</code></li>)}</ul>
          </Panel>
          <Panel title={m.steps}>
            <ol className="step-list">{result.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </Panel>
        </div>
      ) : null}
    </form>
  );
}
