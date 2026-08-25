import { X } from "lucide-react";
import { MetricChart } from "@/components/ota/MetricChart";
import { comparisonCaption, type ComparisonMode, type CustomComparison } from "@/lib/comparison";
import { chartSpec, type MetricId } from "@/lib/metricSeries";

/** Focused chart for one journey metric, opened by clicking that metric. */
export function MetricOverlay({
  title,
  context,
  metric,
  days,
  comparison,
  custom,
  factor,
  onClose,
}: {
  title: string;
  context: string;
  metric: MetricId;
  days: number;
  comparison: ComparisonMode;
  custom?: CustomComparison;
  factor?: number;
  onClose: () => void;
}) {
  const spec = chartSpec(metric);
  return (
    <div
      className="fixed inset-0 z-[85] grid place-items-center bg-slate-900/45 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`${title} chart`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[760px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop duration-150 animate-in fade-in zoom-in-95"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              {context}
            </p>
            <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
              {title}
            </p>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {comparison === "none"
                ? "No comparison applied"
                : `Compared with ${comparisonCaption(comparison, custom).toLowerCase()}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chart"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={17} />
          </button>
        </header>
        <div className="p-5">
          <MetricChart
            metric={metric}
            days={days}
            comparison={comparison}
            custom={custom}
            factor={factor}
            height={spec.kind === "progression" ? 220 : 280}
          />
        </div>
      </div>
    </div>
  );
}
