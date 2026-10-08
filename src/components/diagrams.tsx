import { useI18n } from "../context/LanguageContext.tsx";
import { tx } from "../i18n/messages.ts";

export function HeroCircuit() {
  return (
    <svg className="scheme" viewBox="0 0 420 280" aria-hidden="true">
      <rect x="18" y="18" width="384" height="244" rx="24" className="source" />
      <path className="wire flow" d="M70 78 H190" />
      <polyline className="resistor" points="190,78 204,58 228,98 252,58 276,98 290,78" />
      <path className="wire flow" d="M290 78 H350 V150 H300" />
      <circle cx="300" cy="150" r="18" className="source" />
      <path className="wire flow" d="M282 150 H90 V200 H250" />
      <polyline className="resistor" points="250,200 264,180 288,220 312,180 336,220 350,200" />
      <path className="wire" d="M90 78 V150" />
      <path className="wire" d="M70 150 H48 V78 H70" />
      <text x="48" y="48">U</text>
      <text x="214" y="48">R</text>
      <text x="250" y="146">I</text>
    </svg>
  );
}

export function OhmCircuit({
  voltage,
  current,
  resistance,
  power,
  dimmed,
}: {
  voltage: string;
  current: string;
  resistance: string;
  power: string;
  dimmed: boolean;
}) {
  const { m } = useI18n();
  return (
    <svg className={dimmed ? "scheme is-stale" : "scheme"} viewBox="0 0 680 250" role="img">
      <title>{m.ohmScheme}</title>
      <rect x="48" y="78" width="28" height="96" rx="4" className="source" />
      <rect x="70" y="92" width="12" height="68" className="source" />
      <path className="wire flow" d="M82 90 H230" />
      <polyline className="resistor" points="230,90 248,62 278,118 308,62 338,118 356,90" />
      <path className="wire flow" d="M356 90 H590 V176 H82 V174" />
      <polygon points="250,84 266,90 250,96" fill="currentColor" />
      <text x="40" y="70">U = {voltage}</text>
      <text x="250" y="48">R = {resistance}</text>
      <text x="430" y="78">I = {current}</text>
      <text x="250" y="150">P = {power}</text>
    </svg>
  );
}

export function PowerTriangle({
  active,
  reactive,
  apparent,
  angle,
}: {
  active: number | null;
  reactive: number | null;
  apparent: number | null;
  angle: number | null;
}) {
  const { locale, m } = useI18n();
  const numberLocale = locale === "ru" ? "ru-RU" : "ro-RO";
  const ready = active !== null && reactive !== null && apparent !== null && angle !== null;
  const P = Math.abs(active ?? 3);
  const Q = reactive ?? 1.2;
  const max = Math.max(P, Math.abs(Q), 1);
  const width = Math.max((P / max) * 230, Q === 0 ? 230 : 36);
  const height = Q === 0 ? 0 : Math.max((Math.abs(Q) / max) * 140, 28);
  const xA = 78;
  const yA = Q >= 0 ? 210 : 70;
  const xB = xA + width;
  const yB = yA;
  const yC = Q >= 0 ? yB - height : yB + height;
  const label = (value: number | null, unit: string) => (ready && value !== null ? `${value.toLocaleString(numberLocale, { maximumFractionDigits: 2 })} ${unit}` : unit);

  return (
    <svg className="scheme" viewBox="0 0 460 300" role="img">
      <title>{m.triangle}</title>
      <line className="wire" x1={xA} y1={yA} x2={xB} y2={yB} />
      <line className="wire" x1={xB} y1={yB} x2={xB} y2={yC} />
      <line className="resistor" x1={xA} y1={yA} x2={xB} y2={yC} />
      <text x={(xA + xB) / 2 - 30} y={yA + (Q >= 0 ? 28 : -16)}>
        P {label(active, "W")}
      </text>
      <text x={xB + 8} y={(yB + yC) / 2}>
        Q {label(reactive, "var")}
      </text>
      <text x={(xA + xB) / 2 - 70} y={(yA + yC) / 2}>
        S {label(apparent, "VA")}
      </text>
      <text x={xA} y={Q >= 0 ? yA - 16 : yA + 28}>
        φ {ready && angle !== null ? `${angle.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}°` : ""}
      </text>
    </svg>
  );
}

