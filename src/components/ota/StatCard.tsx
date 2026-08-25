import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Home,
  Mail,
  MessageSquare,
  MousePointerClick,
  Phone,
  PhoneCall,
  Reply,
} from "lucide-react";
import { InfoTip } from "@/components/ota/InfoTip";
import { comparisonCaption, type ComparisonMode, type CustomComparison } from "@/lib/comparison";
import type { Breakdown } from "@/lib/otaAnalytics";

export type Accent =
  | "blue"
  | "indigo"
  | "periwinkle"
  | "violet"
  | "navy"
  | "teal"
  | "emerald"
  | "forest"
  | "rust"
  | "amber"
  | "slate";

/** Light, fully solid tile surfaces. */
const ACCENT: Record<Accent, string> = {
  blue: "bg-kpi-blue",
  indigo: "bg-kpi-indigo",
  periwinkle: "bg-kpi-periwinkle",
  violet: "bg-kpi-violet",
  navy: "bg-kpi-navy",
  teal: "bg-kpi-teal",
  emerald: "bg-kpi-emerald",
  forest: "bg-kpi-forest",
  rust: "bg-kpi-rust",
  amber: "bg-kpi-amber",
  slate: "bg-kpi-neutral",
};

const VIVID_ACCENT: Record<Accent, string> = {
  blue: "bg-kpi-vivid-blue",
  indigo: "bg-kpi-vivid-indigo",
  periwinkle: "bg-kpi-vivid-indigo",
  violet: "bg-kpi-vivid-violet",
  navy: "bg-kpi-vivid-navy",
  teal: "bg-kpi-vivid-teal",
  emerald: "bg-kpi-vivid-emerald",
  forest: "bg-kpi-vivid-emerald",
  rust: "bg-kpi-vivid-amber",
  amber: "bg-kpi-vivid-amber",
  slate: "bg-kpi-vivid-navy",
};

/** Top hairline that carries the series colour of each tile. */
export const ACCENT_RULE: Record<Accent, string> = {
  blue: "border-t-chart-blue",
  indigo: "border-t-chart-indigo",
  periwinkle: "border-t-chart-indigo",
  violet: "border-t-chart-violet",
  navy: "border-t-chart-neutral",
  teal: "border-t-chart-teal",
  emerald: "border-t-chart-emerald",
  forest: "border-t-chart-emerald",
  rust: "border-t-chart-amber",
  amber: "border-t-chart-amber",
  slate: "border-t-chart-neutral",
};

const BREAKDOWN_ICON: Record<string, typeof Mail> = {
  Email: Mail,
  Phone: Phone,
  Address: Home,
  Text: MessageSquare,
  Clicks: MousePointerClick,
  Responses: Reply,
  Calls: PhoneCall,
};

