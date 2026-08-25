import { ArrowDownRight, ArrowUpRight, Home, Mail, Phone } from "lucide-react";
import { InfoTip } from "@/components/ota/InfoTip";
import {
  CAPTURE_KINDS,
  CAPTURE_LABEL_LONG,
  captureBySource,
  captureMomentum,
  feedbackOutcomes,
  messageCapture,
  stageCapture,
  type CaptureKind,
  type CaptureRow,
} from "@/lib/guestData";
import {
  COLLECTION_NOTE,
  PERIOD_LABEL,
  messageCollectionNote,
  winbackDirect,
} from "@/lib/guestCollection";
import type { Period, StageId } from "@/lib/otaJourney";

const ICON: Record<CaptureKind, typeof Mail> = {
  email: Mail,
  phone: Phone,
  address: Home,
};

/** Chart metric id per collected information type. */
const METRIC: Record<CaptureKind, string> = {
  email: "collected_email",
  phone: "collected_phone",
  address: "collected_address",
};

/** Opens the focused chart for one metric. */
export type MetricOpen = (metric: string, title: string, context: string) => void;

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
        up ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </p>
  );
}

/** The timeframe every number in this block is measured over. */
function Timeframe({ period }: { period: Period }) {
  return (
    <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
      {PERIOD_LABEL[period]}
    </span>
  );
}

/** One short line explaining what this collected number means. */
function CollectionTip({
  kind,
  stageId,
  note,
}: {
  kind: CaptureKind;
  stageId: StageId;
  note?: string;
}) {
  return (
    <InfoTip title={`${CAPTURE_LABEL_LONG[kind]} collected`}>
      {note ?? COLLECTION_NOTE[stageId]}
    </InfoTip>
  );
}

