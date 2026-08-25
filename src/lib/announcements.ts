/** Data model for the Announcements workspace: guests, audiences and messages. */

export type Guest = {
  id: string;
  name: string;
  room: number;
  roomType: string;
  rateCode: string;
  stay: string;
  status: "In-house" | "Arriving today" | "Departing today" | "Arriving tomorrow";
};

export const ROOM_TYPES = [
  "Deluxe King",
  "Deluxe Double",
  "Superior King",
  "Suite",
  "Junior Suite",
] as const;

export const RATE_CODES = [
  "SW.OTA",
  "ABC",
  "BAR",
  "BCOM",
  "EXPD",
  "FLBK",
  "CORP",
  "GOVT",
  "AAA",
  "PKG",
  "GRP",
  "COMP",
  "LNR",
  "WKND",
] as const;

const FIRST = [
  "Sarah",
  "Michael",
  "David",
  "Emma",
  "James",
  "Olivia",
  "Daniel",
  "Sofia",
  "Lucas",
  "Mia",
  "Noah",
  "Ava",
  "Ethan",
  "Isabella",
  "Liam",
  "Chloe",
];
const LAST = [
  "Johnson",
  "Brown",
  "Smith",
  "Garcia",
  "Miller",
  "Davis",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Martin",
  "Clark",
  "Lewis",
];
const STAYS = ["Aug 22–26", "Aug 23–25", "Aug 24–27", "Aug 21–24", "Aug 24–29", "Aug 20–25"];
const STATUSES: Guest["status"][] = [
  "In-house",
  "In-house",
  "In-house",
  "Departing today",
  "Arriving today",
  "Arriving tomorrow",
];

/** Deterministic demo roster so counts stay stable between renders. */
export const GUESTS: Guest[] = Array.from({ length: 96 }, (_, i) => {
  const floor = 1 + (i % 3);
  const room = floor * 100 + (i % 32) + 1;
  const roomType =
    floor === 3 && i % 4 === 0 ? "Suite" : ROOM_TYPES[(i * 3) % (ROOM_TYPES.length - 1)];
  return {
    id: `g${i + 1}`,
    name: `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`,
    room,
    roomType,
    rateCode: RATE_CODES[(i * 7) % RATE_CODES.length],
    stay: STAYS[i % STAYS.length],
    status: STATUSES[i % STATUSES.length],
  };
});

/** Every room number in the property, as a searchable string list. */
export const ROOMS: string[] = [...new Set(GUESTS.map((g) => String(g.room)))].sort();

/** Reservation volume per rate code — shown as metadata in the rate-code picker. */
export const RATE_CODE_COUNTS: Record<string, number> = RATE_CODES.reduce<Record<string, number>>(
  (acc, code) => {
    acc[code] = GUESTS.filter((g) => g.rateCode === code).length;
    return acc;
  },
  {},
);

export const ROOM_TYPE_COUNTS: Record<string, number> = ROOM_TYPES.reduce<Record<string, number>>(
  (acc, t) => {
    acc[t] = GUESTS.filter((g) => g.roomType === t).length;
    return acc;
  },
  {},
);

/** Targeting rules. Empty everywhere = no targeting configured yet. */
export type AudienceRules = {
  rooms: string[];
  roomTypes: string[];
  rateCodes: string[];
};

export type CustomAudience = {
  id: string;
  name: string;
  rules: AudienceRules;
  /** Guests included regardless of the rules. */
  added: string[];
  /** Guests excluded from the rule matches. */
  excluded: string[];
  updated: string;
};

export type AnnouncementStatus = "Scheduled" | "Completed" | "Draft";

export type Announcement = {
  id: string;
  /** Guest category the announcement was created from. */
  categoryId: string;
  /** Saved audience id, or "custom" for one-off targeting. */
  audienceId: string;
  audienceLabel: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  when: string;
  recipients: number;
  createdBy: string;
  createdAt: string;
};

