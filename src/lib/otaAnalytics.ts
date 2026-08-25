/**
 * OTA Analytics — the reporting model behind the OTA Buster analytics page.
 *
 * One authoritative base set drives the whole story so no two cards can
 * contradict each other:
 *
 *   CAPTURED   booking analyzed → masked / missing info → valid → improved → final
 *   CONVERTED  guests reached → engaged → email/text engagement → bookings → revenue
 *
 * Deterministic sample data for the prototype.
 */

export type AnalyticsPeriod = "7d" | "15d" | "30d" | "90d" | "custom";

export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "15d", label: "Last 15 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
];

/** Comparison timeline. `none` disables every comparison read-out. */
export type ComparisonMode = "none" | "previous" | "last_year";

export const COMPARISONS: { value: ComparisonMode; label: string }[] = [
  { value: "previous", label: "vs. previous period" },
  { value: "last_year", label: "vs. same period last year" },
  { value: "none", label: "No comparison" },
];

const FACTOR: Record<AnalyticsPeriod, number> = {
  "7d": 0.24,
  "15d": 0.5,
  "30d": 1,
  "90d": 2.65,
  custom: 1.62,
};

const scale = (n: number, p: AnalyticsPeriod) => Math.round(n * FACTOR[p]);
export const fmt = (n: number) => n.toLocaleString("en-US");
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * Historical depth we actually hold, in days. Anything a comparison would need
 * beyond this has no data — the UI must say so rather than invent a delta.
 */
const HISTORY_DAYS = 240;

const DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "15d": 15,
  "30d": 30,
  "90d": 90,
  custom: 45,
};

export const ANALYTICS_DAYS: Record<AnalyticsPeriod, number> = DAYS;

/** True when a real comparison window exists for this period + mode. */
export function hasComparison(period: AnalyticsPeriod, mode: ComparisonMode) {
  if (mode === "none") return false;
  const need = mode === "last_year" ? 365 + DAYS[period] : DAYS[period] * 2;
  return need <= HISTORY_DAYS;
}

export const COMPARISON_LABEL: Record<ComparisonMode, string> = {
  none: "No comparison",
  previous: "Previous period",
  last_year: "Same period last year",
};

/* ------------------------------ base values ----------------------------- */

const BASE = {
  bookings: 12483,
  maskedEmail: 4180,
  maskedPhone: 4640,
  maskedAddress: 2420,
  missingEmail: 1460,
  missingPhone: 1810,
  missingAddress: 2260,
  valid: 8420,
  validEmail: 3480,
  validPhone: 2960,
  validAddress: 1980,
  improvedEmail: 1740,
  improvedPhone: 1260,
  improvedAddress: 820,
  final: 11240,
  finalEmail: 4620,
  finalPhone: 3960,
  finalAddress: 2660,


  reached: 8240,
  reachedEmail: 5310,
  reachedText: 2930,
  engaged: 3131,
  engagedEmail: 2064,
  engagedText: 1067,
  emailClicks: 1820,
  emailResponses: 640,
  emailCalls: 214,
  textClicks: 812,
  textResponses: 486,
  textCalls: 128,
  completeness: 91,
  bookings_direct: 642,
  revenue: 84200,
};

const improvedTotal = BASE.improvedEmail + BASE.improvedPhone + BASE.improvedAddress;

/* ------------------------------- captured ------------------------------- */

export type Breakdown = { label: string; value: string };

export type CapturedCard = {
  key: string;
  label: string;
  value: string;
  hint: string;
  /** Muted qualifier printed beside the label, e.g. "(after cleanup)". */
  suffix?: string;
  /** One-line context pill printed under the figure. */
  note?: string;
  /** Renders the figure as a donut instead of plain text. */
  ring?: number;
  /** Percentage delta vs. the comparison window, when one exists. */
  delta: number;
  breakdown?: Breakdown[];
  /** Rendered in the transformation row. */
  step?: "valid" | "improved" | "final";
  /** Chart shown when the hotelier clicks this card. */
  chart?: string;
};


