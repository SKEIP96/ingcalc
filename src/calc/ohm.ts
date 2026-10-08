import { tx, type Locale } from "../i18n/messages.ts";
import { formatNumber } from "../lib/numbers.ts";
import { ensureFinite, ensureNonNegative, failure, readRequired, type CalcFailure } from "./types.ts";

export type OhmSymbol = "U" | "I" | "R" | "P";

export const OHM_PAIRS: Array<{ id: string; a: OhmSymbol; b: OhmSymbol }> = [
  { id: "UI", a: "U", b: "I" },
  { id: "UR", a: "U", b: "R" },
  { id: "UP", a: "U", b: "P" },
  { id: "IR", a: "I", b: "R" },
  { id: "IP", a: "I", b: "P" },
  { id: "RP", a: "R", b: "P" },
];

const ORDER: OhmSymbol[] = ["U", "I", "R", "P"];

const UNIT: Record<OhmSymbol, string> = { U: "V", I: "A", R: "Ω", P: "W" };
const NAME: Record<OhmSymbol, string> = {
  U: "Tensiunea U",
  I: "Curentul I",
  R: "Rezistența R",
  P: "Puterea P",
};
const NAME_RU: Record<OhmSymbol, string> = {
  U: "Напряжение U",
  I: "Ток I",
  R: "Сопротивление R",
  P: "Мощность P",
};

export type OhmSuccess = {
  ok: true;
  code?: undefined;
  U: number;
  I: number;
  R: number;
  P: number;
  formulas: string[];
  steps: string[];
};

function pairId(a: OhmSymbol, b: OhmSymbol): string {
  const [x, y] = [a, b].sort((left, right) => ORDER.indexOf(left) - ORDER.indexOf(right));
  return `${x}${y}`;
}

function num(value: number): string {
  return formatNumber(value);
}