export const PRESETS = [
  { id: "in-house", name: "In-house", desc: "Guests currently staying in-property" },
  { id: "arriving-today", name: "Arriving today", desc: "Guests checking in today" },
  { id: "departing-today", name: "Departing today", desc: "Guests checking out today" },
  { id: "arriving-tomorrow", name: "Arriving tomorrow", desc: "Guests checking in tomorrow" },
  { id: "departing-tomorrow", name: "Departing tomorrow", desc: "Guests checking out tomorrow" },
] as const;

export const emptyRules: AudienceRules = { rooms: [], roomTypes: [], rateCodes: [] };

/** Stay-status behind each guest category (demo approximation). */
export const PRESET_STATUS: Record<string, Guest["status"]> = {
  "in-house": "In-house",
  "arriving-today": "Arriving today",
  "departing-today": "Departing today",
  "arriving-tomorrow": "Arriving tomorrow",
  "departing-tomorrow": "Departing today",
};

export function isPresetId(id: string): boolean {
  return id in PRESET_STATUS;
}

export function presetName(id: string): string {
  return PRESETS.find((p) => p.id === id)?.name ?? id;
}

export function guestsForPreset(id: string): Guest[] {
  const status = PRESET_STATUS[id];
  return status ? GUESTS.filter((g) => g.status === status) : [];
}

export function hasTargeting(rules: AudienceRules): boolean {
  return rules.rooms.length > 0 || rules.roomTypes.length > 0 || rules.rateCodes.length > 0;
}

/** AND across filter types, OR within a filter type. No rules = no matches. */
export function matchGuests(rules: AudienceRules): Guest[] {
  if (!hasTargeting(rules)) return [];
  return GUESTS.filter((g) => {
    if (rules.rooms.length && !rules.rooms.includes(String(g.room))) return false;
    if (rules.roomTypes.length && !rules.roomTypes.includes(g.roomType)) return false;
    if (rules.rateCodes.length && !rules.rateCodes.includes(g.rateCode)) return false;
    return true;
  });
}

export type Resolved = {
  /** Guests produced by the rules alone. */
  matched: Guest[];
  /** Manually added guests that the rules do not match. */
  addedGuests: Guest[];
  /** Rule matches that were manually removed. */
  removedGuests: Guest[];
  /** matched + added − removed */
  recipients: Guest[];
};

/** matched guests + manually added guests − manually removed guests */
export function resolveAudience(
  rules: AudienceRules,
  added: string[] = [],
  excluded: string[] = [],
): Resolved {
  const matched = matchGuests(rules);
  const matchedIds = new Set(matched.map((g) => g.id));
  const addedGuests = GUESTS.filter((g) => added.includes(g.id) && !matchedIds.has(g.id));
  const excludedSet = new Set(excluded);
  const pool = [...matched, ...addedGuests];
  const removedGuests = pool.filter((g) => excludedSet.has(g.id));
  const recipients = pool.filter((g) => !excludedSet.has(g.id));
  return { matched, addedGuests, removedGuests, recipients };
}

export function audienceCount(a: CustomAudience): number {
  return resolveAudience(a.rules, a.added, a.excluded).recipients.length;
}