export function capturedIncoming(period: AnalyticsPeriod): CapturedCard[] {
  const masked = BASE.maskedEmail + BASE.maskedPhone + BASE.maskedAddress;
  const missing = BASE.missingEmail + BASE.missingPhone + BASE.missingAddress;
  const analysed = scale(BASE.bookings, period);
  return [
    {
      key: "bookings",
      chart: "bookings",
      label: "Booking analyzed",
      value: fmt(analysed),
      hint: "Booking records received from your OTA engines and analyzed.",
      note: "100% baseline",
      delta: 4.1,
    },
    {
      key: "masked",
      chart: "masked",
      label: "Masked guest info",
      value: fmt(scale(masked, period)),
      hint: "Contact details the OTA handed over in masked form.",
      note: `${((masked / (BASE.bookings * 3)) * 300).toFixed(1)}% of bookings analyzed`,
      delta: 9.1,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.maskedEmail, period)) },
        { label: "Phone", value: fmt(scale(BASE.maskedPhone, period)) },
        { label: "Address", value: fmt(scale(BASE.maskedAddress, period)) },
      ],
    },
    {
      key: "missing",
      chart: "missing",
      label: "Missing guest info",
      value: fmt(scale(missing, period)),
      hint: "Details the OTA never provided with the booking.",
      note: `${((missing / (BASE.bookings * 3)) * 300).toFixed(1)}% of bookings analyzed`,
      delta: -7.9,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.missingEmail, period)) },
        { label: "Phone", value: fmt(scale(BASE.missingPhone, period)) },
        { label: "Address", value: fmt(scale(BASE.missingAddress, period)) },
      ],
    },
  ];
}

export function capturedProgression(period: AnalyticsPeriod): CapturedCard[] {
  const validPct = (BASE.valid / BASE.bookings) * 100;
  const finalPct = (BASE.final / BASE.bookings) * 100;
  return [
    {
      key: "valid",
      step: "valid",
      chart: "valid",
      label: "Valid guest info",
      suffix: "(as received)",
      value: fmt(scale(BASE.valid, period)),
      hint: "Guest info that was already usable when it arrived, before any cleanup.",
      note: `${validPct.toFixed(1)}% of bookings analyzed`,
      delta: 6.8,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.validEmail, period)) },
        { label: "Phone", value: fmt(scale(BASE.validPhone, period)) },
        { label: "Address", value: fmt(scale(BASE.validAddress, period)) },
      ],
    },
    {
      key: "improved",
      step: "improved",
      chart: "improved",
      label: "Improved guest info",
      suffix: "(recovered)",
      value: fmt(scale(improvedTotal, period)),
      hint: "Unusable guest info recovered through cleanup and enrichment.",
      note: `+${(((BASE.final - BASE.valid) / BASE.bookings) * 100).toFixed(1)} pts of usable info`,
      delta: 14.9,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.improvedEmail, period)) },
        { label: "Phone", value: fmt(scale(BASE.improvedPhone, period)) },
        { label: "Address", value: fmt(scale(BASE.improvedAddress, period)) },
      ],
    },
    {
      key: "final",
      step: "final",
      chart: "final",
      label: "Final guest info",
      suffix: "(after cleanup)",
      value: fmt(scale(BASE.final, period)),
      hint: "Final usable guest information handed to the guest journey.",
      note: `${finalPct.toFixed(1)}% of bookings analyzed`,
      delta: 9.1,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.finalEmail, period)) },
        { label: "Phone", value: fmt(scale(BASE.finalPhone, period)) },
        { label: "Address", value: fmt(scale(BASE.finalAddress, period)) },
      ],
    },
    {
      key: "completeness",
      chart: "completeness",
      label: "Profile completeness",
      suffix: "(after cleanup)",
      value: `${BASE.completeness}%`,
      ring: BASE.completeness,
      hint: "Share of guest profile fields we hold once cleanup and enrichment are done.",
      note: `${fmt(scale(BASE.final, period))} profiles complete`,
      delta: 5.4,
      breakdown: [
        { label: "Email", value: "96%" },
        { label: "Phone", value: "89%" },
        { label: "Address", value: "72%" },
      ],
    },
  ];
}


