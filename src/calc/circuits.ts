import { tx, type Locale } from "../i18n/messages.ts";
import { formatNumber } from "../lib/numbers.ts";
import { ensureFinite, ensureNonNegative, failure, readRequired, type CalcFailure } from "./types.ts";

export type CircuitPhase = "monofazat" | "trifazat";
export type LoadNature = "inductiva" | "capacitiva";
export type CircuitSolve = "current" | "power";

export type CircuitSuccess = {
  ok: true;
  code?: undefined;
  phase: CircuitPhase;
  nature: LoadNature;
  U: number;
  I: number;
  cosPhi: number;
  P: number;
  Q: number;
  S: number;
  phiDeg: number;
  formulas: string[];
  steps: string[];
  notes: string[];
};

const SQRT3 = Math.sqrt(3);

function num(value: number): string {
  return formatNumber(value);
}

export function solveCircuit(input: {
  phase: CircuitPhase;
  nature: LoadNature;
  solve: CircuitSolve;
  U: number;
  cosPhi: number;
  I?: number;
  P?: number;
  locale?: Locale;
}): CircuitSuccess | CalcFailure {
  const locale = input.locale ?? "ro";
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const voltage = ensureNonNegative(input.U, locale);
  if (voltage) return voltage;
  const powerFactor = ensureNonNegative(input.cosPhi, locale);
  if (powerFactor) return powerFactor;
  if (input.cosPhi > 1) {
    return failure(
      "out_of_range",
      t(
        "Factorul de putere cos φ trebuie să fie între 0 și 1. Nu introduceți procente: 0,8 înseamnă 80%.",
        "Коэффициент мощности cos φ должен быть от 0 до 1. Не вводите проценты: 0,8 означает 80%.",
      ),
    );
  }

  const notes = [
    input.phase === "trifazat"
      ? t(
          "Formula trifazată presupune o sarcină simetrică (echilibrată) și folosește tensiunea de linie U_L împreună cu curentul de linie I_L.",
          "Трёхфазная формула предполагает симметричную (уравновешенную) нагрузку и использует линейные напряжение U_L и ток I_L.",
        )
      : t(
          "Formula monofazată folosește tensiunea și curentul aceluiași circuit.",
          "Однофазная формула использует напряжение и ток одной и той же цепи.",
        ),
    t(
      "Pentru sarcină inductivă puterea reactivă Q este pozitivă. Pentru sarcină capacitivă Q este negativă.",
      "При индуктивной нагрузке реактивная мощность Q положительна. При ёмкостной нагрузке Q отрицательна.",
    ),
    t(
      "Factorul de putere cos φ este raportul P / S și nu reprezintă randamentul η.",
      "Коэффициент мощности cos φ — это отношение P / S и не является КПД η.",
    ),
  ];

  let current = input.I ?? 0;
  let active = input.P ?? 0;

  if (input.solve === "current") {
    if (input.I === undefined) return failure("empty", t("Introduceți curentul.", "Введите ток."));
    const currentCheck = ensureNonNegative(input.I, locale);
    if (currentCheck) return currentCheck;
    current = input.I;
  } else {
    if (input.P === undefined) return failure("empty", t("Introduceți puterea activă.", "Введите активную мощность."));
    const powerCheck = ensureNonNegative(input.P, locale);
    if (powerCheck) return powerCheck;
    active = input.P;
    if (input.U === 0 || input.cosPhi === 0) {
      if (active === 0) {
        return failure(
          "indeterminate",
          t(
            "Curentul nu este determinat: puterea activă este zero, iar numitorul U × cos φ este zero.",
            "Ток не определён: активная мощность равна нулю, а знаменатель U × cos φ тоже равен нулю.",
          ),
        );
      }
      if (input.cosPhi === 0) {
        return failure("impossible", t("Nu se poate obține putere activă nenulă când cos φ = 0.", "Нельзя получить ненулевую активную мощность при cos φ = 0."));
      }
      return failure("division_by_zero", t("Împărțire la zero: curentul nu poate fi calculat când tensiunea este zero.", "Деление на ноль: ток нельзя рассчитать при нулевом напряжении."));
    }
    current =
      input.phase === "trifazat" ? active / (SQRT3 * input.U * input.cosPhi) : active / (input.U * input.cosPhi);
  }

  const S = input.phase === "trifazat" ? SQRT3 * input.U * current : input.U * current;
  const P = input.solve === "power" ? active : S * input.cosPhi;
  const qAbs = S * Math.sqrt(Math.max(0, 1 - input.cosPhi * input.cosPhi));
  const Q = input.nature === "inductiva" ? qAbs : -qAbs;
  const phiAbs = (Math.acos(Math.min(1, Math.max(0, input.cosPhi))) * 180) / Math.PI;
  const phiDeg = input.nature === "inductiva" ? phiAbs : -phiAbs;

  const overflow = ensureFinite([current, S, P, Q, phiDeg], locale);
  if (overflow) return overflow;

  const formulas =
    input.phase === "trifazat"
      ? ["S = √3 × U_L × I_L", "P = √3 × U_L × I_L × cos φ", "|Q| = S × √(1 − cos² φ)", "φ = ±arccos(cos φ)"]
      : ["S = U × I", "P = U × I × cos φ", "|Q| = S × √(1 − cos² φ)", "φ = ±arccos(cos φ)"];

  if (input.solve === "power") {
    formulas.unshift(input.phase === "trifazat" ? "I_L = P / (√3 × U_L × cos φ)" : "I = P / (U × cos φ)");
  }

  const natureText = input.nature === "inductiva"
    ? t("inductivă", "индуктивная")
    : t("capacitivă", "ёмкостная");
  const steps = [
    input.phase === "trifazat"
      ? t("Regim trifazat echilibrat, mărimi de linie.", "Симметричный трёхфазный режим, линейные величины.")
      : t("Regim monofazat.", "Однофазный режим."),
    t("Sarcină ", "Нагрузка ") + natureText + ", cos φ = " + num(input.cosPhi) + ".",
  ];
  if (input.solve === "power") {
    steps.push(
      input.phase === "trifazat"
        ? "I_L = P / (√3 × U_L × cos φ) = " +
            num(active) +
            " / (√3 × " +
            num(input.U) +
            " × " +
            num(input.cosPhi) +
            ") = " +
            num(current) +
            " A."
        : "I = P / (U × cos φ) = " +
            num(active) +
            " / (" +
            num(input.U) +
            " × " +
            num(input.cosPhi) +
            ") = " +
            num(current) +
            " A.",
    );
  }
  const apparent =
    input.phase === "trifazat"
      ? "S = √3 × " + num(input.U) + " × " + num(current) + " = " + num(S) + " VA."
      : "S = " + num(input.U) + " × " + num(current) + " = " + num(S) + " VA.";
  const activeStep =
    input.phase === "trifazat"
      ? "P = √3 × " +
        num(input.U) +
        " × " +
        num(current) +
        " × " +
        num(input.cosPhi) +
        " = " +
        num(P) +
        " W (" +
        num(P / 1000) +
        " kW)."
      : "P = " +
        num(input.U) +
        " × " +
        num(current) +
        " × " +
        num(input.cosPhi) +
        " = " +
        num(P) +
        " W (" +
        num(P / 1000) +
        " kW).";
  steps.push(
    apparent,
    activeStep,
    "|Q| = " + num(S) + " × √(1 − cos² φ) = " + num(Math.abs(Q)) + " var.",
    "Q = " + num(Q) + t(" var, deoarece sarcina este ", " вар, потому что нагрузка ") + natureText + ".",
    "φ = " + num(phiDeg) + "°.",
    t("Verificare: cos φ = P / S = ", "Проверка: cos φ = P / S = ") + (S === 0 ? t("nedefinit la S = 0", "не определено при S = 0") : num(P / S)) + ".",
  );

  return {
    ok: true,
    phase: input.phase,
    nature: input.nature,
    U: input.U,
    I: current,
    cosPhi: input.cosPhi,
    P,
    Q,
    S,
    phiDeg,
    formulas,
    steps,
    notes,
  };
}

