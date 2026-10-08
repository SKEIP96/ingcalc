import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  annualFromMonthly,
  describeSavings,
  energyCost,
  readTariff,
  summarizeAppliances,
} from "../calc/energy.ts";
import { ConsumptionCharts, ScenarioChart } from "../components/charts.tsx";
import { ActionBar, Field, Panel, ResultList, Segmented } from "../components/ui.tsx";
import { useI18n } from "../context/LanguageContext.tsx";
import { useReportActions } from "../hooks/useReportActions.ts";
import { useToast } from "../context/ToastContext.tsx";
import { createId } from "../lib/history.ts";
import { toCsv } from "../lib/csv.ts";
import { downloadText } from "../lib/csv.ts";
import {
  DEMO_TARIFF,
  blankAppliance,
  controlAppliance,
  demoAppliances,
  readEnergyState,
  writeEnergyState,
  type ApplianceDraft,
  type EnergyState,
} from "../lib/energyStore.ts";
import { formatNumber } from "../lib/numbers.ts";
import { line, type ReportModel } from "../lib/report.ts";

function loadState(): EnergyState {
  try {
    if (typeof localStorage === "undefined") return readEnergyState({ getItem: () => null, setItem() {}, removeItem() {} });
    return readEnergyState(localStorage);
  } catch {
    return readEnergyState({ getItem: () => null, setItem() {}, removeItem() {} });
  }
}