export function ResistanceScheme({
  mode,
  labels,
  voltage,
}: {
  mode: "serie" | "paralel";
  labels: string[];
  voltage: string;
}) {
  const { m } = useI18n();
  if (mode === "serie") {
    const width = 140 + labels.length * 86;
    return (
      <svg className="scheme" viewBox={`0 0 ${width} 180`} role="img">
        <title>{m.series}</title>
        <rect x="24" y="58" width="22" height="64" className="source" />
        <path className="wire flow" d={`M46 70 H90`} />
        {labels.map((label, index) => {
          const x = 90 + index * 86;
          return (
            <g key={`${label}-${index}`}>
              <polyline className="resistor" points={`${x},70 ${x + 12},50 ${x + 32},90 ${x + 52},50 ${x + 64},70`} />
              <path className="wire" d={`M${x + 64} 70 H${x + 86}`} />
              <text x={x} y="42">{label}</text>
            </g>
          );
        })}
        <path className="wire flow" d={`M${90 + labels.length * 86} 70 V130 H46 V122`} />
        <text x="16" y="150">U {voltage || "—"}</text>
      </svg>
    );
  }

  const width = 90 + labels.length * 72;
  return (
    <svg className="scheme" viewBox={`0 0 ${width} 220`} role="img">
      <title>{m.parallel}</title>
      <path className="wire" d={`M40 36 H${width - 24}`} />
      <path className="wire" d={`M40 184 H${width - 24}`} />
      <path className="wire flow" d="M40 36 V184" />
      {labels.map((label, index) => {
        const x = 78 + index * 72;
        return (
          <g key={`${label}-${index}`}>
            <path className="wire" d={`M${x} 36 V78`} />
            <polyline className="resistor" points={`${x},78 ${x - 16},96 ${x + 16},118 ${x},136`} />
            <path className="wire" d={`M${x} 136 V184`} />
            <text x={x - 18} y="168">{label}</text>
          </g>
        );
      })}
      <text x="8" y="24">U {voltage || "—"}</text>
    </svg>
  );
}

export function EfficiencyDiagram({ eta, useful, loss }: { eta: number | null; useful: number; loss: number }) {
  const { locale } = useI18n();
  const numberLocale = locale === "ru" ? "ru-RU" : "ro-RO";
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = eta === null ? 0 : Math.max(0, Math.min(100, eta)) / 100;
  const dash = circumference * progress;
  const total = Math.max(useful + loss, 1);
  const usefulWidth = (useful / total) * 100;

  return (
    <svg className="scheme" viewBox="0 0 360 180" role="img">
      <title>{tx(locale, "Diagrama randamentului și a pierderilor", "Диаграмма КПД и потерь")}</title>
      <circle cx="80" cy="90" r={radius} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="12" />
      <circle
        cx="80"
        cy="90"
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform="rotate(-90 80 90)"
      />
      <text x="80" y="86" textAnchor="middle">{eta === null ? "—" : `${eta.toLocaleString(numberLocale, { maximumFractionDigits: 1 })}%`}</text>
      <text x="80" y="106" textAnchor="middle">η</text>
      <rect x="170" y="70" width="170" height="22" rx="8" fill="rgba(148,163,184,0.2)" />
      <rect x="170" y="70" width={(170 * usefulWidth) / 100} height="22" rx="8" fill="var(--accent)" />
      <text x="170" y="58">{tx(locale, "Util", "Полезно")}</text>
      <text x="170" y="116">{tx(locale, "Pierderi", "Потери")}</text>
    </svg>
  );
}
