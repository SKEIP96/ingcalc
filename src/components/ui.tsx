import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { Copy, Info, Printer, RotateCcw, Save } from "lucide-react";
import { useI18n } from "../context/LanguageContext.tsx";

export function Hint({ text }: { text: string }) {
  const { m } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="hint" ref={ref}>
      <button
        type="button"
        className="hint-btn"
        aria-expanded={open}
        aria-label={m.hint}
        onClick={() => setOpen((value) => !value)}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      {open ? (
        <span role="tooltip" className="hint-pop">
          {text}
        </span>
      ) : null}
    </span>
  );
}

export function Field({
  id,
  label,
  hint,
  unit,
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
}: {
  id: string;
  label: string;
  hint?: string;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "text";
}) {
  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        {hint ? <Hint text={hint} /> : null}
      </div>
      <div className="field-box">
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = options.findIndex((item) => item.value === value);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = options[(index + delta + options.length) % options.length];
    if (next) onChange(next.value);
  }

  return (
    <div role="radiogroup" aria-label={label} className="seg" onKeyDown={onKeyDown}>
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          role="radio"
          aria-checked={item.value === value}
          tabIndex={item.value === value ? 0 : -1}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function ResultList({
  rows,
  stale,
}: {
  rows: { label: string; value: string; unit: string }[];
  stale: boolean;
}) {
  const { m } = useI18n();
  return (
    <div className={stale ? "result-list is-stale" : "result-list"} aria-live="polite">
      {stale ? <p className="alert alert-warn">{m.stale}</p> : null}
      {rows.map((row) => (
        <div className="result-row" key={row.label}>
          <span>{row.label}</span>
          <strong>
            {row.value} <small>{row.unit}</small>
          </strong>
        </div>
      ))}
    </div>
  );
}

export function ActionBar({
  showCalculate = true,
  canExport,
  onReset,
  onSave,
  onCopy,
  onPdf,
  onCsv,
}: {
  showCalculate?: boolean;
  canExport: boolean;
  onReset: () => void;
  onSave: () => void;
  onCopy: () => void;
  onPdf: () => void;
  onCsv?: () => void;
}) {
  const { m } = useI18n();
  return (
    <div className="action-bar">
      {showCalculate ? (
        <button className="btn btn-primary" type="submit">
          {m.calculate}
        </button>
      ) : null}
      <button className="btn btn-secondary" type="button" onClick={onReset}>
        <RotateCcw size={16} aria-hidden="true" /> {m.reset}
      </button>
      <button className="btn btn-secondary" type="button" onClick={onSave} disabled={!canExport}>
        <Save size={16} aria-hidden="true" /> {m.saveHistory}
      </button>
      <button className="btn btn-secondary" type="button" onClick={onCopy} disabled={!canExport}>
        <Copy size={16} aria-hidden="true" /> {m.copyResult}
      </button>
      <button className="btn btn-secondary" type="button" onClick={onPdf} disabled={!canExport}>
        <Printer size={16} aria-hidden="true" /> {m.exportPdf}
      </button>
      {onCsv ? (
        <button className="btn btn-ghost" type="button" onClick={onCsv} disabled={!canExport}>
          {m.exportCsv}
        </button>
      ) : null}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
