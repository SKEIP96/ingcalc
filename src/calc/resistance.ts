import { tx, type Locale } from "../i18n/messages.ts";
import { formatNumber } from "../lib/numbers.ts";
import { ensureFinite, failure, readRequired, type CalcFailure } from "./types.ts";

export type Connection = "serie" | "paralel";

export type ResistanceSuccess = {
  ok: true;
  code?: undefined;
  mode: Connection;
  resistances: number[];
  req: number;
  shortCircuit: boolean;
  formulas: string[];
  steps: string[];
  notes: string[];
  voltage: number | null;
  current: number | null;
  currentIssue: string | null;
};

export function equivalentSeries(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function equivalentParallel(values: number[]): number {
  if (values.some((value) => value === 0)) return 0;
  const conductance = values.reduce((sum, value) => sum + 1 / value, 0);
  return 1 / conductance;
}

export function solveResistance(
  mode: Connection,
  resistances: number[],
  voltage: number | null,
  locale: Locale = "ro",
): ResistanceSuccess | CalcFailure {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  if (resistances.length < 2 || resistances.length > 12) {
    return failure("invalid_count", t("Introduceți între 2 și 12 rezistențe.", "Введите от 2 до 12 сопротивлений."));
  }
  for (const value of resistances) {
    if (!Number.isFinite(value)) return failure("non_finite", t("Fiecare rezistență trebuie să fie un număr finit.", "Каждое сопротивление должно быть конечным числом."));
    if (value < 0) return failure("negative", t("Rezistența nu poate fi negativă.", "Сопротивление не может быть отрицательным."));
  }
  if (voltage !== null) {
    if (!Number.isFinite(voltage)) return failure("non_finite", t("Tensiunea trebuie să fie un număr finit.", "Напряжение должно быть конечным числом."));
    if (voltage < 0) return failure("negative", t("Tensiunea nu poate fi negativă.", "Напряжение не может быть отрицательным."));
  }

  const shortCircuit =
    mode === "paralel" ? resistances.some((value) => value === 0) : resistances.every((value) => value === 0);
  const req = mode === "serie" ? equivalentSeries(resistances) : equivalentParallel(resistances);
  const overflow = ensureFinite([req], locale);
  if (overflow) return overflow;

  const labels = resistances.map((value, index) => `R${index + 1} = ${formatNumber(value)} Ω`);
  const formulas =
    mode === "serie"
      ? ["R_eq = R1 + R2 + … + Rn"]
      : ["1 / R_eq = 1 / R1 + 1 / R2 + … + 1 / Rn"];
  const steps: string[] = [t(`Rezistențe: ${labels.join(", ")}.`, `Сопротивления: ${labels.join(", ")}.`)];
  const notes: string[] = [];

  if (mode === "serie") {
    steps.push(`R_eq = ${resistances.map((value) => formatNumber(value)).join(" + ")} = ${formatNumber(req)} Ω.`);
  } else if (shortCircuit) {
    steps.push(t("Cel puțin o rezistență este 0 Ω.", "Хотя бы одно сопротивление равно 0 Ом."));
    steps.push(t("În conexiune paralel, ramura de 0 Ω scurtcircuitează grupul.", "При параллельном соединении ветвь 0 Ом закорачивает группу."));
    steps.push(t("R_eq = 0 Ω.", "R_eq = 0 Ом."));
    notes.push(t("Scurtcircuit: rezistența echivalentă este zero.", "Короткое замыкание: эквивалентное сопротивление равно нулю."));
  } else {
    const conductances = resistances.map((value) => 1 / value);
    const sum = conductances.reduce((total, value) => total + value, 0);
    steps.push(
      `1/R_eq = ${resistances.map((value) => `1/${formatNumber(value)}`).join(" + ")} = ${formatNumber(sum)} Ω⁻¹.`,
    );
    steps.push(`R_eq = 1 / ${formatNumber(sum)} = ${formatNumber(req)} Ω.`);
  }

  let current: number | null = null;
  let currentIssue: string | null = null;
  if (voltage !== null) {
    formulas.push("I = U / R_eq");
    if (req === 0 && voltage === 0) {
      currentIssue = t(
        "Curentul este nedeterminat: tensiunea și rezistența echivalentă sunt zero.",
        "Ток неопределён: напряжение и эквивалентное сопротивление равны нулю.",
      );
      steps.push(currentIssue);
    } else if (req === 0) {
      currentIssue = t(
        "Scurtcircuit: la R_eq = 0 Ω și U diferit de zero curentul nu este finit.",
        "Короткое замыкание: при R_eq = 0 Ом и U, отличном от нуля, ток не конечен.",
      );
      steps.push(currentIssue);
    } else {
      current = voltage / req;
      const currentOverflow = ensureFinite([current], locale);
      if (currentOverflow) return currentOverflow;
      steps.push(`I = ${formatNumber(voltage)} / ${formatNumber(req)} = ${formatNumber(current)} A.`);
    }
  }

  return {
    ok: true,
    mode,
    resistances,
    req,
    shortCircuit,
    formulas,
    steps,
    notes,
    voltage,
    current,
    currentIssue,
  };
}

export function solveResistanceFromText(
  mode: Connection,
  rawValues: string[],
  voltageText: string,
  locale: Locale = "ro",
): ResistanceSuccess | CalcFailure {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  if (rawValues.length < 2 || rawValues.length > 12) {
    return failure("invalid_count", t("Introduceți între 2 și 12 rezistențe.", "Введите от 2 до 12 сопротивлений."));
  }
  const resistances: number[] = [];
  for (let index = 0; index < rawValues.length; index += 1) {
    const parsed = readRequired(rawValues[index] ?? "", `R${index + 1}`, locale);
    if (!parsed.ok) return parsed;
    resistances.push(parsed.value);
  }

  let voltage: number | null = null;
  if (voltageText.trim() !== "") {
    const parsed = readRequired(voltageText, t("Tensiunea U", "Напряжение U"), locale);
    if (!parsed.ok) return parsed;
    voltage = parsed.value;
  }

  return solveResistance(mode, resistances, voltage, locale);
}
