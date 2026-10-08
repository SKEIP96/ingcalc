import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../context/LanguageContext.tsx";
import { useTheme } from "../context/ThemeContext.tsx";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.ts";
import { formatNumber } from "../lib/numbers.ts";

const COLORS = ["#22d3ee", "#2dd4bf", "#38bdf8", "#818cf8", "#fbbf24", "#fb7185", "#a3e635", "#c084fc"];

function usePalette() {
  const { theme } = useTheme();
  const reduced = usePrefersReducedMotion();
  return {
    reduced,
    axis: theme === "dark" ? "#93a4bd" : "#52627a",
    grid: theme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)",
    tooltip: {
      background: theme === "dark" ? "#101a30" : "#ffffff",
      border: "1px solid rgba(148,163,184,0.25)",
      borderRadius: 12,
      color: theme === "dark" ? "#e8eef7" : "#0b1220",
    },
  };
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (Array.isArray(value) && typeof value[0] === "number") return value[0];
  return 0;
}

export function ConsumptionCharts({ items }: { items: { name: string; kwh: number }[] }) {
  const { m } = useI18n();
  const palette = usePalette();
  const data = items.map((item, index) => ({ ...item, fill: COLORS[index % COLORS.length] }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="kwh" nameKey="name" innerRadius={52} outerRadius={84} isAnimationActive={!palette.reduced}>
              {data.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.fill} />)}
            </Pie>
            <Tooltip formatter={(value) => `${formatNumber(asNumber(value))} kWh`} contentStyle={palette.tooltip} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: palette.axis, fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fill: palette.axis, fontSize: 12 }} />
            <Tooltip formatter={(value) => `${formatNumber(asNumber(value))} kWh`} contentStyle={palette.tooltip} />
            <Bar dataKey="kwh" name={m.kwhMonth} isAnimationActive={!palette.reduced}>
              {data.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ScenarioChart({ a, b }: { a: number; b: number }) {
  const { m } = useI18n();
  const palette = usePalette();
  const data = [
    { name: m.scenarioA, kwh: a },
    { name: m.scenarioB, kwh: b },
  ];
  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: palette.axis }} />
          <YAxis tick={{ fill: palette.axis }} />
          <Tooltip formatter={(value) => `${formatNumber(asNumber(value))} kWh`} contentStyle={palette.tooltip} />
          <Bar dataKey="kwh" name={m.monthlyShort} fill="#22d3ee" isAnimationActive={!palette.reduced} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LossChart({ useful, loss }: { useful: number; loss: number }) {
  const { m } = useI18n();
  const palette = usePalette();
  const data = [
    { name: m.usefulBar, value: useful },
    { name: m.lossBar, value: loss },
  ];
  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: palette.axis }} />
          <YAxis tick={{ fill: palette.axis }} />
          <Tooltip formatter={(value) => `${formatNumber(asNumber(value))} W`} contentStyle={palette.tooltip} />
          <Bar dataKey="value" name={m.powerBar} fill="#2dd4bf" isAnimationActive={!palette.reduced} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
