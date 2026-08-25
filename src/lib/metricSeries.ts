/**
 * Contextual chart model.
 *
 * Every KPI on the Analytics page and every metric on a Guest Journey card
 * maps to a chart that suits the shape of that metric: a single trend line, a
 * multi-series line for email / phone / address, a percentage line for rates,
 * grouped bars for engagement actions, or a progression for Win-back.
 */

import {
  compareScale,
  dayCount,
  hasComparison,
  type ComparisonMode,
  type CustomComparison,
} from "./comparison";

export type ChartKind = "line" | "multiline" | "percent" | "bar" | "progression";

export type SeriesKey = { id: string; label: string; color: string };

export type ChartSpec = {
  kind: ChartKind;
  keys: SeriesKey[];
  /** Format the axis and tooltip as currency. */
  money?: boolean;
  /** Values are already percentages. */
  percent?: boolean;
  /** Offer Total / Email / Phone / Address switching. */
  toggles?: boolean;
  caption: string;
};

const BLUE = "var(--chart-blue)";
const TEAL = "var(--chart-teal)";
const EMERALD = "var(--chart-emerald)";
const AMBER = "var(--chart-amber)";
const INDIGO = "var(--chart-indigo)";
const SLATE = "var(--chart-neutral)";

const k = (id: string, label: string, color: string): SeriesKey => ({ id, label, color });

/** 30-day totals (or the rate itself for percentage series). */
const TOTAL_30: Record<string, number> = {
  bookings: 12483,

  masked_email: 4180,
  masked_phone: 4640,
  masked_address: 2420,

  missing_email: 1460,
  missing_phone: 1810,
  missing_address: 2260,

  valid: 8420,
  improved: 3820,
  final: 11240,
  final_email: 4620,
  final_phone: 3960,
  final_address: 2660,

  valid_completeness: 68,
  improved_completeness: 84,
  final_completeness: 91,

  complete_profiles: 10230,

  collected_total: 15540,
  collected_email: 6420,
  collected_phone: 5180,
  collected_address: 3940,

  reached: 8240,
  reached_email: 5310,
  reached_text: 2930,
  engaged: 3131,

  email_clicks: 1820,
  email_responses: 640,
  email_calls: 214,
  text_clicks: 812,
  text_responses: 486,
  text_calls: 128,

  clicks: 2632,
  reviews: 3960,
  direct_bookings: 642,
  revenue: 84200,

  ctr: 14.5,
  engagement_rate: 38,
  conversion_rate: 7.8,
  commission_rate: 0.55,
};

const SPECS: Record<string, ChartSpec> = {
  bookings: {
    kind: "line",
    keys: [k("bookings", "Booking analyzed", BLUE)],
    caption: "OTA booking records received over time.",
  },
  masked: {
    kind: "multiline",
    keys: [
      k("masked_email", "Email", BLUE),
      k("masked_phone", "Phone", TEAL),
      k("masked_address", "Address", AMBER),
    ],
    caption: "Masked contact details by information type.",
  },
  missing: {
    kind: "multiline",
    keys: [
      k("missing_email", "Email", BLUE),
      k("missing_phone", "Phone", TEAL),
      k("missing_address", "Address", AMBER),
    ],
    caption: "Information the OTA never provided, by type.",
  },
  quality: {
    kind: "multiline",
    keys: [
      k("valid", "Valid", EMERALD),
      k("improved", "Improved", AMBER),
      k("final", "Final", BLUE),
    ],
    caption: "Valid received, information improved, and final usable information.",
  },
  /** One chart behind the whole Data quality card. */
  data_quality: {
    kind: "multiline",
    keys: [
      k("valid", "Valid", EMERALD),
      k("improved", "Improved", AMBER),
      k("final", "Final", BLUE),
      k("complete_profiles", "Complete profiles", INDIGO),
    ],
    caption:
      "Valid received, information improved, final usable information, and fully complete guest profiles.",
  },
  completeness: {
    kind: "percent",
    keys: [
      k("valid_completeness", "Valid", EMERALD),
      k("improved_completeness", "Improved", AMBER),
      k("final_completeness", "Final", BLUE),
    ],
    caption: "Profile completeness on its own percentage scale.",
  },
  valid: {
    kind: "multiline",
    keys: [k("valid", "Valid", EMERALD), k("final", "Final", BLUE)],
    caption: "Valid information received, against final usable information.",
  },
  improved: {
    kind: "multiline",
    keys: [k("improved", "Improved", AMBER), k("final", "Final", BLUE)],
    caption: "Information recovered through cleanup, against the final result.",
  },
  final: {
    kind: "multiline",
    toggles: true,
    keys: [
      k("final", "Total", BLUE),
      k("final_email", "Email", INDIGO),
      k("final_phone", "Phone", TEAL),
      k("final_address", "Address", AMBER),
    ],
    caption: "Final usable guest information passed into the guest journey.",
  },
  collected: {
    kind: "multiline",
    toggles: true,
    keys: [
      k("collected_total", "Total", BLUE),
      k("collected_email", "Email", INDIGO),
      k("collected_phone", "Phone", TEAL),
      k("collected_address", "Address", AMBER),
    ],
    caption: "Real guest information collected through the guest journey.",
  },

  reached: {
    kind: "line",
    keys: [k("reached", "Guests reached", BLUE)],
    caption: "Guests contacted through the guest journey.",
  },
  engaged: {
    kind: "line",
    keys: [k("engaged", "Guests engaged", TEAL)],
    caption: "Guests who interacted with a message or landing experience.",
  },
  email_engagement: {
    kind: "bar",
    keys: [
      k("email_clicks", "Clicks", BLUE),
      k("email_responses", "Responses", INDIGO),
      k("email_calls", "Calls", TEAL),
    ],
    caption: "Email engagement split by the action the guest took.",
  },
  text_engagement: {
    kind: "bar",
    keys: [
      k("text_clicks", "Clicks", BLUE),
      k("text_responses", "Responses", INDIGO),
      k("text_calls", "Calls", TEAL),
    ],
    caption: "Text engagement split by the action the guest took.",
  },
  channel_dominance: {
    kind: "bar",
    keys: [k("reached_email", "Email", INDIGO), k("reached_text", "Text", TEAL)],
    caption: "Which channel is actually carrying the reach.",
  },
  direct_bookings: {
    kind: "line",
    keys: [k("direct_bookings", "Direct bookings", EMERALD)],
    caption: "Bookings made directly with the hotel.",
  },
  conversion_rate: {
    kind: "percent",
    keys: [k("conversion_rate", "Booking conversion rate", EMERALD)],
    caption: "Share of guests reached who booked direct.",
  },
  revenue: {
    kind: "line",
    money: true,
    keys: [k("revenue", "Direct revenue", EMERALD)],
    caption: "Revenue from direct bookings.",
  },
  commission_rate: {
    kind: "percent",
    keys: [k("commission_rate", "Effective commission rate", SLATE)],
    caption: "Blended commission across OTA and direct stays.",
  },

  ctr: {
    kind: "percent",
    keys: [k("ctr", "Click-through rate", BLUE)],
    caption: "Click-through rate over time.",
  },
  engagement_rate: {
    kind: "percent",
    keys: [k("engagement_rate", "Engagement rate", TEAL)],
    caption: "Engagement rate over time.",
  },
  clicks: {
    kind: "line",
    keys: [k("clicks", "Clicks", BLUE)],
    caption: "Clicks over time.",
  },
  reviews: {
    kind: "bar",
    keys: [k("reviews", "Reviews generated", AMBER)],
    caption: "Reviews generated per period.",
  },
  winback: {
    kind: "progression",
    keys: [
      k("reached", "Guests reached", BLUE),
      k("clicks", "Clicks", INDIGO),
      k("direct_bookings", "Direct bookings", EMERALD),
    ],
    caption: "Guests reached → clicks → direct bookings.",
  },
};