/* ------------------------------- converted ------------------------------ */

export type ConvertedCard = {
  key: SeriesMetric | "conversion_rate" | "channel_dominance";
  label: string;
  value: string;
  hint: string;
  /** Muted qualifier printed beside the label. */
  suffix?: string;
  /** One-line context pill printed under the figure. */
  note?: string;
  delta: number;
  breakdown?: Breakdown[];
  /** Only clickable cards drive the chart. */
  metric?: SeriesMetric;
  /** Chart shown when the hotelier clicks this card. */
  chart?: string;
};


export function convertedActivity(period: AnalyticsPeriod): ConvertedCard[] {
  return [
    {
      key: "reached",
      metric: "reached",
      chart: "reached",
      label: "Guests reached",
      value: fmt(scale(BASE.reached, period)),
      hint: "Guests contacted through the guest journey.",
      note: `${((BASE.reached / BASE.final) * 100).toFixed(1)}% of final guest info`,
      delta: 9.1,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.reachedEmail, period)) },
        { label: "Text", value: fmt(scale(BASE.reachedText, period)) },
      ],
    },
    {
      key: "engaged",
      metric: "engaged",
      chart: "engaged",
      label: "Guests engaged",
      value: fmt(scale(BASE.engaged, period)),
      hint: "Unique guests who interacted with a campaign.",
      note: `${((BASE.engaged / BASE.reached) * 100).toFixed(1)}% of guests reached`,
      delta: 11.4,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.engagedEmail, period)) },
        { label: "Text", value: fmt(scale(BASE.engagedText, period)) },
      ],
    },
    {
      key: "email_engagement",
      metric: "email_engagement",
      chart: "email_engagement",
      label: "Email engagement",
      value: fmt(scale(BASE.engagedEmail, period)),
      hint: "Guests who engaged through email.",
      note: `${((BASE.engagedEmail / BASE.reachedEmail) * 100).toFixed(1)}% of emails delivered`,
      delta: 8.4,
      breakdown: [
        { label: "Clicks", value: fmt(scale(BASE.emailClicks, period)) },
        { label: "Responses", value: fmt(scale(BASE.emailResponses, period)) },
        { label: "Calls", value: fmt(scale(BASE.emailCalls, period)) },
      ],
    },
    {
      key: "text_engagement",
      metric: "text_engagement",
      chart: "text_engagement",
      label: "Text engagement",
      value: fmt(scale(BASE.engagedText, period)),
      hint: "Guests who engaged through text.",
      note: `${((BASE.engagedText / BASE.reachedText) * 100).toFixed(1)}% of texts delivered`,
      delta: 12.6,
      breakdown: [
        { label: "Clicks", value: fmt(scale(BASE.textClicks, period)) },
        { label: "Responses", value: fmt(scale(BASE.textResponses, period)) },
        { label: "Calls", value: fmt(scale(BASE.textCalls, period)) },
      ],
    },
    {
      key: "channel_dominance",
      chart: "channel_dominance",
      label: "Channel dominance",
      value: `${Math.round((BASE.reachedEmail / (BASE.reachedEmail + BASE.reachedText)) * 100)}% email`,
      hint: "Which channel is actually carrying the reach.",
      note: "Share of guests reached, by channel",
      delta: 3.8,
      breakdown: [
        { label: "Email", value: fmt(scale(BASE.reachedEmail, period)) },
        { label: "Text", value: fmt(scale(BASE.reachedText, period)) },
      ],
    },
  ];
}

