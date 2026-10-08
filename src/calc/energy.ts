import { tx, type Locale } from "../i18n/messages.ts";
import { formatNumber } from "../lib/numbers.ts";
import { ensureFinite, failure, readRequired, type CalcFailure } from "./types.ts";

export type ApplianceValues = {
  name: string;
  powerW: number;
  quantity: number;
  hoursPerDay: number;
  daysPerMonth: number;
};

export type ApplianceResult = ApplianceValues & {
  ok: true;
  code?: undefined;
  kwh: number;
  steps: string[];
};

export function applianceMonthlyKwh(
  powerW: number,
  quantity: number,
  hoursPerDay: number,
  daysPerMonth: number,
): number {
  return (powerW * quantity * hoursPerDay * daysPerMonth) / 1000;
}

export function annualFromMonthly(monthlyKwh: number): number {
  return monthlyKwh * 12;
}

export function energyCost(kwh: number, tariffPerKwh: number): number {
  return kwh * tariffPerKwh;
}

export function evaluateAppliance(input: {
  name: string;
  power: string;
  quantity: string;
  hours: string;
  days: string;
  locale?: Locale;
}): ApplianceResult | CalcFailure {
  const locale = input.locale ?? "ro";
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const name = input.name.trim();
  if (!name) return failure("empty", t("Introduceți denumirea aparatului.", "Введите название прибора."));

  const power = readRequired(input.power, t(`Puterea pentru „${name}”`, `Мощность для «${name}»`), locale);
  if (!power.ok) return power;
  const quantity = readRequired(input.quantity, t(`Cantitatea pentru „${name}”`, `Количество для «${name}»`), locale);
  if (!quantity.ok) return quantity;
  const hours = readRequired(input.hours, t(`Orele pe zi pentru „${name}”`, `Часы в сутки для «${name}»`), locale);
  if (!hours.ok) return hours;
  const days = readRequired(input.days, t(`Zilele pe lună pentru „${name}”`, `Дни в месяц для «${name}»`), locale);
  if (!days.ok) return days;

  if (hours.value > 24) {
    return failure("out_of_range", t(`Orele pe zi pentru „${name}” trebuie să fie între 0 și 24.`, `Часы в сутки для «${name}» должны быть от 0 до 24.`));
  }
  if (days.value > 31) {
    return failure("out_of_range", t(`Zilele pe lună pentru „${name}” trebuie să fie între 0 și 31.`, `Дни в месяц для «${name}» должны быть от 0 до 31.`));
  }

  const kwh = applianceMonthlyKwh(power.value, quantity.value, hours.value, days.value);
  const overflow = ensureFinite([kwh], locale);
  if (overflow) return overflow;

  return {
    ok: true,
    name,
    powerW: power.value,
    quantity: quantity.value,
    hoursPerDay: hours.value,
    daysPerMonth: days.value,
    kwh,
    steps: [
      t(`E = (P × n × h × d) / 1000 pentru „${name}”.`, `E = (P × n × h × d) / 1000 для «${name}».`),
      t(
        `E = (${formatNumber(power.value)} × ${formatNumber(quantity.value)} × ${formatNumber(hours.value)} × ${formatNumber(days.value)}) / 1000 = ${formatNumber(kwh)} kWh/lună.`,
        `E = (${formatNumber(power.value)} × ${formatNumber(quantity.value)} × ${formatNumber(hours.value)} × ${formatNumber(days.value)}) / 1000 = ${formatNumber(kwh)} кВт·ч/месяц.`,
      ),
    ],
  };
}

export function isBlankAppliance(input: {
  name: string;
  power: string;
  quantity: string;
  hours: string;
  days: string;
}): boolean {
  return [input.name, input.power, input.quantity, input.hours, input.days].every((value) => value.trim() === "");
}

export type ScenarioSummary = {
  ok: true;
  code?: undefined;
  appliances: ApplianceResult[];
  monthlyKwh: number;
  annualKwh: number;
  formulas: string[];
  steps: string[];
};