export type MetricId = keyof typeof SPECS | string;

export function chartSpec(metric: MetricId): ChartSpec {
  return SPECS[metric] ?? SPECS.reached!;
}

export function hasChart(metric: MetricId) {
  return Boolean(SPECS[metric]);
}

/** Stable pseudo-random wobble so a chart reads like real traffic. */
function wobble(i: number, seed: number) {
  const x = Math.sin((i + 1) * (12.9898 + seed)) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.3;
}

function seedOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 313;
  return h / 40;
}

export type ChartRow = Record<string, number | string | null> & { date: string };

export type ChartOptions = {
  days: number;
  comparison: ComparisonMode;
  custom?: CustomComparison;
  /** Scales the whole chart, e.g. down to one journey stage. */
  factor?: number;
  /** Restrict a toggled multi-series chart to one series. */
  only?: string;
};

const END = new Date(Date.UTC(2026, 7, 17));

export function chartRows(metric: MetricId, options: ChartOptions): ChartRow[] {
  const spec = chartSpec(metric);
  const { days, comparison, custom, factor = 1, only } = options;
  const keys = only ? spec.keys.filter((s) => s.id === only) : spec.keys;
  const step = days > 45 ? 3 : days > 20 ? 2 : 1;
  const withCompare = hasComparison(days, comparison, custom);
  const cScale = compareScale(comparison);
  const rows: ChartRow[] = [];

  if (spec.kind === "progression") {
    return keys.map((s) => ({
      date: s.label,
      value: Math.round(((TOTAL_30[s.id] ?? 0) * days * factor) / 30),
      previous: withCompare
        ? Math.round(((TOTAL_30[s.id] ?? 0) * days * factor * cScale) / 30)
        : null,
    }));
  }

  for (let i = days - 1; i >= 0; i -= step) {
    const d = new Date(END);
    d.setUTCDate(END.getUTCDate() - i);
    const row: ChartRow = {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    };
    const trend = 1 + ((days - i) / days) * 0.2;
    for (const s of keys) {
      const total = TOTAL_30[s.id] ?? 0;
      const seed = seedOf(s.id);
      if (spec.percent) {
        const v = total * trend * (1 + wobble(i, seed) * 0.35);
        row[s.id] = Math.round(v * 10) / 10;
        row[`prev_${s.id}`] = withCompare ? Math.round(v * cScale * 10) / 10 : null;
      } else {
        const base = (total / 30) * step * factor;
        row[s.id] = Math.max(0, Math.round(base * trend * (1 + wobble(i, seed))));
        row[`prev_${s.id}`] = withCompare
          ? Math.max(0, Math.round(base * cScale * (1 + wobble(i + 40, seed))))
          : null;
      }
    }
    rows.push(row);
  }
  return rows;
}

export function periodDays(days: number) {
  return days;
}

export function customDays(custom: CustomComparison) {
  return dayCount(custom.analyze);
}
