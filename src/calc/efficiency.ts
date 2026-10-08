import { tx, type Locale } from "../i18n/messages.ts";
import { formatNumber } from "../lib/numbers.ts";
import { ensureFinite, ensureNonNegative, failure, readRequired, type CalcFailure } from "./types.ts";

export type PowerUnit = "W" | "kW";
export type EfficiencyMode = "powers" | "efficiency";

export type EfficiencySuccess = {
  ok: true;
  code?: undefined;
  pinW: number;
  poutW: number;
  lossW: number;
  etaPercent: number;
  formulas: string[];
  steps: string[];
  notes: string[];
};

export function toWatts(value: number, unit: PowerUnit): number {
  return unit === "kW" ? value * 1000 : value;
}

export function fromWatts(watts: number, unit: PowerUnit): number {
  return unit === "kW" ? watts / 1000 : watts;
}

export function solveFromPowers(pinW: number, poutW: number, locale: Locale = "ro"): EfficiencySuccess | CalcFailure {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const input = ensureNonNegative(pinW, locale);
  if (input) return input;
  const output = ensureNonNegative(poutW, locale);
  if (output) return output;
  if (pinW === 0) {
    return failure("division_by_zero", t("Randamentul nu poate fi calculat când puterea de intrare este zero.", "КПД нельзя рассчитать, когда входная мощность равна нулю."));
  }
  if (poutW > pinW) {
    return failure(
      "impossible",
      t(
        "Puterea utilă nu poate depăși puterea de intrare pentru acest model de echipament.",
        "Полезная мощность не может превышать входную для этой модели оборудования.",
      ),
    );
  }

  const etaPercent = (poutW / pinW) * 100;
  const lossW = pinW - poutW;
  const overflow = ensureFinite([etaPercent, lossW], locale);
  if (overflow) return overflow;

  return {
    ok: true,
    pinW,
    poutW,
    lossW,
    etaPercent,
    formulas: [
      t("η = (P_ieșire / P_intrare) × 100%", "η = (P_вых / P_вх) × 100%"),
      t("P_pierderi = P_intrare − P_ieșire", "P_потери = P_вх − P_вых"),
    ],
    steps: [
      t(
        `P_intrare = ${formatNumber(pinW)} W, P_ieșire = ${formatNumber(poutW)} W.`,
        `P_вх = ${formatNumber(pinW)} Вт, P_вых = ${formatNumber(poutW)} Вт.`,
      ),
      t("η = (P_ieșire / P_intrare) × 100%.", "η = (P_вых / P_вх) × 100%."),
      `η = (${formatNumber(poutW)} / ${formatNumber(pinW)}) × 100% = ${formatNumber(etaPercent)}%.`,
      t("P_pierderi = P_intrare − P_ieșire.", "P_потери = P_вх − P_вых."),
      t(
        `P_pierderi = ${formatNumber(pinW)} − ${formatNumber(poutW)} = ${formatNumber(lossW)} W.`,
        `P_потери = ${formatNumber(pinW)} − ${formatNumber(poutW)} = ${formatNumber(lossW)} Вт.`,
      ),
      t(
        `Verificare: P_ieșire + P_pierderi = ${formatNumber(poutW + lossW)} W.`,
        `Проверка: P_вых + P_потери = ${formatNumber(poutW + lossW)} Вт.`,
      ),
    ],
    notes: [
      t(
        "Randamentul η descrie cât din puterea de intrare devine putere utilă.",
        "КПД η показывает, какая часть входной мощности становится полезной.",
      ),
      t(
        "η nu este factorul de putere cos φ și nu se folosește în triunghiul puterilor.",
        "η не является коэффициентом мощности cos φ и не используется в треугольнике мощностей.",
      ),
    ],
  };
}

export function solveFromEfficiency(pinW: number, etaPercent: number, locale: Locale = "ro"): EfficiencySuccess | CalcFailure {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const input = ensureNonNegative(pinW, locale);
  if (input) return input;
  const eta = ensureNonNegative(etaPercent, locale);
  if (eta) return eta;
  if (pinW === 0) {
    return failure("division_by_zero", t("Puterea de ieșire nu este determinată când puterea de intrare este zero.", "Выходная мощность не определена, когда входная мощность равна нулю."));
  }
  if (etaPercent > 100) {
    return failure("out_of_range", t("Randamentul trebuie să fie între 0% și 100%.", "КПД должен быть от 0% до 100%."));
  }

  const poutW = pinW * (etaPercent / 100);
  const lossW = pinW - poutW;
  const overflow = ensureFinite([poutW, lossW], locale);
  if (overflow) return overflow;

  return {
    ok: true,
    pinW,
    poutW,
    lossW,
    etaPercent,
    formulas: [
      t("P_ieșire = P_intrare × η / 100", "P_вых = P_вх × η / 100"),
      t("P_pierderi = P_intrare − P_ieșire", "P_потери = P_вх − P_вых"),
    ],
    steps: [
      t(
        `P_intrare = ${formatNumber(pinW)} W, η = ${formatNumber(etaPercent)}%.`,
        `P_вх = ${formatNumber(pinW)} Вт, η = ${formatNumber(etaPercent)}%.`,
      ),
      t("P_ieșire = P_intrare × η / 100.", "P_вых = P_вх × η / 100."),
      t(
        `P_ieșire = ${formatNumber(pinW)} × ${formatNumber(etaPercent)} / 100 = ${formatNumber(poutW)} W.`,
        `P_вых = ${formatNumber(pinW)} × ${formatNumber(etaPercent)} / 100 = ${formatNumber(poutW)} Вт.`,
      ),
      t("P_pierderi = P_intrare − P_ieșire.", "P_потери = P_вх − P_вых."),
      t(
        `P_pierderi = ${formatNumber(pinW)} − ${formatNumber(poutW)} = ${formatNumber(lossW)} W.`,
        `P_потери = ${formatNumber(pinW)} − ${formatNumber(poutW)} = ${formatNumber(lossW)} Вт.`,
      ),
    ],
    notes: [
      t(
        "Randamentul se introduce în procente, de exemplu 85, nu ca factorul de putere.",
        "КПД вводится в процентах, например 85, а не как коэффициент мощности.",
      ),
      t("η nu este cos φ.", "η — это не cos φ."),
    ],
  };
}

export function solveEfficiencyFromText(input: {
  mode: EfficiencyMode;
  unit: PowerUnit;
  pin: string;
  pout: string;
  eta: string;
  locale?: Locale;
}): EfficiencySuccess | CalcFailure {
  const locale = input.locale ?? "ro";
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const pin = readRequired(input.pin, t("Puterea de intrare", "Входная мощность"), locale);
  if (!pin.ok) return pin;
  const pinW = toWatts(pin.value, input.unit);
  if (input.mode === "powers") {
    const pout = readRequired(input.pout, t("Puterea utilă de ieșire", "Полезная выходная мощность"), locale);
    if (!pout.ok) return pout;
    return solveFromPowers(pinW, toWatts(pout.value, input.unit), locale);
  }
  const eta = readRequired(input.eta, t("Randamentul η", "КПД η"), locale);
  if (!eta.ok) return eta;
  return solveFromEfficiency(pinW, eta.value, locale);
}