/** Collapses consecutive room numbers into ranges: ["100","101","102"] → "100–102". */
export function compressRooms(rooms: string[]): string {
  const nums = rooms
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (nums.length === 0) return "";
  const parts: string[] = [];
  let start = nums[0];
  let prev = nums[0];
  for (const n of nums.slice(1)) {
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  parts.push(start === prev ? `${start}` : `${start}–${prev}`);
  return parts.join(", ");
}

export function ruleSummary(rules: AudienceRules): string[] {
  const parts: string[] = [];
  if (rules.rooms.length) parts.push(`Rooms ${compressRooms(rules.rooms)}`);
  if (rules.roomTypes.length) parts.push(rules.roomTypes.join(" / "));
  if (rules.rateCodes.length) parts.push(rules.rateCodes.join(", "));
  return parts;
}

/** Plain-English description of an audience's targeting, for the rules card. */
export function rulesSentence(a: CustomAudience): string {
  const { rooms, roomTypes, rateCodes } = a.rules;
  const clauses: string[] = [];
  if (rooms.length) clauses.push(`in Rooms ${compressRooms(rooms)}`);
  if (roomTypes.length) clauses.push(`with ${roomTypes.join(" or ")} rooms`);
  if (rateCodes.length) clauses.push(`on ${rateCodes.join(" or ")} rate codes`);
  let s = clauses.length
    ? `This audience includes guests ${clauses.join(" ")}.`
    : "This audience has no targeting rules — it only contains hand-picked guests.";
  if (a.added.length) s += ` ${a.added.length} guest${a.added.length === 1 ? " is" : "s are"} added manually.`;
  if (a.excluded.length)
    s += ` ${a.excluded.length} matched guest${a.excluded.length === 1 ? " is" : "s are"} excluded.`;
  return s;
}


export function audienceSummary(a: CustomAudience): string {
  const parts = ruleSummary(a.rules);
  if (a.added.length) parts.push(`+${a.added.length} individual`);
  return parts.length ? parts.join(" · ") : "Individually selected guests";
}

export const INITIAL_AUDIENCES: CustomAudience[] = [
  {
    id: "a1",
    name: "Tower A",
    rules: {
      rooms: Array.from({ length: 100 }, (_, i) => String(i + 100)),
      roomTypes: ["Deluxe King"],
      rateCodes: ["FLBK"],
    },
    added: [],
    excluded: [],
    updated: "Today",
  },
  {
    id: "a2",
    name: "Tower B",
    rules: {
      rooms: [],
      roomTypes: ["Deluxe King", "Deluxe Double"],
      rateCodes: ["BAR", "FLBK"],
    },
    added: [],
    excluded: [],
    updated: "Aug 23",
  },
  {
    id: "a3",
    name: "VIP Rooms",
    rules: { rooms: [], roomTypes: ["Suite"], rateCodes: [] },
    added: [],
    excluded: [],
    updated: "Aug 21",
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "n1",
    categoryId: "in-house",
    audienceId: "a1",
    audienceLabel: "Tower A",
    title: "Pool Maintenance Announcement",
    body: "Pool maintenance tonight. The pool will be closed from 10 PM–6 AM.",
    status: "Scheduled",
    when: "Aug 24 · 8:00 PM",
    recipients: 14,
    createdBy: "Sinan Aksay",
    createdAt: "Aug 23",
  },
  {
    id: "n2",
    categoryId: "in-house",
    audienceId: "a1",
    audienceLabel: "Tower A",
    title: "Breakfast Reminder",
    body: "Breakfast is available from 6:30 AM tomorrow.",
    status: "Completed",
    when: "Aug 23 · 6:30 AM",
    recipients: 12,
    createdBy: "Sinan Aksay",
    createdAt: "Aug 22",
  },
  {
    id: "n3",
    categoryId: "in-house",
    audienceId: "a1",
    audienceLabel: "Tower A",
    title: "Late Checkout Reminder",
    body: "Late checkout until 2 PM is available on request at the front desk.",
    status: "Draft",
    when: "Draft",
    recipients: 0,
    createdBy: "Front desk",
    createdAt: "Aug 24",
  },
  {
    id: "n4",
    categoryId: "departing-today",
    audienceId: "a2",
    audienceLabel: "Tower B",
    title: "Elevator Service",
    body: "Elevator 3 is under service until 4 PM today. Please use elevators 1 and 2.",
    status: "Completed",
    when: "Aug 24 · 9:15 AM",
    recipients: 21,
    createdBy: "Maintenance",
    createdAt: "Aug 24",
  },
  {
    id: "n5",
    categoryId: "in-house",
    audienceId: "custom",
    audienceLabel: "6 hand-picked guests",
    title: "Welcome reception",
    body: "Hey firstName, join us for the evening reception in the lobby bar at 7 PM.",
    status: "Completed",
    when: "Aug 24 · 7:00 PM",
    recipients: 6,
    createdBy: "Guest services",
    createdAt: "Aug 24",
  },
];