export function EnergyPage() {
  const { locale, m } = useI18n();
  const [params] = useSearchParams();
  const query = params.toString();
  const toast = useToast();
  const [state, setState] = useState<EnergyState>(loadState);
  const activeItems = state.scenario === "A" ? state.A : state.B;
  const summaryA = useMemo(() => summarizeAppliances(state.A, locale), [locale, state.A]);
  const summaryB = useMemo(() => summarizeAppliances(state.B, locale), [locale, state.B]);
  const tariff = useMemo(() => readTariff(state.tariff, locale), [locale, state.tariff]);
  const active = state.scenario === "A" ? summaryA : summaryB;

  useEffect(() => {
    if (!writeEnergyState(localStorage, state)) toast.error(m.energySaveFailed);
  }, [m.energySaveFailed, state, toast]);

  useEffect(() => {
    const search = new URLSearchParams(query);
    if (search.get("autorun") !== "1") return;
    if (search.get("demo") === "set") {
      setState((current) => ({ ...current, scenario: "A", A: demoAppliances(locale), tariff: DEMO_TARIFF, tariffIsDemo: true }));
      return;
    }
    setState((current) => ({ ...current, scenario: "A", A: [controlAppliance(locale)], tariff: "", tariffIsDemo: false }));
  }, [locale, query]);

  function updateItem(id: string, patch: Partial<ApplianceDraft>) {
    setState((current) => ({
      ...current,
      [current.scenario]: (current.scenario === "A" ? current.A : current.B).map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  }

  const ready = active.ok && active.appliances.length > 0 && tariff.ok;
  const monthly = active.ok ? active.monthlyKwh : 0;
  const annual = active.ok ? active.annualKwh : 0;
  const cost = ready && tariff.ok && tariff.value !== null ? energyCost(monthly, tariff.value) : null;
  const annualCost = cost === null ? null : energyCost(annual, tariff.ok && tariff.value !== null ? tariff.value : 0);

  const report = useMemo<ReportModel | null>(() => {
    if (!ready || !active.ok || !tariff.ok) return null;
    const savings = summaryA.ok && summaryB.ok && summaryA.appliances.length > 0 && summaryB.appliances.length > 0
      ? describeSavings(summaryA.monthlyKwh, summaryB.monthlyKwh, tariff.value, locale)
      : null;
    return {
      calculatorId: "energy",
      calculatorName: m.navEnergy,
      calculatedAt: new Date().toISOString(),
      inputs: [
        line(m.activeScenario, state.scenario),
        line(m.tariff, tariff.value === null ? m.tariffMissing : formatNumber(tariff.value), tariff.value === null ? "" : "MDL/kWh"),
        ...active.appliances.flatMap((item) => [
          line(`${item.name} — ${m.powerW}`, formatNumber(item.powerW), "W"),
          line(`${item.name} — ${m.qtyShort}`, formatNumber(item.quantity)),
          line(`${item.name} — ${m.hoursShort}`, formatNumber(item.hoursPerDay), "h"),
          line(`${item.name} — ${m.daysShort}`, formatNumber(item.daysPerMonth)),
        ]),
      ],
      results: [
        line(m.monthly, formatNumber(monthly), "kWh"),
        line(m.annual, formatNumber(annual), "kWh"),
        ...(cost === null ? [] : [line(m.monthlyCost, formatNumber(cost), "MDL")]),
        ...(annualCost === null ? [] : [line(m.annualCost, formatNumber(annualCost), "MDL")]),
      ],
      formulas: active.formulas,
      steps: [...active.steps, ...(savings ? [savings.text] : [])],
      notes: [
        m.annualAssumption,
        ...(state.tariffIsDemo ? [m.demoTariffNote] : []),
        m.noTariffNote,
      ],
    };
  }, [active, annual, annualCost, cost, locale, m, monthly, ready, state.scenario, state.tariffIsDemo, summaryA, summaryB, tariff]);

  const actions = useReportActions(report, ready);

  function exportCsv() {
    if (!active.ok || !tariff.ok) return;
    const rows = [
      [m.device, `${m.ratedPower} (W)`, m.quantity, m.hoursShort, m.daysShort, "E (kWh)"],
      ...active.appliances.map((item) => [
        item.name,
        formatNumber(item.powerW),
        formatNumber(item.quantity),
        formatNumber(item.hoursPerDay),
        formatNumber(item.daysPerMonth),
        formatNumber(item.kwh),
      ]),
      [],
      [`${m.monthly} (kWh)`, formatNumber(monthly)],
      [`${m.annual} (kWh)`, formatNumber(annual)],
      [`${m.tariff} (MDL/kWh)`, tariff.value === null ? "" : formatNumber(tariff.value)],
      [`${m.monthlyCost} (MDL)`, cost === null ? "" : formatNumber(cost)],
    ];
    if (state.tariffIsDemo) rows.push([m.observation, m.csvNote]);
    downloadText("electrolab-consum.csv", toCsv(rows), "text/csv;charset=utf-8");
  }

  const savings = summaryA.ok && summaryB.ok && tariff.ok && summaryA.appliances.length > 0 && summaryB.appliances.length > 0
    ? describeSavings(summaryA.monthlyKwh, summaryB.monthlyKwh, tariff.value, locale)
    : null;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{m.navEnergy}</h1>
        <p className="lede">{m.energyLede}</p>
      </header>
      {state.tariffIsDemo ? (
        <p className="alert alert-warn">{m.demoTariff}</p>
      ) : null}
      <Panel title={m.scenarios}>
        <div className="grid gap-4">
          <Segmented label={m.scenario} value={state.scenario} onChange={(scenario) => setState((current) => ({ ...current, scenario }))} options={[{ value: "A", label: m.scenarioA }, { value: "B", label: m.scenarioB }]} />
          <Field id="tariff" label={m.tariff} unit="MDL/kWh" hint={m.hintTariff} value={state.tariff} placeholder={m.tariffPlaceholder} onChange={(tariff) => setState((current) => ({ ...current, tariff, tariffIsDemo: false }))} />
          {!tariff.ok ? <p className="alert alert-error">{tariff.message}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" type="button" onClick={() => setState((current) => ({ ...current, [current.scenario]: [...activeItems, blankAppliance()] }))}><Plus size={16} aria-hidden="true" /> {m.addDevice}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setState((current) => ({ ...current, scenario: "A", A: [controlAppliance(locale)], tariffIsDemo: false, tariff: "" }))}>{m.example1000}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setState((current) => ({ ...current, scenario: "A", A: demoAppliances(locale), tariff: DEMO_TARIFF, tariffIsDemo: true }))}>{m.demoSet}</button>
            <button className="btn btn-ghost" type="button" onClick={() => setState((current) => ({ ...current, B: current.A.map((item) => ({ ...item, id: createId() })) }))}>{m.copyAtoB}</button>
          </div>
        </div>
      </Panel>
      <div className="grid gap-4">
        {activeItems.map((item, index) => (
          <article key={item.id} className="panel grid gap-3 p-4 md:grid-cols-2">
            <Field id={`${item.id}-name`} label={`${m.deviceName} ${index + 1}`} inputMode="text" value={item.name} onChange={(name) => updateItem(item.id, { name })} />
            <Field id={`${item.id}-power`} label={m.ratedPower} unit="W" value={item.power} onChange={(power) => updateItem(item.id, { power })} />
            <Field id={`${item.id}-qty`} label={m.quantity} hint={m.hintQty} value={item.quantity} onChange={(quantity) => updateItem(item.id, { quantity })} />
            <Field id={`${item.id}-hours`} label={m.hours} unit="h" hint={m.hintHours} value={item.hours} onChange={(hours) => updateItem(item.id, { hours })} />
            <Field id={`${item.id}-days`} label={m.days} hint={m.hintDays} value={item.days} onChange={(days) => updateItem(item.id, { days })} />
            <div className="flex items-end">
              <button className="btn btn-danger" type="button" onClick={() => setState((current) => {
                const key = current.scenario;
                const next = (key === "A" ? current.A : current.B).filter((row) => row.id !== item.id);
                return { ...current, [key]: next.length > 0 ? next : [blankAppliance()] };
              })}>{m.delete}</button>
            </div>
          </article>
        ))}
      </div>
      {!active.ok ? <p className="alert alert-error">{active.message}</p> : null}
      {active.ok && active.appliances.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title={`${m.energyResults} ${state.scenario}`}>
            <ResultList
              stale={false}
              rows={[
                { label: m.monthly, value: formatNumber(monthly), unit: "kWh" },
                { label: m.annual, value: formatNumber(annualFromMonthly(monthly)), unit: "kWh" },
                { label: m.monthlyCost, value: cost === null ? "—" : formatNumber(cost), unit: cost === null ? m.enterTariff : "MDL" },
              ]}
            />
            <p className="lede mt-3">{m.annualNote}</p>
          </Panel>
          <Panel title={m.resultTable}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>{m.device}</th><th>P</th><th>n</th><th>h</th><th>d</th><th>E</th></tr>
                </thead>
                <tbody>
                  {active.appliances.map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td>{item.name}</td>
                      <td>{formatNumber(item.powerW)} W</td>
                      <td>{formatNumber(item.quantity)}</td>
                      <td>{formatNumber(item.hoursPerDay)}</td>
                      <td>{formatNumber(item.daysPerMonth)}</td>
                      <td>{formatNumber(item.kwh)} kWh</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : <p className="lede">{m.addDeviceHint}</p>}
      {active.ok && active.appliances.some((item) => item.kwh > 0) ? (
        <Panel title={m.charts}>
          <ConsumptionCharts items={active.appliances.map((item) => ({ name: item.name, kwh: item.kwh }))} />
        </Panel>
      ) : null}
      {summaryA.ok && summaryB.ok && tariff.ok && savings ? (
        <Panel title={m.compare}>
          <ScenarioChart a={summaryA.monthlyKwh} b={summaryB.monthlyKwh} />
          <p className="mt-3">{savings.text}</p>
        </Panel>
      ) : null}
      <ActionBar showCalculate={false} canExport={ready} onReset={() => setState((current) => ({ ...current, tariff: "", tariffIsDemo: false, [current.scenario]: [blankAppliance()] }))} onSave={actions.save} onCopy={actions.copy} onPdf={actions.pdf} onCsv={exportCsv} />
    </div>
  );
}