export function convertedImpact(period: AnalyticsPeriod): ConvertedCard[] {
  const bookings = scale(BASE.bookings_direct, period);
  const revenue = scale(BASE.revenue, period);
  return [
    {
      key: "bookings",
      metric: "bookings",
      chart: "direct_bookings",
      label: "Direct bookings",
      value: fmt(bookings),
      hint: "Bookings made directly with the hotel.",
      note: `${((BASE.bookings_direct / BASE.reached) * 100).toFixed(1)}% of guests reached`,
      delta: 18.2,
    },
    {
      key: "conversion_rate",
      chart: "conversion_rate",
      label: "Booking conversion rate",
      value: `${((BASE.bookings_direct / BASE.reached) * 100).toFixed(1)}%`,
      hint: "Guests reached who went on to book direct.",
      note: `${fmt(BASE.bookings_direct)} of ${fmt(BASE.reached)} guests reached`,
      delta: 11.4,
    },
    {
      key: "revenue",
      metric: "revenue",
      chart: "revenue",
      label: "Direct revenue",
      value: money(revenue),
      hint: `${money(Math.round(BASE.revenue / BASE.bookings_direct))} per direct booking.`,
      note: `${money(Math.round(BASE.revenue / BASE.bookings_direct))} per direct booking`,
      delta: 18.2,
    },
  ];
}

/* ------------------------- capture-by-source table ---------------------- */

export type SourceRow = {
  source: string;
  hint: string;
  emails: string;
  phones: string;
  addresses: string;
  guests: string;
  rate: string;
};

const SOURCES = [
  {
    source: "Auto campaign",
    hint: "Guest completed a Directful experience",
    emails: 2840,
    phones: 1920,
    addresses: 1140,
    guests: 3126,
  },
  {
    source: "Staff collection",
    hint: "Entered by hotel staff at the desk",
    emails: 1420,
    phones: 980,
    addresses: 460,
    guests: 1840,
  },
  {
    source: "ID scan",
    hint: "Read from the guest ID at check-in",
    emails: 2160,
    phones: 1580,
    addresses: 1280,
    guests: 3180,
  },
];

export function sourceRows(period: AnalyticsPeriod): SourceRow[] {
  return SOURCES.map((s) => {
    const guests = scale(s.guests, period);
    const captured = scale(s.emails + s.phones + s.addresses, period);
    return {
      source: s.source,
      hint: s.hint,
      emails: fmt(scale(s.emails, period)),
      phones: fmt(scale(s.phones, period)),
      addresses: fmt(scale(s.addresses, period)),
      guests: fmt(guests),
      rate: `${((captured / guests) * 100).toFixed(1)}%`,
    };
  });
}

/* ---------------------------- stage performance ------------------------- */

export type StageRow = {
  stage: string;
  reached: string;
  momentum: number;
  engagement: string;
  emails: string;
  phones: string;
  addresses: string;
  conversions: string;
};

const STAGE_ROWS = [
  {
    stage: "Just Booked",
    reached: 8240,
    engagement: "14.5%",
    momentum: 6.2,
    emails: 4180,
    phones: 1920,
    addresses: 1140,
    conversions: 124,
  },
  {
    stage: "Pre-Check-In",
    reached: 6480,
    engagement: "15.8%",
    momentum: 8.4,
    emails: 2960,
    phones: 1580,
    addresses: 980,
    conversions: 98,
  },
  {
    stage: "During Stay",
    reached: 6120,
    engagement: "14.2%",
    momentum: 5.1,
    emails: 4140,
    phones: 1260,
    addresses: 720,
    conversions: 86,
  },
  {
    stage: "Post-Checkout",
    reached: 5940,
    engagement: "13.9%",
    momentum: 3.7,
    emails: 2380,
    phones: 1420,
    addresses: 680,
    conversions: 380,
  },
  {
    stage: "Win-Back",
    reached: 4210,
    engagement: "12.8%",
    momentum: -1.2,
    emails: 1860,
    phones: 1120,
    addresses: 420,
    conversions: 262,
  },
];

export function stageRows(period: AnalyticsPeriod): StageRow[] {
  return STAGE_ROWS.map((r) => ({
    stage: r.stage,
    reached: fmt(scale(r.reached, period)),
    momentum: r.momentum,
    engagement: r.engagement,
    emails: fmt(scale(r.emails, period)),
    phones: fmt(scale(r.phones, period)),
    addresses: fmt(scale(r.addresses, period)),
    conversions: fmt(scale(r.conversions, period)),
  }));
}

/* ---------------------------- funnel & KPIs ----------------------------- */

export type FunnelStep = {
  key: string;
  label: string;
  value: string;
  share: number;
};

