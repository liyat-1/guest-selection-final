import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, GitCompareArrows } from "lucide-react";
import {
  COMPARISONS,
  dayCount,
  rangeLabel,
  type ComparisonMode,
  type CustomComparison,
  type DateRange,
} from "@/lib/comparison";

const inputClass =
  "h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-medium tabular-nums text-slate-900 outline-none transition-colors focus:border-slate-900";

function RangeFields({
  label,
  range,
  onChange,
}: {
  label: string;
  range: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <input
          type="date"
          aria-label={`${label} start date`}
          value={range.start}
          onChange={(e) => onChange({ ...range, start: e.target.value })}
          className={inputClass}
        />
        <span aria-hidden className="text-[11px] text-slate-400">
          →
        </span>
        <input
          type="date"
          aria-label={`${label} end date`}
          value={range.end}
          onChange={(e) => onChange({ ...range, end: e.target.value })}
          className={inputClass}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        {rangeLabel(range)} · {dayCount(range)} days
      </p>
    </div>
  );
}

/**
 * "Compared to" filter.
 *
 * One compact button that opens a normal dropdown. Choosing Custom reveals the
 * two date windows inside that same dropdown, so nothing on the page shifts.
 */
export function ComparisonPicker({
  mode,
  onMode,
  custom,
  onCustom,
}: {
  mode: ComparisonMode;
  onMode: (m: ComparisonMode) => void;
  custom: CustomComparison;
  onCustom: (c: CustomComparison) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = COMPARISONS.find((c) => c.value === mode);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[12.5px] font-semibold text-slate-800 shadow-card transition-colors ${
          open ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <GitCompareArrows size={14} className="shrink-0 text-slate-400" />
        <span className="truncate">
          {mode === "custom" ? rangeLabel(custom.compare) : (current?.label ?? "No comparison")}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[80] mt-2 w-[288px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop"
        >
          <p className="border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Compared to
          </p>
          <div className="max-h-[260px] overflow-y-auto p-1.5">
            {COMPARISONS.map((c) => {
              const selected = c.value === mode;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    onMode(c.value);
                    if (c.value !== "custom") setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                    selected
                      ? "bg-slate-900 font-semibold text-white"
                      : "font-medium text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{c.label}</span>
                  {selected ? <Check size={14} className="shrink-0" /> : null}
                </button>
              );
            })}
          </div>

          {mode === "custom" ? (
            <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-3.5">
              <RangeFields
                label="Analyze"
                range={custom.analyze}
                onChange={(analyze) => onCustom({ ...custom, analyze })}
              />
              <RangeFields
                label="Compare"
                range={custom.compare}
                onChange={(compare) => onCustom({ ...custom, compare })}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-full rounded-lg bg-slate-900 text-[12px] font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Apply comparison
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
