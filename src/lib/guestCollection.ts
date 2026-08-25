/**
 * Guest info collected — the journey-side story.
 *
 * "Guest info collected" is real guest email, phone and address information
 * collected through a Guest Journey stage or one of its messages. The wording,
 * the collection period and the collection source are all derived here so a
 * tooltip never hardcodes a timeframe.
 */

import type { Period, StageId } from "@/lib/otaJourney";

export const PERIOD_LABEL: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

export const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  custom: 45,
};

/** Where the information for this stage comes from, in guest-facing words. */
export const COLLECTION_SOURCE: Record<StageId, string> = {
  just_booked: "Guest Journey landing experience",
  pre_checkin: "Pre-arrival landing experience",
  during_stay: "Automated campaign, landing experience, staff collection or ID scan",
  post_checkout: "Post-stay landing experience",
  retain: "Previously collected guest information",
};

/** The one-line explanation shown at the top of a collection tooltip. */
export const COLLECTION_NOTE: Record<StageId, string> = {
  just_booked: "Real guest details collected right after the OTA booking arrives.",
  pre_checkin: "Details collected or improved before the guest arrives.",
  during_stay:
    "Guest info may be collected through campaign interactions, landing experiences, staff collection or ID-based collection.",
  post_checkout:
    "The final OTA-originated collection opportunity for this guest — details collected after checkout.",
  retain:
    "Win-back uses previously collected guest information to re-engage guests and encourage a future direct booking.",
};

/** Collection period sentence for a whole stage. */
export function stageCollectionPeriod(stageTiming: string, period: Period) {
  return `${stageTiming} · measured over ${PERIOD_LABEL[period].toLowerCase()}`;
}

/** Collection period sentence for one message, driven by its sequence timing. */
export function messageCollectionPeriod(timing: string) {
  return timing;
}

export function messageCollectionNote(stageId: StageId, timing: string, first: boolean) {
  if (first) {
    return `Guest info collected from interactions with this message starting ${timing.toLowerCase()}.`;
  }
  return `Guest info collected from interactions with this follow-up during its active campaign period (${timing.toLowerCase()}).`;
}

/* --------------------------- share of audience --------------------------- */

const FACTOR: Record<Period, number> = { "7d": 0.24, "30d": 1, "90d": 2.65, custom: 1.62 };

/** Guests entering the journey in this period — the denominator for a share. */
const AUDIENCE_BASE = 12483;

/** What share of the period's guests this collected count represents. */
export function collectedShare(raw: number, period: Period) {
  const audience = AUDIENCE_BASE * FACTOR[period];
  return Math.min(100, Math.round((raw / audience) * 100));
}

/* ------------------------- Win-back direct outcomes ---------------------- */

const scale = (n: number, p: Period) => Math.round(n * FACTOR[p]);

const fmt = (n: number) => n.toLocaleString("en-US");

export type WinbackKpi = {
  key: string;
  metric: string;
  label: string;
  value: string;
  momentum: number;
  hint: string;
};

/**
 * Win-back does not collect information — it spends it. These are the
 * direct-booking outcomes shown in place of collection metrics.
 */
export function winbackDirect(period: Period): WinbackKpi[] {
  return [
    {
      key: "reached",
      metric: "reached",
      label: "Guests reached",
      value: fmt(scale(4210, period)),
      momentum: 5.4,
      hint: "Past guests re-engaged with previously collected information.",
    },
    {
      key: "clicks",
      metric: "clicks",
      label: "Clicks",
      value: fmt(scale(1180, period)),
      momentum: 8.1,
      hint: "Clicks through to your own booking flow.",
    },
    {
      key: "bookings",
      metric: "direct_bookings",
      label: "Direct bookings",
      value: fmt(scale(262, period)),
      momentum: 18.2,
      hint: "Return stays booked directly with the hotel.",
    },
    {
      key: "revenue",
      metric: "revenue",
      label: "Direct revenue",
      value: `$${fmt(scale(30920, period))}`,
      momentum: 16.4,
      hint: "Revenue from win-back direct bookings.",
    },
  ];
}