export function funnel(period: AnalyticsPeriod): FunnelStep[] {
  const reached = scale(BASE.reached, period);
  const engaged = scale(BASE.engaged, period);
  const bookings = scale(BASE.bookings_direct, period);
  const revenue = scale(BASE.revenue, period);
  return [
    { key: "reached", label: "Reached", value: fmt(reached), share: 100 },
    {
      key: "engaged",
      label: "Engaged",
      value: fmt(engaged),
      share: Math.round((engaged / reached) * 100),
    },
    {
      key: "booked",
      label: "Booked direct",
      value: fmt(bookings),
      share: Math.round((bookings / reached) * 100),
    },
    { key: "revenue", label: "Revenue", value: money(revenue), share: 0 },
  ];
}

export type KpiCard = {
  key: string;
  label: string;
  value: string;
  delta: number;
  meta: string;
};

export function kpis(period: AnalyticsPeriod): KpiCard[] {
  const reached = scale(BASE.reached, period);
  const engaged = scale(BASE.engaged, period);
  const bookings = scale(BASE.bookings_direct, period);
  const revenue = scale(BASE.revenue, period);
  return [
    {
      key: "reach",
      label: "Reach",
      value: fmt(reached),
      delta: 9.1,
      meta: "OTA guests contacted",
    },
    {
      key: "engagement",
      label: "Engagement",
      value: fmt(engaged),
      delta: 11.4,
      meta: "Guests who interacted",
    },
    {
      key: "conversions",
      label: "Direct bookings",
      value: fmt(bookings),
      delta: 18.2,
      meta: "Booked directly with you",
    },
    {
      key: "revenue",
      label: "Revenue",
      value: money(revenue),
      delta: 18.2,
      meta: "Direct revenue earned",
    },
    {
      key: "commission",
      label: "Commission avoided",
      value: money(Math.round(revenue * 0.15)),
      delta: 18.2,
      meta: "Estimated vs. OTA commission",
    },
  ];
}

export type CapturedKpi = { key: string; label: string; value: string; delta: number };

export function capturedKpi(period: AnalyticsPeriod): CapturedKpi[] {
  return [
    { key: "email", label: "Emails", value: fmt(scale(BASE.reachedEmail, period)), delta: 8.4 },
    { key: "phone", label: "Phones", value: fmt(scale(BASE.reachedText, period)), delta: 12.6 },
    {
      key: "address",
      label: "Addresses",
      value: fmt(scale(BASE.improvedAddress + BASE.maskedAddress, period)),
      delta: 6.3,
    },
  ];
}

export type RepeatDirect = { value: string; delta: number };

export function repeatDirect(period: AnalyticsPeriod): RepeatDirect {
  const value = scale(482, period);
  return { value: fmt(value), delta: 14.3 };
}

/* --------------------------- channel table --------------------------- */

export type ChannelRow = {
  channel: string;
  sent: string;
  delivered: string;
  ctr: string;
  response: string;
  conversions: string;
};

const CHANNEL_ROWS = [
  {
    channel: "Email + Text",
    sent: 6240,
    delivered: 5920,
    ctr: "18.4%",
    response: "8.2%",
    conversions: 286,
  },
  {
    channel: "Email only",
    sent: 3180,
    delivered: 3040,
    ctr: "16.2%",
    response: "6.4%",
    conversions: 118,
  },
  {
    channel: "Text with Email fallback",
    sent: 1240,
    delivered: 1120,
    ctr: "14.8%",
    response: "7.1%",
    conversions: 62,
  },
  {
    channel: "Text only",
    sent: 840,
    delivered: 720,
    ctr: "11.6%",
    response: "5.8%",
    conversions: 28,
  },
];

export function channelRows(period: AnalyticsPeriod): ChannelRow[] {
  return CHANNEL_ROWS.map((r) => ({
    channel: r.channel,
    sent: fmt(scale(r.sent, period)),
    delivered: fmt(scale(r.delivered, period)),
    ctr: r.ctr,
    response: r.response,
    conversions: fmt(scale(r.conversions, period)),
  }));
}

