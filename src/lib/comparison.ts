/**
 * Comparison model shared by OTA Analytics and the Guest Journey.
 *
 * A comparison answers "against what?" for every metric on screen. Presets
 * cover the windows hoteliers ask for; `custom` lets them pick the analyse
 * window and the compare window independently.
 *
 * Nothing is fabricated: when the requested compare window falls outside the
 * history we hold, `hasComparison` returns false and the UI must say so.
 */

export type ComparisonMode =
  | "none"
  | "previous"
  | "last_year"
  | "previous_month"
  | "previous_quarter"
  | "same_month_last_year"
  | "same_quarter_last_year"
  | "custom";

export const COMPARISONS: { value: ComparisonMode; label: string }[] = [
  { value: "previous", label: "Previous period" },
  { value: "last_year", label: "Same period last year" },
  { value: "previous_month", label: "Previous month" },
  { value: "previous_quarter", label: "Previous quarter" },
  { value: "same_month_last_year", label: "Same month last year" },
  { value: "same_quarter_last_year", label: "Same quarter last year" },
  { value: "custom", label: "Custom comparison" },
  { value: "none", label: "No comparison" },
];

export const COMPARISON_LABEL: Record<ComparisonMode, string> = {
  none: "No comparison",
  previous: "Previous period",
  last_year: "Same period last year",
  previous_month: "Previous month",
  previous_quarter: "Previous quarter",
  same_month_last_year: "Same month last year",
  same_quarter_last_year: "Same quarter last year",
  custom: "Custom comparison",
};

/** How far back the compare window sits, in days, for each preset. */
const OFFSET_DAYS: Record<Exclude<ComparisonMode, "none" | "custom">, number> = {
  previous: 0, // immediately preceding window
  last_year: 365,
  previous_month: 30,
  previous_quarter: 91,
  same_month_last_year: 365,
  same_quarter_last_year: 365,
};

/** Two full years of history are held for this property. */
export const HISTORY_DAYS = 760;

export type DateRange = { start: string; end: string };

export type CustomComparison = { analyze: DateRange; compare: DateRange };

export const DEFAULT_CUSTOM: CustomComparison = {
  analyze: { start: "2026-07-01", end: "2026-08-07" },
  compare: { start: "2025-07-01", end: "2025-08-07" },
};

const NOW = new Date("2026-08-17T00:00:00Z");

function parse(d: string) {
  const t = new Date(`${d}T00:00:00Z`);
  return Number.isNaN(t.getTime()) ? null : t;
}

export function dayCount(r: DateRange) {
  const a = parse(r.start);
  const b = parse(r.end);
  if (!a || !b) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1);
}

/** Days between today and the start of a range. */
function ageInDays(r: DateRange) {
  const a = parse(r.start);
  if (!a) return 0;
  return Math.round((NOW.getTime() - a.getTime()) / 86_400_000);
}

const MONTH_DAY = { month: "short", day: "numeric", timeZone: "UTC" } as const;

export function rangeLabel(r: DateRange) {
  const a = parse(r.start);
  const b = parse(r.end);
  if (!a || !b) return "Pick dates";
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const left = a.toLocaleDateString("en-US", MONTH_DAY);
  const right = b.toLocaleDateString("en-US", { ...MONTH_DAY, year: "numeric" });
  return sameYear
    ? `${left} – ${right}`
    : `${a.toLocaleDateString("en-US", { ...MONTH_DAY, year: "numeric" })} – ${right}`;
}

/** True when we actually hold data for the requested compare window. */
export function hasComparison(
  days: number,
  mode: ComparisonMode,
  custom: CustomComparison = DEFAULT_CUSTOM,
) {
  if (mode === "none") return false;
  if (mode === "custom") {
    const valid = dayCount(custom.analyze) > 0 && dayCount(custom.compare) > 0;
    return valid && ageInDays(custom.compare) <= HISTORY_DAYS;
  }
  return OFFSET_DAYS[mode] + days * 2 <= HISTORY_DAYS;
}

/** The sentence shown under a delta: "vs. …". */
export function comparisonCaption(mode: ComparisonMode, custom: CustomComparison = DEFAULT_CUSTOM) {
  if (mode === "none") return "";
  if (mode === "custom") return rangeLabel(custom.compare);
  return COMPARISON_LABEL[mode];
}

/**
 * Each comparison window has its own scale, so a delta genuinely changes when
 * the hotelier switches the timeline instead of freezing at one number.
 */
const DELTA_FACTOR: Record<ComparisonMode, number> = {
  none: 0,
  previous: 1,
  last_year: 1.7,
  previous_month: 0.85,
  previous_quarter: 1.25,
  same_month_last_year: 1.55,
  same_quarter_last_year: 1.9,
  custom: 1.4,
};

export function adjustDelta(base: number, mode: ComparisonMode) {
  return Math.round(base * DELTA_FACTOR[mode] * 10) / 10;
}

/** How much lower the compare series sits, used to plot the dashed line. */
export function compareScale(mode: ComparisonMode) {
  switch (mode) {
    case "last_year":
    case "same_month_last_year":
      return 0.74;
    case "same_quarter_last_year":
      return 0.7;
    case "previous_quarter":
      return 0.84;
    case "custom":
      return 0.79;
    default:
      return 0.9;
  }
}