/** Three full-width tiles: one per information type collected. */
function CollectedTiles({
  rows,
  stageId,
  period,
  onMetric,
}: {
  rows: CaptureRow[];
  stageId: StageId;
  period: Period;
  onMetric?: MetricOpen;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {rows.map((r) => {
        const Icon = ICON[r.key];
        const title = `${CAPTURE_LABEL_LONG[r.key]} collected`;
        const body = (
          <>
            <div className="min-w-0">
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500">
                <Icon size={12} className="shrink-0 text-slate-400" />
                <span className="truncate">{CAPTURE_LABEL_LONG[r.key]}</span>
                <CollectionTip kind={r.key} stageId={stageId} />
              </span>
              <span className="mt-1 block text-[20px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
                {r.value}
              </span>
            </div>
            <Delta value={captureMomentum(stageId, r.key)} />
          </>
        );
        const shell =
          "flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface px-3.5 py-3 text-left";

        return onMetric ? (
          <button
            key={r.key}
            type="button"
            onClick={() => onMetric(METRIC[r.key], title, "Guest info collected")}
            className={`${shell} transition-colors hover:border-slate-300 hover:bg-slate-50`}
          >
            {body}
          </button>
        ) : (
          <div key={r.key} className={shell}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/** Compact matrix: one row per source, one column per information type. */
function SourceMatrix({ period }: { period: Period }) {
  const rows = captureBySource(period);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Source
            </th>
            {CAPTURE_KINDS.map((k) => (
              <th
                key={k}
                className="px-3 py-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                {CAPTURE_LABEL_LONG[k]}
              </th>
            ))}
            <th className="px-3.5 py-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Guests
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((s) => (
            <tr key={s.key} className="transition-colors hover:bg-slate-50/70">
              <td className="px-3.5 py-2.5">
                <p className="text-[12.5px] font-semibold text-slate-900">{s.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{s.hint}</p>
              </td>
              {CAPTURE_KINDS.map((k) => (
                <td
                  key={k}
                  className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-slate-900"
                >
                  {s.counts[k]}
                </td>
              ))}
              <td className="px-3.5 py-2.5 text-right">
                <p className="text-[13px] font-semibold tabular-nums text-slate-900">{s.guests}</p>
                <span className="mt-0.5 inline-flex items-center gap-1.5">
                  <Delta value={s.momentum} />
                  <span className="text-[11px] text-slate-400">{s.rate}% rate</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackOutcomes({ period }: { period: Period }) {
  const outcomes = feedbackOutcomes(period);
  const bar = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    neutral: "bg-slate-300",
  } as const;
  const dot = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    neutral: "bg-slate-400",
  } as const;
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {outcomes.map((o) => (
        <div key={o.key} className="rounded-lg border border-surface-border bg-surface px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500">
            <span aria-hidden className={`size-1.5 rounded-full ${dot[o.tone]}`} />
            {o.label}
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-[20px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
              {o.value}
            </span>
            <span className="text-[11.5px] font-semibold tabular-nums text-slate-500">
              {o.share}%
            </span>
          </p>
          <span
            aria-hidden
            className="mt-2.5 block h-1 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <span
              className={`block h-full rounded-full ${bar[o.tone]}`}
              style={{ width: `${o.share}%` }}
            />
          </span>
          <p className="mt-2 text-[11px] leading-snug text-slate-500">{o.hint}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Win-back spends previously collected information instead of collecting more,
 * so it reports direct-booking outcomes here.
 */
function WinbackDirect({ period, onMetric }: { period: Period; onMetric?: MetricOpen }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {winbackDirect(period).map((k) => {
        const body = (
          <>
            <span className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500">
                {k.label}
                <InfoTip title={k.label}>{k.hint}</InfoTip>
              </span>
              <Delta value={k.momentum} />
            </span>
            <span className="mt-1 block text-[20px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
              {k.value}
            </span>
          </>
        );
        const shell =
          "block w-full rounded-lg border border-surface-border bg-surface px-3.5 py-3 text-left";
        return onMetric ? (
          <button
            key={k.key}
            type="button"
            onClick={() => onMetric(k.metric, k.label, "Win-back direct bookings")}
            className={`${shell} transition-colors hover:border-slate-300 hover:bg-slate-50`}
          >
            {body}
          </button>
        ) : (
          <div key={k.key} className={shell}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/** Stage-level guest-information block shown inside every journey stage card. */
export function StageGuestData({
  stageId,
  period,
  onMetric,
}: {
  stageId: StageId;
  period: Period;
  /** Natural-language stage timing, e.g. "3 days before arrival" (kept for callers). */
  stageTiming?: string;
  onMetric?: MetricOpen;
}) {
  const rows = stageCapture(stageId, period);
  const winback = stageId === "retain";

  return (
    <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow>{winback ? "Direct bookings from win-back" : "Guest info collected"}</Eyebrow>
        <Timeframe period={period} />
      </div>
      <div className="mt-2.5">
        {winback ? (
          <WinbackDirect period={period} onMetric={onMetric} />
        ) : (
          <CollectedTiles rows={rows} stageId={stageId} period={period} onMetric={onMetric} />
        )}
      </div>

      {stageId === "during_stay" ? (
        <div className="mt-4">
          <Eyebrow>By collection source</Eyebrow>
          <div className="mt-2">
            <SourceMatrix period={period} />
          </div>
        </div>
      ) : null}

      {stageId === "post_checkout" ? (
        <div className="mt-4">
          <Eyebrow>Feedback outcomes</Eyebrow>
          <div className="mt-2">
            <FeedbackOutcomes period={period} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Per-message collection strip used inside sequence cards. */
export function MessageGuestData({
  stageId,
  msgId,
  period = "30d",
  timing,
  first,
  onMetric,
}: {
  stageId: StageId;
  msgId: string;
  period?: Period;
  /** Sequence timing of this message — drives the collection period. */
  timing?: string;
  first?: boolean;
  onMetric?: MetricOpen;
}) {
  const rows = messageCapture(stageId, msgId, period);
  const note = timing ? messageCollectionNote(stageId, timing, Boolean(first)) : undefined;

  return (
    <div className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow>Guest info collected</Eyebrow>
        <Timeframe period={period} />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {rows.map((r) => {
          const Icon = ICON[r.key];
          const body = (
            <>
              <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-medium text-slate-500">
                <Icon size={12} className="shrink-0 text-slate-400" />
                <span className="truncate">{CAPTURE_LABEL_LONG[r.key]}</span>
                <CollectionTip kind={r.key} stageId={stageId} note={note} />
              </span>
              <span className="text-[15px] font-semibold tabular-nums tracking-tight text-slate-900">
                {r.value}
              </span>
            </>
          );
          const shell =
            "flex items-center justify-between gap-2 rounded-md border border-surface-border bg-surface px-3 py-2 text-left";
          return onMetric ? (
            <button
              key={r.key}
              type="button"
              onClick={() =>
                onMetric(METRIC[r.key], `${CAPTURE_LABEL_LONG[r.key]} collected`, "Message")
              }
              className={`${shell} w-full transition-colors hover:border-slate-300`}
            >
              {body}
            </button>
          ) : (
            <div key={r.key} className={shell}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
