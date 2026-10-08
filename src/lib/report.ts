import { footerLine, footerNote } from "../config.ts";
import type { Locale } from "../i18n/messages.ts";
import { tx } from "../i18n/messages.ts";
import type { HistoryLine } from "./history.ts";
import { formatDateTime } from "./numbers.ts";

export function line(label: string, value: string, unit = ""): HistoryLine {
  return { label, value, unit };
}

export type ReportModel = {
  calculatorId: "ohm" | "circuits" | "energy" | "resistance" | "efficiency";
  calculatorName: string;
  inputs: HistoryLine[];
  results: HistoryLine[];
  formulas: string[];
  steps: string[];
  notes: string[];
  calculatedAt: string;
};

function lineText(line: HistoryLine): string {
  return line.unit ? `${line.label}: ${line.value} ${line.unit}` : `${line.label}: ${line.value}`;
}

export function reportToText(report: ReportModel, locale: Locale = "ro"): string {
  const t = (ro: string, ru: string) => tx(locale, ro, ru);
  const lines = [
    `ElectroLab — ${report.calculatorName}`,
    `${t("Data calculului", "Дата расчёта")}: ${formatDateTime(report.calculatedAt, locale)}`,
    "",
    `${t("Date de intrare", "Исходные данные")}:`,
    ...report.inputs.map(lineText),
    "",
    `${t("Formule", "Формулы")}:`,
    ...report.formulas.map((formula) => `• ${formula}`),
    "",
    `${t("Rezultate", "Результаты")}:`,
    ...report.results.map(lineText),
  ];
  if (report.steps.length > 0) {
    lines.push("", `${t("Rezolvare", "Решение")}:`, ...report.steps.map((step, index) => `${index + 1}. ${step}`));
  }
  if (report.notes.length > 0) {
    lines.push("", `${t("Note", "Примечания")}:`, ...report.notes.map((note) => `• ${note}`));
  }
  lines.push("", footerLine(locale), footerNote(locale));
  return lines.join("\n");
}