/** Delta chip. */
export function Delta({ value, tone = "light" }: { value: number; tone?: "light" | "dark" }) {
  const up = value >= 0;
  const color = tone === "dark"
    ? up ? "bg-emerald-300/15 text-emerald-200" : "bg-rose-300/15 text-rose-200"
    : up ? "bg-emerald-600/10 text-emerald-700" : "bg-rose-600/10 text-rose-700";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${color}`}
    >
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/** Small pill used for the one-line context under a figure. */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium leading-none text-kpi-ink-muted ring-1 ring-inset ring-black/5">
      {children}
    </span>
  );
}

/** Donut used by percentage tiles (profile completeness). */
export function Ring({ value, size = 76 }: { value: number; size?: number }) {
  const pct = Math.min(100, Math.max(0, value));
  // Stroke scales with the ring so a small ring keeps room for its label, and
  // the radius keeps the whole stroke width inside the box.
  const stroke = Math.max(5, Math.round(size * 0.12));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = pct > 0.05;
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 overflow-visible"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(15,23,42,0.10)"
          strokeWidth={stroke}
        />
        {filled ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-chart-blue"
            strokeWidth={stroke}
            strokeLinecap={pct >= 99.9 ? "butt" : "round"}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
          />
        ) : null}
      </svg>
      <span
        className="absolute font-semibold tabular-nums leading-none tracking-tight text-kpi-ink"
        style={{ fontSize: Math.max(9, Math.round(size * 0.19)) }}
      >
        {pct.toFixed(1)}%
      </span>
    </span>
  );
}

/** Labelled sub-list, e.g. the "Improvement" column on a wide tile. */
export function BreakdownList({ title, items }: { title: string; items: Breakdown[] }) {
  return (
    <div className="min-w-[132px] border-l border-black/10 pl-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kpi-ink-muted">
        {title}
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((b) => {
          const Icon = BREAKDOWN_ICON[b.label];
          return (
            <li key={b.label} className="flex items-center gap-2 text-[12px] text-kpi-ink-muted">
              {Icon ? <Icon size={12} className="shrink-0 opacity-60" /> : null}
              <span className="font-semibold tabular-nums text-kpi-ink">{b.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BreakdownRow({ items }: { items: Breakdown[] }) {
  return (
    <ul className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((b) => {
        const Icon = BREAKDOWN_ICON[b.label];
        return (
          <li key={b.label} className="flex items-center gap-1.5 text-[11.5px] text-kpi-ink-muted">
            {Icon ? <Icon size={12} className="shrink-0 opacity-60" /> : null}
            <span className="font-semibold tabular-nums text-kpi-ink">{b.value}</span>
            <span className="sr-only">{b.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The single KPI tile used across OTA Analytics and the Guest Journey.
 *
 * Light solid colour surface, dark ink figures, one explainer behind the info
 * icon, and a fixed rhythm: label → figure → context pill → breakdown → footer.
 */
export function StatCard({
  label,
  value,
  hint,
  suffix,
  note,
  ring,
  delta,
  breakdown,
  aside,
  accent = "slate",
  active,
  onClick,
  comparison,
  custom,
  footer,
  appearance = "glass",
}: {
  label: string;
  value: string;
  hint?: string;
  /** Muted qualifier printed next to the label, e.g. "(after cleanup)". */
  suffix?: string;
  /** One-line context pill under the figure. */
  note?: string;
  /** Renders a donut instead of a plain percentage. */
  ring?: number;
  delta?: number;
  breakdown?: Breakdown[];
  aside?: ReactNode;
  accent?: Accent;
  active?: boolean;
  onClick?: () => void;
  comparison?: ComparisonMode;
  custom?: CustomComparison;
  footer?: ReactNode;
  /** Kept for compatibility; every tile is a light solid surface now. */
   appearance?: "solid" | "glass";
}) {
  const Wrapper = onClick ? "button" : "div";
  const showDelta = comparison && comparison !== "none" && typeof delta === "number";
  // "solid" tiles carry the saturated surface; anything else stays light.
  const vivid = appearance === "solid";

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`group relative flex min-h-44 w-full flex-col rounded-lg border p-5 text-left shadow-kpi transition-all duration-200 hover:z-30 ${
        vivid ? `${VIVID_ACCENT[accent]} border-transparent text-kpi-vivid-foreground` : `${ACCENT[accent]} ${ACCENT_RULE[accent]} border-t-2 border-black/5 text-kpi-ink`
      } ${
        active ? "outline outline-2 outline-offset-2 outline-slate-900" : ""
      } ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-pop" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={`truncate text-[12.5px] font-semibold ${vivid ? "text-kpi-vivid-foreground" : "text-kpi-ink"}`}>{label}</span>
          {suffix ? (
            <span className={`shrink-0 text-[11px] font-normal ${vivid ? "text-kpi-vivid-muted" : "text-kpi-ink-muted"}`}>{suffix}</span>
          ) : null}
          {hint ? <InfoTip title={label} tone={vivid ? "dark" : "light"}>{hint}</InfoTip> : null}
        </span>
        {active ? (
          <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white">
            On chart
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[30px] font-semibold leading-none tabular-nums tracking-tight ${vivid ? "text-kpi-vivid-foreground" : "text-kpi-ink"}`}>
            {value}
          </p>
          {note ? <p className={`mt-2.5 text-[11px] ${vivid ? "text-kpi-vivid-muted" : "text-kpi-ink-muted"}`}>{note}</p> : null}
          {breakdown ? vivid ? (
            <ul className="mt-4 grid grid-cols-3 gap-3 border-t border-white/15 pt-3">
              {breakdown.map((b) => <li key={b.label} className="min-w-0"><span className="block text-[10px] text-kpi-vivid-muted">{b.label}</span><span className="mt-1 block truncate text-[14px] font-semibold tabular-nums text-kpi-vivid-foreground">{b.value}</span></li>)}
            </ul>
          ) : <BreakdownRow items={breakdown} /> : null}
        </div>
        {typeof ring === "number" ? <Ring value={ring} /> : null}
        {aside}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-5">
        {footer ?? (
          <>
            {showDelta ? (
              <>
                <Delta value={delta} tone={vivid ? "dark" : "light"} />
                <span className={`truncate text-[11px] ${vivid ? "text-kpi-vivid-muted" : "text-kpi-ink-muted"}`}>
                  vs. {comparisonCaption(comparison!, custom).toLowerCase()}
                </span>
              </>
            ) : (
              <span className={`text-[11px] ${vivid ? "text-kpi-vivid-muted" : "text-kpi-ink-muted"}`}>No comparison data</span>
            )}
          </>
        )}
      </div>
    </Wrapper>
  );
}
