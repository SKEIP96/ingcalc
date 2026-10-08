import { tx, type Locale } from "../i18n/messages.ts";
import { parseDecimal } from "../lib/numbers.ts";

export type ErrorCode =
  | "empty"
  | "invalid_number"
  | "negative"
  | "non_finite"
  | "division_by_zero"
  | "indeterminate"
  | "impossible"
  | "out_of_range"
  | "invalid_count"
  | "too_large"
  | "invalid_pair";

export type CalcFailure = {
  ok: false;
  code: ErrorCode;
  message: string;
};

export function failure(code: ErrorCode, message: string): CalcFailure {
  return { ok: false, code, message };
}

export function ensureFinite(values: number[], locale: Locale = "ro"): CalcFailure | null {
  if (values.some((value) => !Number.isFinite(value))) {
    return failure(
      "too_large",
      tx(
        locale,
        "Rezultatul depășește intervalul numeric stabil. Reduceți valorile introduse.",
        "Результат выходит за устойчивый числовой диапазон. Уменьшите введённые значения.",
      ),
    );
  }
  return null;
}

export function ensureNonNegative(value: number, locale: Locale = "ro"): CalcFailure | null {
  if (!Number.isFinite(value)) {
    return failure("non_finite", tx(locale, "Introduceți un număr finit.", "Введите конечное число."));
  }
  if (value < 0) {
    return failure("negative", tx(locale, "Valorile negative nu sunt admise.", "Отрицательные значения не допускаются."));
  }
  return null;
}

export function readRequired(input: string, label: string, locale: Locale = "ro"): { ok: true; value: number } | CalcFailure {
  const parsed = parseDecimal(input);
  if (!parsed.ok) {
    if (parsed.reason === "empty") {
      return failure("empty", tx(locale, `Completați câmpul „${label}”.`, `Заполните поле «${label}».`));
    }
    return failure(
      "invalid_number",
      tx(
        locale,
        `Câmpul „${label}” nu conține un număr valid. Folosiți punctul sau virgula ca separator zecimal.`,
        `Поле «${label}» не содержит корректное число. Используйте точку или запятую как десятичный разделитель.`,
      ),
    );
  }
  const sign = ensureNonNegative(parsed.value, locale);
  if (sign) return sign;
  return { ok: true, value: parsed.value };
}
