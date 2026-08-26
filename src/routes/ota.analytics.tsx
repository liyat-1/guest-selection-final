import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Home, Mail, Phone } from "lucide-react";
import { Select } from "@/components/editor/Select";
import { ComparisonPicker } from "@/components/ota/ComparisonPicker";
import { MetricChart } from "@/components/ota/MetricChart";
import { Delta, Ring, StatCard, type Accent } from "@/components/ota/StatCard";
import { InfoTip } from "@/components/ota/InfoTip";
import { chartSpec } from "@/lib/metricSeries";
import {
  DEFAULT_CUSTOM,
  adjustDelta,
  comparisonCaption,
  hasComparison,
  type ComparisonMode,
  type CustomComparison,
} from "@/lib/comparison";
import {
  ANALYTICS_DAYS,
  ANALYTICS_PERIODS,
  capturedIncoming,
  capturedProgression,
  convertedActivity,
  convertedImpact,
  engineRows,
  stageRows,
  type AnalyticsPeriod,
  type CapturedCard,
} from "@/lib/otaAnalytics";

export const Route = createFileRoute("/ota/analytics")({
  head: () => ({
    meta: [
      { title: "OTA Analytics — OTA Buster · Directful" },
      {
        name: "description",
        content:
          "Follow OTA guest information from the moment it arrives to the direct bookings it produces: booking analyzed, usable guest info, guests reached, engagement and direct revenue.",
      },
      { property: "og:title", content: "OTA Analytics — Directful" },
      {
        property: "og:description",
        content:
          "Captured and Converted, told as one story: guest info received, guest info improved, guests reached, guests engaged, direct bookings and revenue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OtaAnalyticsScreen,
});

/* ------------------------------ small parts ----------------------------- */

function Panel({
  title,
  subtitle,
  action,
  children,
  flush,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="ota-glass overflow-hidden rounded-2xl border text-ota-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ota-border px-6 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-semibold text-ota-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-[12.5px] text-ota-muted">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className={flush ? "" : "p-6"}>{children}</div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-[19px] font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

/**
 * Column palette for the Valid → Improved → Final story.
 *
 * Hues follow the Okabe–Ito colour-blind–safe set (bluish green, orange,
 * reddish purple) so the three steps stay separable for deuteranopia and
 * protanopia. Colour never carries meaning alone: every step also has its own
 * label, bar length and position in the sequence.
 */
const QUALITY_TONE: Record<
  string,
  { text: string; chip: string; icon: string; bar: string; rail: string }
> = {
  valid: {
    text: "text-chart-teal",
    chip: "bg-kpi-teal text-kpi-ink",
    icon: "text-chart-teal",
    bar: "bg-chart-teal",
    rail: "bg-chart-teal",
  },
  improved: {
    text: "text-chart-amber",
    chip: "bg-kpi-amber text-kpi-ink",
    icon: "text-chart-amber",
    bar: "bg-chart-amber",
    rail: "bg-chart-amber",
  },
  final: {
    text: "text-chart-violet",
    chip: "bg-kpi-violet text-kpi-ink",
    icon: "text-chart-violet",
    bar: "bg-chart-violet",
    rail: "bg-chart-violet",
  },
};

const BREAKDOWN_ICON = { Email: Mail, Phone: Phone, Address: Home } as const;

/** Per-line momentum, derived from the card delta so it moves with the comparison. */
const LINE_FACTOR: Record<string, number> = { Email: 1, Phone: 0.72, Address: 0.48 };

const toNumber = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;

/**
 * Direction is shown with an arrow glyph as well as colour, so the read-out
 * survives red/green colour blindness and greyscale printing.
 */
function LineDelta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 text-[10.5px] font-semibold tabular-nums ${
        up ? "text-chart-teal" : "text-rose-700"
      }`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/**
 * Information quality, told in ONE card.
 *
 * Valid → Improved → Final read left to right as a single transformation: a
 * headline figure, a proportional bar that makes the magnitude readable at a
 * glance, its completeness chip, and the Email / Phone / Address detail behind
 * it — each line carrying its own momentum against the active comparison.
 */
function QualityCard({
  cards,
  selected,
  onSelect,
  comparison,
  custom,
  delta,
  days,
}: {
  cards: CapturedCard[];
  selected: string;
  onSelect: (chart: string) => void;
  comparison: ComparisonMode;
  custom: CustomComparison;
  delta: (base: number) => number;
  days: number;
}) {
  const steps = cards.filter((c) => c.step);
  const completeness = cards.find((c) => c.key === "completeness");
  const showDelta = comparison !== "none";
  const caption = comparisonCaption(comparison, custom).toLowerCase();
  const peak = Math.max(1, ...steps.map((c) => toNumber(c.value)));

  return (
    <section className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(470px,1fr)_minmax(0,1fr)]">
      <div className="ota-glass flex min-w-0 flex-col overflow-hidden rounded-2xl border">
        <header className="flex items-start justify-between gap-4 border-b border-ota-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-semibold text-slate-900">
              Information quality
            </h2>
            <p className="mt-1 text-[12px] text-slate-500">
              How guest information progresses from received to usable
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {completeness ? (
              <span className="flex items-center gap-2 rounded-full border border-ota-border bg-slate-50 py-1 pl-1 pr-3">
                <Ring value={completeness.ring ?? 0} size={38} />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Complete
                </span>
              </span>
            ) : null}
            <InfoTip title="Information quality">
              Final guest information combines valid details with information successfully improved
              through cleanup.
            </InfoTip>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 items-stretch divide-y divide-slate-200 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:divide-y-0 sm:divide-x sm:divide-slate-200">
          {steps.map((c, i) => {
            const tone = QUALITY_TONE[c.step!];
            const on = selected === c.chart;
            const value = delta(c.delta);
            const share = Math.round((toNumber(c.value) / peak) * 100);
            return (
              <div key={c.key} className="contents">
                <button
                  type="button"
                  onClick={() => onSelect(c.chart ?? "quality")}
                  aria-pressed={on}
                  className={`flex min-w-0 flex-col px-5 py-5 text-left transition-colors ${
                    on ? "bg-slate-50" : "hover:bg-slate-50/70"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className={`h-3.5 w-1 rounded-full ${tone.rail}`} />
                    <span className={`text-[12.5px] font-semibold ${tone.text}`}>
                      {c.label.replace(" guest info", "")}
                    </span>
                  </span>

                  <span className="mt-3 block text-[28px] font-semibold leading-none tabular-nums tracking-tight text-slate-900">
                    {c.value}
                  </span>

                  {/* Proportional bar: magnitude readable without reading digits. */}
                  <span
                    aria-hidden
                    className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80"
                  >
                    <span
                      className={`block h-full rounded-full ${tone.bar}`}
                      style={{ width: `${Math.max(6, share)}%` }}
                    />
                  </span>

                  <span className="mt-3 flex h-6 items-center">
                    <span
                      className={`inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap ${tone.chip}`}
                    >
                      {c.note}
                    </span>
                  </span>
                  <span className="mt-2 flex h-5 items-center">
                    {showDelta ? (
                      <Delta value={value} />
                    ) : (
                      <span className="text-[10.5px] text-slate-400">No comparison</span>
                    )}
                  </span>


                  <ul className="mt-auto space-y-2 border-t border-slate-200/80 pt-3.5">
                    {(c.breakdown ?? []).map((b) => {
                      const Icon = BREAKDOWN_ICON[b.label as keyof typeof BREAKDOWN_ICON];
                      const line = Math.round(value * (LINE_FACTOR[b.label] ?? 1) * 10) / 10;
                      return (
                        <li key={b.label} className="flex items-baseline justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-slate-500">
                            {Icon ? <Icon size={12} className={`shrink-0 ${tone.icon}`} /> : null}
                            <span className="truncate">{b.label}</span>
                          </span>
                          <span className="flex shrink-0 items-baseline gap-1.5">
                            <span className="text-[12.5px] font-semibold tabular-nums text-slate-900">
                              {b.value}
                            </span>
                            {showDelta ? <LineDelta value={line} /> : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </button>
                {i < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="hidden items-center justify-center px-2 text-slate-300 sm:flex"
                  >
                    <ArrowRight size={16} />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="border-t border-slate-200 bg-slate-50/70 px-6 py-3 text-[11px] leading-relaxed text-slate-500">
          Final = Valid information + Successfully improved information
          {completeness ? ` · ${completeness.value} profile completeness` : ""}
          {showDelta ? ` · momentum vs. ${caption}` : ""}
        </p>
      </div>

      <Panel
        title="Information quality over time"
        subtitle="Valid, improved and final guest information in one view"
      >
        <MetricChart
          metric="quality"
          days={days}
          comparison={comparison}
          custom={custom}
          height={260}
        />
      </Panel>
    </section>
  );
}


function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/* -------------------------------- screen -------------------------------- */

type Tab = "captured" | "converted";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "captured", label: "Captured", hint: "Guest information your OTA engines handed over." },
  { id: "converted", label: "Converted", hint: "What that information produced once messaged." },
];

function OtaAnalyticsScreen() {
  const [tab, setTab] = useState<Tab>("captured");
  const [period, setPeriod] = useState<AnalyticsPeriod>("15d");
  const [comparisonPick, setComparisonPick] = useState<ComparisonMode>("previous");
  const [custom, setCustom] = useState<CustomComparison>(DEFAULT_CUSTOM);
  const [capturedChart, setCapturedChart] = useState<string>("quality");
  const [convertedChart, setConvertedChart] = useState<string>("reached");

  const days = ANALYTICS_DAYS[period];
  const comparison: ComparisonMode = hasComparison(days, comparisonPick, custom)
    ? comparisonPick
    : "none";

  const incoming = capturedIncoming(period);
  const progression = capturedProgression(period);
  const activity = convertedActivity(period);
  const impact = convertedImpact(period);

  const chart = tab === "captured" ? capturedChart : convertedChart;
  // The whole Data quality card shares one chart: Valid → Improved → Final.
  const QUALITY_KEYS = new Set(["valid", "improved", "final", "completeness"]);
  const isQuality = tab === "captured" && QUALITY_KEYS.has(capturedChart);
  const chartMetric = isQuality ? "quality" : chart;
  const spec = chartSpec(chartMetric);
  const chartTitle = isQuality ? "Data quality" : (spec.keys[0]?.label ?? "Metric");



  const delta = (base: number) => adjustDelta(base, comparison);

  const incomingAccent: Accent[] = ["blue", "violet", "indigo"];
  const activityAccent: Accent[] = ["blue", "indigo", "violet", "teal", "amber"];
  const impactAccent: Accent[] = ["emerald", "teal", "blue"];

  return (
    <div className="space-y-8 text-ota-foreground">
      {/* ------------------------------- header ------------------------------ */}
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-ota-border pb-4">
        <div><h1 className="font-display text-[28px] font-semibold text-ota-foreground">Analytics</h1></div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="w-44">
            <Select
              value={period}
              options={ANALYTICS_PERIODS.map((p) => ({ value: p.value, label: p.label }))}
              onChange={(v) => setPeriod(v)}
              size="sm"
              ariaLabel="Reporting period"
            />
          </div>

          <ComparisonPicker
            mode={comparisonPick}
            onMode={setComparisonPick}
            custom={custom}
            onCustom={setCustom}
          />
        </div>

      </header>

      {comparison === "none" && comparisonPick !== "none" ? (
        <p className="-mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-900">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
          We do not hold data that far back, so comparison read-outs are hidden for this window.
        </p>
      ) : null}


      <div className="-mt-8 flex gap-6 border-b border-ota-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            title={t.hint}
            className={`border-b-2 px-1 py-3 text-[13px] font-semibold transition-colors ${
              tab === t.id
                ? "border-chart-blue text-chart-blue"
                : "border-transparent text-ota-muted hover:text-ota-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "captured" ? (
        <div className="space-y-8">
          <section className="space-y-5">
            <div className="grid items-stretch gap-4 md:grid-cols-3">
              {incoming.map((c, i) => (
                <StatCard
                  key={c.key}
                  label={c.label}
                  value={c.value}
                  hint={c.hint}
                  delta={delta(c.delta)}
                  breakdown={c.breakdown}
                  accent={incomingAccent[i]}
                  comparison={comparison}
                  custom={custom}
                  active={Boolean(c.chart) && capturedChart === c.chart}
                  onClick={c.chart ? () => setCapturedChart(c.chart!) : undefined}
                  appearance="solid"
                />
              ))}
            </div>
          </section>

          <QualityCard
            cards={progression}
            selected={capturedChart}
            onSelect={setCapturedChart}
            comparison={comparison}
            custom={custom}
            delta={delta}
            days={days}
          />

          <Panel
            title="Performance by booking engine"
            subtitle="Which engines hand over the most guest info, and how much of it ends up usable."
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <Th>Booking engine</Th>
                    <Th right>Share of guests</Th>
                    <Th right>Booking analyzed</Th>
                    <Th right>Masked guest info</Th>
                    <Th right>Missing guest info</Th>
                    <Th right>Final guest info</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {engineRows(period).map((r) => (
                    <tr key={r.engine} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-900">
                        {r.engine}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center justify-end gap-2.5">
                          <span
                            aria-hidden
                            className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 sm:block"
                          >
                            <span
                              className="block h-full rounded-full bg-blue-500"
                              style={{ width: `${r.share * 2}%` }}
                            />
                          </span>
                          <span className="text-[13px] tabular-nums text-slate-600">
                            {r.share}%
                          </span>
                        </span>
                      </td>
                      {[r.analysed, r.masked, r.missing].map((v, i) => (
                        <td
                          key={i}
                          className="px-4 py-3.5 text-right text-[13px] tabular-nums text-slate-600"
                        >
                          {v}
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-right text-[13.5px] font-semibold tabular-nums text-slate-900">
                        {r.final}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-5">
            <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activity.map((c, i) => (
                <StatCard
                  key={c.key}
                  label={c.label}
                  value={c.value}
                  hint={c.hint}
                  delta={delta(c.delta)}
                  breakdown={c.breakdown}
                  accent={activityAccent[i]}
                  comparison={comparison}
                  custom={custom}
                  active={Boolean(c.chart) && convertedChart === c.chart}
                  onClick={c.chart ? () => setConvertedChart(c.chart!) : undefined}
                  appearance="solid"
                />
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="grid items-stretch gap-4 md:grid-cols-3">
              {impact.map((c, i) => (
                <StatCard
                  key={c.key}
                  label={c.label}
                  value={c.value}
                  hint={c.hint}
                  delta={delta(c.delta)}
                  breakdown={c.breakdown}
                  accent={impactAccent[i]}
                  comparison={comparison}
                  custom={custom}
                  active={Boolean(c.chart) && convertedChart === c.chart}
                  onClick={c.chart ? () => setConvertedChart(c.chart!) : undefined}
                  appearance="solid"
                />
              ))}
            </div>
          </section>

          <Panel title={chartTitle} subtitle={spec.caption}>
            <MetricChart
              metric={convertedChart}
              days={days}
              comparison={comparison}
              custom={custom}
            />
          </Panel>

          <Panel
            title="Performance by guest journey stage"
            subtitle="Where reach, engagement and direct bookings are coming from."
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <Th>Stage</Th>
                    <Th right>Guests reached</Th>
                    <Th right>Engagement</Th>
                    <Th right>Guest info collected</Th>
                    <Th right>Direct bookings</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stageRows(period).map((r) => (
                    <tr key={r.stage} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-900">
                        {r.stage}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13.5px] font-semibold tabular-nums text-slate-900">
                        {r.reached}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13px] tabular-nums text-slate-600">
                        {r.engagement}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[12px] tabular-nums text-slate-600">
                        <span className="inline-flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <Mail size={11} className="text-slate-400" />
                            {r.emails}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone size={11} className="text-slate-400" />
                            {r.phones}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Home size={11} className="text-slate-400" />
                            {r.addresses}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums text-slate-900">
                        {r.conversions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