export function solveOhm(
  a: OhmSymbol,
  va: number,
  b: OhmSymbol,
  vb: number,
  locale: Locale = "ro",
): OhmSuccess | CalcFailure {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const uU = locale === "ru" ? "В" : "V";
  const uI = locale === "ru" ? "А" : "A";
  const uR = locale === "ru" ? "Ом" : "Ω";
  const uP = locale === "ru" ? "Вт" : "W";
  if (a === b) return failure("invalid_pair", t("Selectați două mărimi diferite.", "Выберите две разные величины."));
  const left = ensureNonNegative(va, locale);
  if (left) return left;
  const right = ensureNonNegative(vb, locale);
  if (right) return right;

  const known: Partial<Record<OhmSymbol, number>> = { [a]: va, [b]: vb };
  const Uin = known.U;
  const Iin = known.I;
  const Rin = known.R;
  const Pin = known.P;

  let U = 0;
  let I = 0;
  let R = 0;
  let P = 0;
  let formulas: string[] = [];
  let steps: string[] = [];

  switch (pairId(a, b)) {
    case "UI": {
      if (Uin === undefined || Iin === undefined) return failure("invalid_pair", t("Pereche necunoscută.", "Неизвестная пара."));
      if (Iin === 0 && Uin === 0) {
        return failure(
          "indeterminate",
          t(
            "Cazul este nedeterminat: U = 0 și I = 0, deci rezistența nu are o valoare unică.",
            "Случай неопределён: U = 0 и I = 0, поэтому сопротивление не имеет единственного значения.",
          ),
        );
      }
      if (Iin === 0) {
        return failure(
          "division_by_zero",
          t(
            "Împărțire la zero: R = U / I nu este finită când curentul este zero și tensiunea este nenulă.",
            "Деление на ноль: R = U / I не конечно, когда ток равен нулю, а напряжение не равно нулю.",
          ),
        );
      }
      U = Uin;
      I = Iin;
      R = U / I;
      P = U * I;
      formulas = ["R = U / I", "P = U × I"];
      steps = [
        t(`Mărimi cunoscute: U = ${num(U)} V și I = ${num(I)} A.`, `Известные величины: U = ${num(U)} ${uU} и I = ${num(I)} ${uI}.`),
        "R = U / I.",
        t(`R = ${num(U)} / ${num(I)} = ${num(R)} Ω.`, `R = ${num(U)} / ${num(I)} = ${num(R)} ${uR}.`),
        "P = U × I.",
        t(`P = ${num(U)} × ${num(I)} = ${num(P)} W.`, `P = ${num(U)} × ${num(I)} = ${num(P)} ${uP}.`),
        t(`Verificare: U = I × R = ${num(I)} × ${num(R)} = ${num(I * R)} V.`, `Проверка: U = I × R = ${num(I)} × ${num(R)} = ${num(I * R)} ${uU}.`),
      ];
      break;
    }
    case "UR": {
      if (Uin === undefined || Rin === undefined) return failure("invalid_pair", t("Pereche necunoscută.", "Неизвестная пара."));
      if (Rin === 0 && Uin === 0) {
        return failure(
          "indeterminate",
          t(
            "Cazul este nedeterminat: U = 0 și R = 0, deci curentul nu are o valoare unică.",
            "Случай неопределён: U = 0 и R = 0, поэтому ток не имеет единственного значения.",
          ),
        );
      }
      if (Rin === 0) {
        return failure(
          "division_by_zero",
          t(
            "Scurtcircuit: la R = 0 Ω și U diferit de zero curentul nu este finit.",
            "Короткое замыкание: при R = 0 Ом и U, отличном от нуля, ток не конечен.",
          ),
        );
      }
      U = Uin;
      R = Rin;
      I = U / R;
      P = (U * U) / R;
      formulas = ["I = U / R", "P = U² / R"];
      steps = [
        t(`Mărimi cunoscute: U = ${num(U)} V și R = ${num(R)} Ω.`, `Известные величины: U = ${num(U)} ${uU} и R = ${num(R)} ${uR}.`),
        "I = U / R.",
        t(`I = ${num(U)} / ${num(R)} = ${num(I)} A.`, `I = ${num(U)} / ${num(R)} = ${num(I)} ${uI}.`),
        "P = U² / R.",
        t(`P = ${num(U * U)} / ${num(R)} = ${num(P)} W.`, `P = ${num(U * U)} / ${num(R)} = ${num(P)} ${uP}.`),
        t(`Verificare: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} W.`, `Проверка: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} ${uP}.`),
      ];
      break;
    }
    case "UP": {
      if (Uin === undefined || Pin === undefined) return failure("invalid_pair", t("Pereche necunoscută.", "Неизвестная пара."));
      if (Uin === 0 && Pin === 0) {
        return failure(
          "indeterminate",
          t(
            "Cazul este nedeterminat: U = 0 și P = 0, deci curentul și rezistența nu sunt unice.",
            "Случай неопределён: U = 0 и P = 0, поэтому ток и сопротивление не единственны.",
          ),
        );
      }
      if (Uin === 0) {
        return failure(
          "impossible",
          t(
            "Combinație imposibilă: puterea activă nu poate fi nenulă dacă tensiunea este zero.",
            "Невозможное сочетание: активная мощность не может быть ненулевой при нулевом напряжении.",
          ),
        );
      }
      if (Pin === 0) {
        return failure(
          "division_by_zero",
          t(
            "R = U² / P nu este finită când puterea este zero și tensiunea este nenulă.",
            "R = U² / P не конечно, когда мощность равна нулю, а напряжение не равно нулю.",
          ),
        );
      }
      U = Uin;
      P = Pin;
      I = P / U;
      R = (U * U) / P;
      formulas = ["I = P / U", "R = U² / P"];
      steps = [
        t(`Mărimi cunoscute: U = ${num(U)} V și P = ${num(P)} W.`, `Известные величины: U = ${num(U)} ${uU} и P = ${num(P)} ${uP}.`),
        "I = P / U.",
        t(`I = ${num(P)} / ${num(U)} = ${num(I)} A.`, `I = ${num(P)} / ${num(U)} = ${num(I)} ${uI}.`),
        "R = U² / P.",
        t(`R = ${num(U * U)} / ${num(P)} = ${num(R)} Ω.`, `R = ${num(U * U)} / ${num(P)} = ${num(R)} ${uR}.`),
        t(`Verificare: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} W.`, `Проверка: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} ${uP}.`),
      ];
      break;
    }
    case "IR": {
      if (Iin === undefined || Rin === undefined) return failure("invalid_pair", t("Pereche necunoscută.", "Неизвестная пара."));
      I = Iin;
      R = Rin;
      U = I * R;
      P = I * I * R;
      formulas = ["U = I × R", "P = I² × R"];
      steps = [
        t(`Mărimi cunoscute: I = ${num(I)} A și R = ${num(R)} Ω.`, `Известные величины: I = ${num(I)} ${uI} и R = ${num(R)} ${uR}.`),
        "U = I × R.",
        t(`U = ${num(I)} × ${num(R)} = ${num(U)} V.`, `U = ${num(I)} × ${num(R)} = ${num(U)} ${uU}.`),
        "P = I² × R.",
        t(`P = ${num(I * I)} × ${num(R)} = ${num(P)} W.`, `P = ${num(I * I)} × ${num(R)} = ${num(P)} ${uP}.`),
        t(`Verificare: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} W.`, `Проверка: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} ${uP}.`),
      ];
      break;
    }
    case "IP": {
      if (Iin === undefined || Pin === undefined) return failure("invalid_pair", t("Pereche necunoscută.", "Неизвестная пара."));
      if (Iin === 0 && Pin === 0) {
        return failure(
          "indeterminate",
          t(
            "Cazul este nedeterminat: I = 0 și P = 0, deci tensiunea și rezistența nu sunt unice.",
            "Случай неопределён: I = 0 и P = 0, поэтому напряжение и сопротивление не единственны.",
          ),
        );
      }
      if (Iin === 0) {
        return failure(
          "impossible",
          t(
            "Combinație imposibilă: puterea activă nu poate fi nenulă dacă curentul este zero.",
            "Невозможное сочетание: активная мощность не может быть ненулевой при нулевом токе.",
          ),
        );
      }
      I = Iin;
      P = Pin;
      U = P / I;
      R = P / (I * I);
      formulas = ["U = P / I", "R = P / I²"];
      steps = [
        t(`Mărimi cunoscute: I = ${num(I)} A și P = ${num(P)} W.`, `Известные величины: I = ${num(I)} ${uI} и P = ${num(P)} ${uP}.`),
        "U = P / I.",
        t(`U = ${num(P)} / ${num(I)} = ${num(U)} V.`, `U = ${num(P)} / ${num(I)} = ${num(U)} ${uU}.`),
        "R = P / I².",
        t(`R = ${num(P)} / ${num(I * I)} = ${num(R)} Ω.`, `R = ${num(P)} / ${num(I * I)} = ${num(R)} ${uR}.`),
        t(`Verificare: P = I² × R = ${num(I * I)} × ${num(R)} = ${num(I * I * R)} W.`, `Проверка: P = I² × R = ${num(I * I)} × ${num(R)} = ${num(I * I * R)} ${uP}.`),
      ];
      break;
    }
    case "RP": {
      if (Rin === undefined || Pin === undefined) return failure("invalid_pair", t("Pereche necunoscută.", "Неизвестная пара."));
      if (Rin === 0 && Pin === 0) {
        return failure(
          "indeterminate",
          t(
            "Cazul este nedeterminat: R = 0 și P = 0, deci curentul nu are o valoare unică.",
            "Случай неопределён: R = 0 и P = 0, поэтому ток не имеет единственного значения.",
          ),
        );
      }
      if (Rin === 0) {
        return failure(
          "impossible",
          t(
            "Combinație imposibilă: puterea nu poate fi nenulă pe o rezistență nulă.",
            "Невозможное сочетание: мощность не может быть ненулевой на нулевом сопротивлении.",
          ),
        );
      }
      R = Rin;
      P = Pin;
      I = Math.sqrt(P / R);
      U = Math.sqrt(P * R);
      formulas = ["I = √(P / R)", "U = √(P × R)"];
      steps = [
        t(`Mărimi cunoscute: R = ${num(R)} Ω și P = ${num(P)} W.`, `Известные величины: R = ${num(R)} ${uR} и P = ${num(P)} ${uP}.`),
        t("Pentru sarcină rezistivă se iau rădăcinile pozitive.", "Для резистивной нагрузки берутся положительные корни."),
        "I = √(P / R).",
        t(`I = √(${num(P)} / ${num(R)}) = ${num(I)} A.`, `I = √(${num(P)} / ${num(R)}) = ${num(I)} ${uI}.`),
        "U = √(P × R).",
        t(`U = √(${num(P * R)}) = ${num(U)} V.`, `U = √(${num(P * R)}) = ${num(U)} ${uU}.`),
        t(`Verificare: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} W.`, `Проверка: P = U × I = ${num(U)} × ${num(I)} = ${num(U * I)} ${uP}.`),
      ];
      break;
    }
    default:
      return failure("invalid_pair", t("Combinația de mărimi nu este recunoscută.", "Сочетание величин не распознано."));
  }

  const overflow = ensureFinite([U, I, R, P], locale);
  if (overflow) return overflow;

  return { ok: true, U, I, R, P, formulas, steps };
}

export function solveOhmFromText(
  a: OhmSymbol,
  textA: string,
  b: OhmSymbol,
  textB: string,
  locale: Locale = "ro",
): OhmSuccess | CalcFailure {
  const first = readRequired(textA, ohmLabel(a, locale), locale);
  if (!first.ok) return first;
  const second = readRequired(textB, ohmLabel(b, locale), locale);
  if (!second.ok) return second;
  return solveOhm(a, first.value, b, second.value, locale);
}

export function ohmUnit(symbol: OhmSymbol): string {
  return UNIT[symbol];
}

export function ohmLabel(symbol: OhmSymbol, locale: Locale = "ro"): string {
  return locale === "ru" ? NAME_RU[symbol] : NAME[symbol];
}
