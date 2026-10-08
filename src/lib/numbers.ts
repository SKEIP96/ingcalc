export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; reason: "empty" | "invalid" };

export function parseDecimal(input: string): ParseResult {
  const trimmed = input.trim().replace(/[\u00a0\u202f]/g, " ");
  if (!trimmed) return { ok: false, reason: "empty" };

  let compact = trimmed.replace(/\s/g, "");
  const commas = compact.match(/,/g)?.length ?? 0;
  const dots = compact.match(/\./g)?.length ?? 0;

  if (commas > 0 && dots > 0) {
    const lastComma = compact.lastIndexOf(",");
    const lastDot = compact.lastIndexOf(".");
    if (lastComma > lastDot) compact = compact.replace(/\./g, "").replace(",", ".");
    else compact = compact.replace(/,/g, "");
  } else if (commas > 1 || dots > 1) {
    return { ok: false, reason: "invalid" };
  } else if (commas === 1) {
    compact = compact.replace(",", ".");
  }

  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(compact)) {
    return { ok: false, reason: "invalid" };
  }

  const value = Number(compact);
  if (!Number.isFinite(value)) return { ok: false, reason: "invalid" };
  return { ok: true, value };
}

export function formatNumber(value: number, maxDecimals = 6): string {
  if (!Number.isFinite(value)) return "—";
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(maxDecimals);
  const [intRaw, fracRaw = ""] = fixed.split(".");
  const grouped = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const frac = fracRaw.replace(/0+$/, "");
  const body = frac ? `${grouped},${frac}` : grouped;
  return negative ? `-${body}` : body;
}

export function formatDateTime(iso: string, locale: "ro" | "ru" = "ro"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "ro-RO", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export function fieldSignature(parts: Array<string | number>): string {
  return parts.map((part) => encodeURIComponent(String(part))).join("~");
}

export function isResultStale(savedSignature: string | null, currentSignature: string): boolean {
  return savedSignature !== null && savedSignature !== currentSignature;
}
