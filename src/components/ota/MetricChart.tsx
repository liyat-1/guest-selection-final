import { useEffect, useMemo, useState } from "react";
import { Pin, X } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartRows, chartSpec, type MetricId } from "@/lib/metricSeries";
import {
  comparisonCaption,
  hasComparison,
  type ComparisonMode,
  type CustomComparison,
} from "@/lib/comparison";

const AXIS = { fontSize: 11, fill: "#94a3b8" } as const;
const GRID = "#eef2f7";
const COMPARE = "#94a3b8";

type Row = Record<string, string | number>;
type SeriesRef = { id: string; label: string; color: string };

function PixelColumn({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = "var(--chart-emerald)",
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}) {
  const cell = 5;
  const gap = 3;
  const columns = Math.max(1, Math.floor(width / (cell + gap)));
  const rows = Math.max(1, Math.floor(height / (cell + gap)));
  const pixels = Array.from({ length: columns * rows });
  return (
    <g>
      {pixels.map((_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        return (
          <rect
            key={index}
            x={x + column * (cell + gap)}
            y={y + height - cell - row * (cell + gap)}
            width={cell}
            height={cell}
            rx={1.5}
            fill={fill}
            opacity={0.45 + (row / Math.max(rows, 1)) * 0.5}
          />
        );
      })}
    </g>
  );
}