/* ------------------------------ time series ----------------------------- */

export type SeriesMetric =
  | "bookings_analysed"
  | "final_profiles"
  | "reached"
  | "engaged"
  | "email_engagement"
  | "text_engagement"
  | "bookings"
  | "revenue";

export const SERIES_METRICS: { value: SeriesMetric; label: string }[] = [
  { value: "reached", label: "Guests reached" },
  { value: "engaged", label: "Guests engaged" },
  { value: "email_engagement", label: "Email engagement" },
  { value: "text_engagement", label: "Text engagement" },
  { value: "bookings", label: "Direct bookings" },
  { value: "revenue", label: "Direct revenue" },
  { value: "bookings_analysed", label: "Booking analyzed" },
  { value: "final_profiles", label: "Final guest info" },
];

export const SERIES_LABEL: Record<SeriesMetric, string> = {
  bookings_analysed: "Booking analyzed",
  final_profiles: "Final guest info",
  reached: "Guests reached",
  engaged: "Guests engaged",
  email_engagement: "Email engagement",
  text_engagement: "Text engagement",
  bookings: "Direct bookings",
  revenue: "Direct revenue",
};

const DAILY: Record<SeriesMetric, number> = {
  bookings_analysed: BASE.bookings / 30,
  final_profiles: BASE.final / 30,
  reached: BASE.reached / 30,
  engaged: BASE.engaged / 30,
  email_engagement: BASE.engagedEmail / 30,
  text_engagement: BASE.engagedText / 30,
  bookings: BASE.bookings_direct / 30,
  revenue: BASE.revenue / 30,
};

/** Stable pseudo-random wobble so the chart reads like real traffic. */
function wobble(i: number, seed: number) {
  const x = Math.sin((i + 1) * (12.9898 + seed)) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.34;
}

export type SeriesPoint = { date: string; current: number; previous: number | null };

export function series(
  metric: SeriesMetric,
  period: AnalyticsPeriod,
  comparison: ComparisonMode = "previous",
): SeriesPoint[] {
  const days = DAYS[period];
  const step = days > 45 ? 3 : 1;
  const base = DAILY[metric] * step;
  const seed = metric.length;
  const withCompare = hasComparison(period, comparison);
  const compareScale = comparison === "last_year" ? 0.78 : 0.9;
  const points: SeriesPoint[] = [];
  const end = new Date(Date.UTC(2026, 7, 17));

  for (let i = days - 1; i >= 0; i -= step) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    const trend = 1 + ((days - i) / days) * 0.22;
    const current = Math.max(0, Math.round(base * trend * (1 + wobble(i, seed))));
    points.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      current,
      previous: withCompare
        ? Math.max(0, Math.round(base * compareScale * (1 + wobble(i + 40, seed))))
        : null,
    });
  }
  return points;
}

/* --------------------------- booking engines ---------------------------- */

export type EngineRow = {
  engine: string;
  share: number;
  analysed: string;
  masked: string;
  missing: string;
  final: string;
};

const ENGINES = [
  { engine: "Booking.com", share: 38, analysed: 4744, masked: 4442, missing: 1102, final: 3392 },
  { engine: "Expedia", share: 22, analysed: 2746, masked: 2522, missing: 829, final: 2047 },
  { engine: "Airbnb", share: 14, analysed: 1748, masked: 1668, missing: 540, final: 837 },
  { engine: "Agoda", share: 11, analysed: 1373, masked: 1212, missing: 419, final: 815 },
  { engine: "Hotels.com", share: 9, analysed: 1123, masked: 1012, missing: 334, final: 773 },
  { engine: "Other engines", share: 6, analysed: 749, masked: 634, missing: 285, final: 455 },
];

export function engineRows(period: AnalyticsPeriod): EngineRow[] {
  return ENGINES.map((e) => ({
    engine: e.engine,
    share: e.share,
    analysed: fmt(scale(e.analysed, period)),
    masked: fmt(scale(e.masked, period)),
    missing: fmt(scale(e.missing, period)),
    final: fmt(scale(e.final, period)),
  }));
}
