import { appSubtitle, FACULTY_LABEL, footerNote, studentName } from "../config.ts";
import { useI18n } from "../context/LanguageContext.tsx";
import { formatDateTime } from "../lib/numbers.ts";
import type { ReportModel } from "../lib/report.ts";

export function PrintSheet({ report }: { report: ReportModel }) {
  const { locale, m } = useI18n();
  return (
    <article className="print-sheet" lang={locale}>
      <p className="print-brand">ElectroLab</p>
      <p>{appSubtitle(locale)}</p>
      <h1>{report.calculatorName}</h1>
      <p>
        {m.printDate}: {formatDateTime(report.calculatedAt, locale)}
      </p>
      <h2>{m.printInputs}</h2>
      <ul>
        {report.inputs.map((item) => (
          <li key={`${item.label}-${item.unit}`}>
            {item.label}: {item.value} {item.unit}
          </li>
        ))}
      </ul>
      <h2>{m.printFormulas}</h2>
      <ul>
        {report.formulas.map((formula) => (
          <li key={formula}>{formula}</li>
        ))}
      </ul>
      <h2>{m.printResult}</h2>
      <ul>
        {report.results.map((item) => (
          <li key={`${item.label}-${item.value}`}>
            {item.label}: {item.value} {item.unit}
          </li>
        ))}
      </ul>
      {report.steps.length > 0 ? (
        <>
          <h2>{m.printSteps}</h2>
          <ol>
            {report.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </>
      ) : null}
      {report.notes.length > 0 ? (
        <>
          <h2>{m.printNotes}</h2>
          <ul>
            {report.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      ) : null}
      <h2>{m.author}</h2>
      <p>{studentName(locale)}</p>
      <p>{FACULTY_LABEL}</p>
      <p>{footerNote(locale)}</p>
    </article>
  );
}
