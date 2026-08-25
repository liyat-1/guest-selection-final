import { useMemo, useState } from "react";
import { Check, ChevronDown, Info, Mail, MessageSquare, Sparkles } from "lucide-react";
import { STAGES, type StageId } from "@/lib/otaJourney";
import {
  RECOMMENDATION_LABEL,
  STRATEGIES,
  STRATEGY_BY_ID,
  type StrategyId,
} from "@/lib/otaStrategy";

function StrategyIcons({ id }: { id: StrategyId }) {
  const both = id === "both" || id === "text_fallback";
  return (
    <span className="flex items-center gap-1 text-slate-400">
      {id !== "text" ? <Mail size={13} /> : null}
      {both || id === "text" ? <MessageSquare size={13} /> : null}
    </span>
  );
}

function StageChecklist({
  selected,
  onToggle,
  onAll,
  current,
}: {
  selected: StageId[];
  onToggle: (id: StageId) => void;
  onAll: (all: boolean) => void;
  current: Record<StageId, StrategyId>;
}) {
  const all = selected.length === STAGES.length;
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Select stages
        </span>
        <button
          type="button"
          onClick={() => onAll(!all)}
          className="text-[11.5px] font-semibold text-blue-700 hover:text-blue-800"
        >
          {all ? "Clear all" : "Select all stages"}
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {STAGES.map((s) => {
          const on = selected.includes(s.id);
          return (
            <li key={s.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-50">
                <span
                  className={`grid size-4 place-items-center rounded border transition-colors ${
                    on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {on ? <Check size={11} strokeWidth={3} /> : null}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => onToggle(s.id)}
                />
                <span className="min-w-0 flex-1 text-[13px] font-medium text-slate-800">
                  {s.name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  <StrategyIcons id={current[s.id]} />
                  {STRATEGY_BY_ID[current[s.id]].label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StrategyCard({
  id,
  active,
  onSelect,
}: {
  id: StrategyId;
  active: boolean;
  onSelect: () => void;
}) {
  const s = STRATEGY_BY_ID[id];
  const tag = RECOMMENDATION_LABEL[s.recommendation];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`w-full rounded-xl border p-3.5 text-left transition-[border-color,box-shadow,background-color] ${
        active
          ? "border-blue-600 bg-blue-50/50 shadow-card"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`grid size-4 shrink-0 place-items-center rounded-full border ${
              active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
            }`}
          >
            {active ? <Check size={10} strokeWidth={3} /> : null}
          </span>
          <span className="truncate text-[13.5px] font-semibold text-slate-900">{s.label}</span>
          <StrategyIcons id={id} />
        </span>
        {tag ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
              s.recommendation === "recommended"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
            }`}
          >
            {tag}
          </span>
        ) : null}
      </span>
      <span className="mt-1.5 block text-[12.5px] leading-relaxed text-slate-600">{s.summary}</span>
      {s.benchmark ? (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-500">
          <Sparkles size={11} className="text-amber-500" />
          Based on your campaign data · {s.benchmark}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Configure the messaging strategy once, apply it to any set of stages, and
 * override individual stages later from the journey itself.
 */
export function CampaignStrategyPanel({
  strategies,
  onApply,
}: {
  strategies: Record<StageId, StrategyId>;
  onApply: (stages: StageId[], strategy: StrategyId) => void;
}) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<StageId[]>([]);
  const [choice, setChoice] = useState<StrategyId>("both");
  const [applied, setApplied] = useState<{ count: number; label: string } | null>(null);

  const mixed = useMemo(() => new Set(STAGES.map((s) => strategies[s.id])).size > 1, [strategies]);

  const toggle = (id: StageId) => {
    setApplied(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <section
      id="campaign-strategy"
      className="rounded-xl border border-slate-200 bg-white shadow-card"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold tracking-tight text-slate-900">
            Campaign strategy
          </span>
          <span className="mt-1 block text-[13px] leading-relaxed text-slate-600">
            Choose how guests are messaged. Apply one strategy to several stages, then override a
            single stage whenever it needs something different.
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11.5px] font-medium text-slate-600 sm:inline">
            {mixed ? "Mixed across stages" : STRATEGY_BY_ID[strategies.just_booked].label}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open ? (
        <div className="grid gap-4 border-t border-slate-100 p-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <StageChecklist
            selected={selected}
            current={strategies}
            onToggle={toggle}
            onAll={(all) => {
              setApplied(null);
              setSelected(all ? STAGES.map((s) => s.id) : []);
            }}
          />

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Choose your messaging strategy
            </p>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              {STRATEGIES.map((s) => (
                <StrategyCard
                  key={s.id}
                  id={s.id}
                  active={choice === s.id}
                  onSelect={() => {
                    setApplied(null);
                    setChoice(s.id);
                  }}
                />
              ))}
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-500">
              <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
              Landing and success pages stay shared between email and text, so guests always get the
              same experience.
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={() => {
                  onApply(selected, choice);
                  setApplied({ count: selected.length, label: STRATEGY_BY_ID[choice].label });
                  setSelected([]);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-card transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              >
                {selected.length
                  ? `Apply ${STRATEGY_BY_ID[choice].label} to ${selected.length} stage${selected.length > 1 ? "s" : ""}`
                  : "Select stages to apply"}
              </button>
              {applied ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
                  <Check size={14} /> {applied.label} applied to {applied.count} stage
                  {applied.count > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