export function summarizeAppliances(
  items: Array<{ name: string; power: string; quantity: string; hours: string; days: string }>,
  locale: Locale = "ro",
): ScenarioSummary | CalcFailure {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const filled = items.filter((item) => !isBlankAppliance(item));
  if (filled.length === 0) {
    return {
      ok: true,
      appliances: [],
      monthlyKwh: 0,
      annualKwh: 0,
      formulas: ["E = (P × n × h × d) / 1000", "E_anual = E_lunar × 12"],
      steps: [t("Nu există aparate completate. Consumul lunar este 0 kWh.", "Нет заполненных приборов. Месячное потребление равно 0 кВт·ч.")],
    };
  }

  const appliances: ApplianceResult[] = [];
  for (const item of filled) {
    const result = evaluateAppliance({ ...item, locale });
    if (!result.ok) return result;
    appliances.push(result);
  }

  const monthlyKwh = appliances.reduce((sum, item) => sum + item.kwh, 0);
  const annualKwh = annualFromMonthly(monthlyKwh);
  const overflow = ensureFinite([monthlyKwh, annualKwh], locale);
  if (overflow) return overflow;

  return {
    ok: true,
    appliances,
    monthlyKwh,
    annualKwh,
    formulas: ["E = (P × n × h × d) / 1000", "E_anual = E_lunar × 12"],
    steps: [
      ...appliances.flatMap((item) => item.steps),
      t(`Consum lunar total = ${formatNumber(monthlyKwh)} kWh.`, `Суммарное месячное потребление = ${formatNumber(monthlyKwh)} кВт·ч.`),
      t("Prognoza anuală presupune același regim în fiecare lună.", "Годовой прогноз предполагает одинаковый режим каждый месяц."),
      t(
        `E_anual = ${formatNumber(monthlyKwh)} × 12 = ${formatNumber(annualKwh)} kWh.`,
        `E_год = ${formatNumber(monthlyKwh)} × 12 = ${formatNumber(annualKwh)} кВт·ч.`,
      ),
    ],
  };
}

export function describeSavings(
  aKwh: number,
  bKwh: number,
  tariff: number | null,
  locale: Locale = "ro",
): { cheaper: "A" | "B" | "equal"; savedKwh: number; savedCost: number | null; text: string } {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const delta = aKwh - bKwh;
  const savedKwh = Math.abs(delta);
  const savedCost = tariff === null ? null : savedKwh * tariff;
  if (delta === 0) {
    return {
      cheaper: "equal",
      savedKwh: 0,
      savedCost: tariff === null ? null : 0,
      text: t("Scenariile A și B au același consum lunar.", "Сценарии A и B имеют одинаковое месячное потребление."),
    };
  }
  const cheaper = delta > 0 ? "B" : "A";
  const other = cheaper === "A" ? "B" : "A";
  const costText =
    savedCost === null
      ? t(" Introduceți tariful pentru a estima economia în MDL.", " Введите тариф, чтобы оценить экономию в MDL.")
      : t(` Economia estimată este ${formatNumber(savedCost)} MDL/lună.`, ` Оценка экономии: ${formatNumber(savedCost)} MDL/месяц.`);
  return {
    cheaper,
    savedKwh,
    savedCost,
    text: t(
      `Scenariul ${cheaper} consumă mai puțin. Economia potențială față de scenariul ${other} este ${formatNumber(savedKwh)} kWh/lună.${costText}`,
      `Сценарий ${cheaper} потребляет меньше. Возможная экономия относительно сценария ${other}: ${formatNumber(savedKwh)} кВт·ч/месяц.${costText}`,
    ),
  };
}

export function readTariff(input: string, locale: Locale = "ro"): { ok: true; value: number | null } | CalcFailure {
  if (input.trim() === "") return { ok: true, value: null };
  const parsed = readRequired(input, tx(locale, "Tariful", "Тариф"), locale);
  if (!parsed.ok) return parsed;
  return { ok: true, value: parsed.value };
}