/** The card used for both the hover tooltip and the pinned read-out. */
function ReadoutCard({
  label,
  items,
  pinned,
  onClose,
  dark,
}: {
  label: string;
  items: { label: string; color: string; value: string; dashed?: boolean }[];
  pinned?: boolean;
  onClose?: () => void;
  dark?: boolean;
}) {
  return (
    <div className={`min-w-[190px] rounded-xl border p-3 shadow-pop backdrop-blur ${dark ? "border-ota-border bg-ota-surface-strong" : "border-slate-200 bg-white/95"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${dark ? "text-ota-muted" : "text-slate-400"}`}>
          {label}
        </p>
        {pinned ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Unpin read-out"
            className="grid size-5 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={12} />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-300">
            <Pin size={10} /> click to pin
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center justify-between gap-6">
            <span className={`flex items-center gap-2 text-[12px] ${dark ? "text-ota-muted" : "text-slate-600"}`}>
              <span
                aria-hidden
                className="inline-block h-0.5 w-3 rounded-full"
                style={{
                  backgroundColor: it.dashed ? "transparent" : it.color,
                  backgroundImage: it.dashed
                    ? `repeating-linear-gradient(90deg, ${it.color} 0 3px, transparent 3px 6px)`
                    : undefined,
                }}
              />
              {it.label}
            </span>
            <span className={`text-[13px] font-semibold tabular-nums tracking-tight ${dark ? "text-ota-foreground" : "text-slate-900"}`}>
              {it.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One chart component that adapts to the metric it is given: trend area,
 * multi-series line, grouped bars, or a horizontal progression.
 *
 * Hovering reads out every series at that point; clicking pins the read-out
 * so it stays until it is dismissed.
 */
export function MetricChart({
  metric,
  days,
  comparison,
  custom,
  factor = 1,
  height = 300,
  dark = false,
  focus,
}: {
  metric: MetricId;
  days: number;
  comparison: ComparisonMode;
  custom?: CustomComparison;
  factor?: number;
  height?: number;
  dark?: boolean;
  /** Dims every series except this one instead of swapping charts. */
  focus?: string;
}) {
  const spec = chartSpec(metric);
  const [only, setOnly] = useState<string | undefined>(undefined);
  const [pinned, setPinned] = useState<number | null>(null);

  useEffect(() => {
    setOnly(undefined);
    setPinned(null);
  }, [metric]);

  const rows = chartRows(metric, { days, comparison, custom, factor, only }) as Row[];
  const keys: SeriesRef[] = only ? spec.keys.filter((s) => s.id === only) : spec.keys;
  const showCompare = hasComparison(days, comparison, custom);
  const compareLabel = comparisonCaption(comparison, custom) || "Comparison";

  const fmtValue = (v: number) =>
    spec.money
      ? `$${Number(v).toLocaleString("en-US")}`
      : spec.percent
        ? `${Number(v).toFixed(1)}%`
        : Number(v).toLocaleString("en-US");

  const progression = spec.kind === "progression";
  const pixelRevenue = metric === "revenue";
  const axis = dark ? { fontSize: 11, fill: "var(--ota-muted)" } : AXIS;
  const grid = dark ? "var(--ota-grid)" : GRID;

  const readoutFor = (index: number) => {
    const row = rows[index];
    if (!row) return null;
    const items: { label: string; color: string; value: string; dashed?: boolean }[] = [];
    if (progression) {
      items.push({ label: "This period", color: "#2563eb", value: fmtValue(Number(row.value)) });
      if (showCompare && row.previous !== undefined) {
        items.push({
          label: compareLabel,
          color: COMPARE,
          value: fmtValue(Number(row.previous)),
          dashed: true,
        });
      }
    } else {
      for (const s of keys) {
        if (row[s.id] === undefined) continue;
        items.push({ label: s.label, color: s.color, value: fmtValue(Number(row[s.id])) });
      }
      const prevKey = `prev_${keys[0]?.id}`;
      if (showCompare && row[prevKey] !== undefined) {
        items.push({
          label: compareLabel,
          color: COMPARE,
          value: fmtValue(Number(row[prevKey])),
          dashed: true,
        });
      }
    }
    return { label: String(row.date ?? ""), items };
  };

  const pinnedReadout = useMemo(
    () => (pinned === null ? null : readoutFor(pinned)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, rows, keys.length, showCompare, compareLabel],
  );

  const tooltip = (
    <ChartTooltip
      cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
      wrapperStyle={{ outline: "none", zIndex: 20 }}
      content={({ active, label }) => {
        if (!active) return null;
        const index = rows.findIndex((r) => r.date === label);
        const data = index >= 0 ? readoutFor(index) : null;
        if (!data) return null;
        return <ReadoutCard label={data.label} items={data.items} dark={dark} />;
      }}
    />
  );

  const handleClick = (state: { activeTooltipIndex?: number | null } | null) => {
    const i = state?.activeTooltipIndex;
    if (typeof i !== "number") return;
    setPinned((p) => (p === i ? null : i));
  };

  const gradientId = `fill-${metric}-${keys[0]?.id ?? "v"}`;

  return (
    <div>
      {spec.toggles ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {spec.keys.map((s, i) => {
            const active = only ? only === s.id : i === 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setOnly(i === 0 ? undefined : s.id)}
                className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative w-full" style={{ height }}>
        {pinnedReadout ? (
          <div className="absolute right-2 top-0 z-20">
            <ReadoutCard
              label={pinnedReadout.label}
              items={pinnedReadout.items}
              pinned
              dark={dark}
              onClose={() => setPinned(null)}
            />
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          {pixelRevenue ? (
            <BarChart
              data={rows}
              margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              barGap={3}
              barCategoryGap="30%"
              onClick={handleClick}
            >
              <defs>
                <linearGradient id={`rev-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={keys[0]?.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={keys[0]?.color} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 6" />
              <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={{ stroke: grid }} interval="preserveStartEnd" minTickGap={28} dy={8} />
              <YAxis tick={axis} tickLine={false} axisLine={false} width={68} tickFormatter={fmtValue} />
              <ChartTooltip
                cursor={{ fill: "rgba(15,23,42,0.04)", radius: 6 }}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
                content={({ active, label }) => {
                  if (!active) return null;
                  const index = rows.findIndex((r) => r.date === label);
                  const data = index >= 0 ? readoutFor(index) : null;
                  if (!data) return null;
                  return <ReadoutCard label={data.label} items={data.items} dark={dark} />;
                }}
              />
              {showCompare ? (
                <Bar
                  dataKey={`prev_${keys[0]?.id}`}
                  fill="var(--chart-neutral)"
                  opacity={0.3}
                  radius={[8, 8, 2, 2]}
                  maxBarSize={16}
                />
              ) : null}
              <Bar
                dataKey={keys[0]?.id}
                fill={`url(#rev-${metric})`}
                radius={[8, 8, 2, 2]}
                maxBarSize={20}
              />
            </BarChart>
          ) : progression ? (
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              onClick={handleClick}
            >
              <CartesianGrid stroke={grid} horizontal={false} />
              <XAxis
                type="number"
                tick={axis}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtValue}
              />
              <YAxis
                type="category"
                dataKey="date"
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={112}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(148,163,184,0.10)" }}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
                content={({ active, label }) => {
                  if (!active) return null;
                  const index = rows.findIndex((r) => r.date === label);
                  const data = index >= 0 ? readoutFor(index) : null;
                  if (!data) return null;
                   return <ReadoutCard label={data.label} items={data.items} dark={dark} />;
                }}
              />
              {showCompare ? (
                <Bar
                  dataKey="previous"
                  name={compareLabel}
                  fill="#e2e8f0"
                  radius={[0, 8, 8, 0]}
                  barSize={12}
                />
              ) : null}
              <Bar
                dataKey="value"
                name="This period"
                fill="#2563eb"
                radius={[0, 8, 8, 0]}
                barSize={12}
              />
            </BarChart>
          ) : spec.kind === "bar" ? (
            <BarChart
              data={rows}
              margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              barGap={4}
              barCategoryGap="14%"
              onClick={handleClick}
            >
              <defs>
                {keys.map((s) => (
                  <linearGradient key={s.id} id={`bar-${metric}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.55} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 6" />
              <XAxis
                dataKey="date"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: grid }}
                interval="preserveStartEnd"
                minTickGap={28}
                dy={8}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={fmtValue}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(15,23,42,0.04)", radius: 6 }}
                wrapperStyle={{ outline: "none", zIndex: 20 }}
                content={({ active, label }) => {
                  if (!active) return null;
                  const index = rows.findIndex((r) => r.date === label);
                  const data = index >= 0 ? readoutFor(index) : null;
                  if (!data) return null;
                  return <ReadoutCard label={data.label} items={data.items} dark={dark} />;
                }}
              />
              {pinned !== null && rows[pinned] ? (
                <ReferenceLine
                  x={String(rows[pinned]!.date)}
                  stroke="#0f172a"
                  strokeDasharray="4 4"
                />
              ) : null}
              {keys.map((s) => (
                <Bar
                  key={s.id}
                  dataKey={s.id}
                  name={s.label}
                  fill={`url(#bar-${metric}-${s.id})`}
                  radius={[8, 8, 2, 2]}
                  maxBarSize={34}
                />
              ))}
            </BarChart>
          ) : keys.length === 1 ? (
            <AreaChart
              data={rows}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              onClick={handleClick}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={keys[0]!.color} stopOpacity={dark ? 0.38 : 0.24} />
                  <stop offset="100%" stopColor={keys[0]!.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} vertical={false} strokeDasharray="2 8" />
              <XAxis
                dataKey="date"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                interval="preserveStartEnd"
                minTickGap={28}
                dy={6}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={62}
                domain={spec.percent ? [0, 100] : ["auto", "auto"]}
                tickFormatter={fmtValue}
              />
              {tooltip}
              {pinned !== null && rows[pinned] ? (
                <ReferenceLine
                  x={String(rows[pinned]!.date)}
                  stroke="#0f172a"
                  strokeDasharray="4 4"
                />
              ) : null}
              {showCompare ? (
                <Area
                  type="monotone"
                  dataKey={`prev_${keys[0]!.id}`}
                  name={compareLabel}
                  stroke={COMPARE}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  fill="none"
                  dot={false}
                  activeDot={false}
                />
              ) : null}
              <Area
                type="monotone"
                dataKey={keys[0]!.id}
                name={keys[0]!.label}
                stroke={keys[0]!.color}
                strokeWidth={2.75}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: keys[0]!.color }}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={rows}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              onClick={handleClick}
            >
              <CartesianGrid stroke={grid} vertical={false} strokeDasharray="2 8" />
              <XAxis
                dataKey="date"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                interval="preserveStartEnd"
                minTickGap={28}
                dy={6}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={62}
                domain={spec.percent ? [0, 100] : ["auto", "auto"]}
                tickFormatter={fmtValue}
              />
              {tooltip}
              {pinned !== null && rows[pinned] ? (
                <ReferenceLine
                  x={String(rows[pinned]!.date)}
                  stroke="#0f172a"
                  strokeDasharray="4 4"
                />
              ) : null}
              {showCompare && keys.length === spec.keys.length ? (
                <Line
                  type="monotone"
                  dataKey={`prev_${keys[0]!.id}`}
                  name={compareLabel}
                  stroke={COMPARE}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                />
              ) : null}
              {keys.map((s) => {
                const dim = Boolean(focus) && focus !== s.id;
                return (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    name={s.label}
                    stroke={s.color}
                    strokeOpacity={dim ? 0.2 : 1}
                    strokeWidth={dim ? 1.75 : 3}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: s.color }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend: consistent, quiet, always in the same place. */}
      <ul className={`mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 ${dark ? "border-ota-border" : "border-slate-100"}`}>
        {(progression ? [{ id: "value", label: "This period", color: "#2563eb" }] : keys).map(
          (s) => (
            <li
              key={s.id}
              className={`flex items-center gap-2 text-[11.5px] font-medium ${dark ? "text-ota-muted" : "text-slate-600"}`}
            >
              <span
                aria-hidden
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </li>
          ),
        )}
        {showCompare ? (
          <li className="flex items-center gap-2 text-[11.5px] font-medium text-slate-500">
            <span
              aria-hidden
              className="inline-block h-0.5 w-4 rounded-full"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${COMPARE} 0 4px, transparent 4px 8px)`,
              }}
            />
            {compareLabel}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