export function solveCircuitFromText(input: {
  phase: CircuitPhase;
  nature: LoadNature;
  solve: CircuitSolve;
  voltage: string;
  current: string;
  power: string;
  cosPhi: string;
  locale?: Locale;
}): CircuitSuccess | CalcFailure {
  const locale = input.locale ?? "ro";
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const U = readRequired(input.voltage, t("Tensiunea U", "Напряжение U"), locale);
  if (!U.ok) return U;
  const cosPhi = readRequired(input.cosPhi, t("Factorul de putere cos φ", "Коэффициент мощности cos φ"), locale);
  if (!cosPhi.ok) return cosPhi;

  if (input.solve === "current") {
    const I = readRequired(input.current, t("Curentul I", "Ток I"), locale);
    if (!I.ok) return I;
    return solveCircuit({
      phase: input.phase,
      nature: input.nature,
      solve: "current",
      U: U.value,
      I: I.value,
      cosPhi: cosPhi.value,
      locale,
    });
  }

  const P = readRequired(input.power, t("Puterea activă P", "Активная мощность P"), locale);
  if (!P.ok) return P;
  return solveCircuit({
    phase: input.phase,
    nature: input.nature,
    solve: "power",
    U: U.value,
    P: P.value,
    cosPhi: cosPhi.value,
    locale,
  });
}
