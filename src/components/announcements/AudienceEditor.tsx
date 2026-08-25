import { useMemo, useState } from "react";
import { Search, Settings2, UserPlus, Users, X } from "lucide-react";
import type { AudienceRules, Guest } from "@/lib/announcements";
import {
  GUESTS,
  RATE_CODES,
  RATE_CODE_COUNTS,
  ROOMS,
  ROOM_TYPES,
  ROOM_TYPE_COUNTS,
  hasTargeting,
  resolveAudience,
} from "@/lib/announcements";
import { ConfigurePanel } from "./ConfigurePanel";
import { GuestTable } from "./GuestTable";
import { Modal, btnGhost, btnPrimary } from "./ui";

export type AudienceDraft = {
  id: string | null;
  name: string;
  rules: AudienceRules;
  /** Guests included regardless of the rules. */
  added: string[];
  /** Rule matches removed by hand. */
  excluded: string[];
};

type CfgKind = "rooms" | "roomTypes" | "rateCodes";

const CFG: Record<
  CfgKind,
  { title: string; placeholder: string; options: readonly string[]; counts?: Record<string, number> }
> = {
  rooms: { title: "Configure room numbers", placeholder: "Search room numbers...", options: ROOMS },
  roomTypes: {
    title: "Configure room types",
    placeholder: "Search room types...",
    options: ROOM_TYPES,
    counts: ROOM_TYPE_COUNTS,
  },
  rateCodes: {
    title: "Configure rate codes",
    placeholder: "Search rate codes...",
    options: RATE_CODES,
    counts: RATE_CODE_COUNTS,
  },
};

/**
 * Audience name + the four configuration cards, with the always-visible
 * Recipients panel and a live matched / added / removed / final summary.
 */
export function AudienceEditor({
  draft,
  onChange,
  nameRequired = true,
  scope,
}: {
  draft: AudienceDraft;
  onChange: (next: AudienceDraft) => void;
  /** Individual-only selections may stay unnamed. */
  nameRequired?: boolean;
  /** Optional guest-category context line. */
  scope?: { label: string; desc: string } | null;
}) {
  const [cfg, setCfg] = useState<CfgKind | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState("");

  const resolved = useMemo(
    () => resolveAudience(draft.rules, draft.added, draft.excluded),
    [draft.rules, draft.added, draft.excluded],
  );

  const configured = hasTargeting(draft.rules) || draft.added.length > 0;

  /** Everything the configuration pulled in — kept or removed. */
  const pool = useMemo(
    () => [...resolved.matched, ...resolved.addedGuests],
    [resolved.matched, resolved.addedGuests],
  );
  const keptIds = useMemo(() => new Set(resolved.recipients.map((g) => g.id)), [resolved.recipients]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return pool;
    return pool.filter(
      (g) =>
        g.name.toLowerCase().includes(t) ||
        String(g.room).includes(t) ||
        g.roomType.toLowerCase().includes(t) ||
        g.rateCode.toLowerCase().includes(t),
    );
  }, [pool, q]);

  /** Checkbox = included in this audience. Unchecking keeps the row visible. */
  const toggleGuest = (g: Guest) => {
    const excluded = keptIds.has(g.id)
      ? [...new Set([...draft.excluded, g.id])]
      : draft.excluded.filter((id) => id !== g.id);
    onChange({ ...draft, excluded });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      {/* ---------------- configuration ---------------- */}
      <div className="space-y-4">
        {scope && (
          <div className="rounded-md border border-border bg-muted/40 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Guest category
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-foreground">{scope.label}</p>
            <p className="text-[12.5px] text-muted-foreground">{scope.desc}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="aud-name" className="text-[12.5px] font-medium text-foreground">
            Audience name {!nameRequired && <span className="text-muted-foreground">(optional)</span>}
          </label>
          <input
            id="aud-name"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="e.g. Tower A"
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <ConfigCard
            title="Room numbers"
            values={draft.rules.rooms}
            emptyLabel="No rooms selected"
            onConfigure={() => setCfg("rooms")}
          />
          <ConfigCard
            title="Room types"
            values={draft.rules.roomTypes}
            emptyLabel="No room types selected"
            onConfigure={() => setCfg("roomTypes")}
          />
          <ConfigCard
            title="Rate codes"
            values={draft.rules.rateCodes}
            emptyLabel="No rate codes selected"
            onConfigure={() => setCfg("rateCodes")}
          />
          <div className="rounded-md border border-border bg-background p-3.5">
            <p className="text-[12.5px] font-semibold text-foreground">Additional guests</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {draft.added.length === 0
                ? "0 manually added"
                : `${draft.added.length} manually added`}
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground hover:underline"
            >
              <UserPlus size={13} />
              Add guests
            </button>
          </div>
        </div>

        <section className="rounded-md border border-border bg-muted/30 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Audience summary
          </p>
          <p className="mt-1 text-[13.5px] font-semibold text-foreground">
            {draft.name.trim() || "Untitled audience"}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] sm:grid-cols-4">
            <SummaryStat label="Filter-matched" value={resolved.matched.length} />
            <SummaryStat label="Additional" value={resolved.addedGuests.length} />
            <SummaryStat label="Removed" value={resolved.removedGuests.length} />
            <SummaryStat label="Final recipients" value={resolved.recipients.length} strong />
          </dl>
        </section>
      </div>

      {/* ---------------- recipients ---------------- */}
      <section className="rounded-lg border border-border bg-background">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <Users size={14} />
              Recipients
            </h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Everyone your configuration pulled in is selected — untick anyone you want to leave
              out.
            </p>
          </div>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-foreground">
            {resolved.recipients.length} selected
            {resolved.removedGuests.length > 0 && ` · ${resolved.removedGuests.length} removed`}
          </span>
        </header>

        <div className="p-4">
          {!configured ? (
            <EmptyState
              title="No recipients yet"
              desc="Configure room numbers, room types, rate codes, or add guests individually to see recipients here."
            />
          ) : pool.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-md border border-dashed border-border px-4 py-10 text-center">
              <p className="text-[13px] font-medium text-foreground">0 recipients</p>
              <p className="text-[12.5px] text-muted-foreground">
                No guests match these conditions. Try changing your room number, room type, or rate
                code selections.
              </p>
              <div className="mt-1 flex gap-2">
                <button type="button" className={btnGhost} onClick={() => setCfg("roomTypes")}>
                  <Settings2 size={14} />
                  Edit filters
                </button>
                <button type="button" className={btnGhost} onClick={() => setAddOpen(true)}>
                  <UserPlus size={14} />
                  Add guests individually
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[12rem] flex-1">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, room, room type or rate code..."
                    aria-label="Search recipients"
                    className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-[12.5px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                  {q && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQ("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, excluded: [] })}
                  disabled={resolved.removedGuests.length === 0}
                  className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-40"
                >
                  Select all
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, excluded: pool.map((g) => g.id) })}
                  disabled={resolved.recipients.length === 0}
                  className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-40"
                >
                  Deselect all
                </button>
              </div>

              <div className="max-h-[26rem] overflow-y-auto rounded-md border border-border">
                <table className="w-full border-collapse text-left text-[12.5px]">
                  <thead className="sticky top-0 z-10 bg-muted/80 text-[11px] uppercase tracking-wide text-muted-foreground backdrop-blur">
                    <tr>
                      <th className="w-9 px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label="Select all recipients"
                          checked={resolved.removedGuests.length === 0 && pool.length > 0}
                          onChange={() =>
                            onChange({
                              ...draft,
                              excluded:
                                resolved.removedGuests.length === 0
                                  ? pool.map((g) => g.id)
                                  : [],
                            })
                          }
                          className="size-3.5 cursor-pointer accent-primary align-middle"
                        />
                      </th>
                      <th className="px-3 py-2 font-medium">Guest</th>
                      <th className="px-3 py-2 font-medium">Room</th>
                      <th className="px-3 py-2 font-medium">Room type</th>
                      <th className="px-3 py-2 font-medium">Rate code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((g) => {
                      const on = keptIds.has(g.id);
                      return (
                        <tr
                          key={g.id}
                          onClick={() => toggleGuest(g)}
                          className={`cursor-pointer border-t border-border transition-colors hover:bg-muted/50 ${
                            on ? "" : "opacity-55"
                          }`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={on}
                              aria-label={`Include ${g.name}`}
                              onChange={() => toggleGuest(g)}
                              onClick={(e) => e.stopPropagation()}
                              className="size-3.5 cursor-pointer accent-primary align-middle"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground">
                            {g.name}
                            {draft.added.includes(g.id) && (
                              <span className="ml-1.5 rounded border border-border bg-muted px-1 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                added
                              </span>
                            )}
                            {!on && (
                              <span className="ml-1.5 rounded border border-destructive/30 bg-destructive/10 px-1 py-0.5 text-[10px] uppercase tracking-wide text-destructive">
                                removed
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-foreground">{g.room}</td>
                          <td className="px-3 py-2 text-muted-foreground">{g.roomType}</td>
                          <td className="px-3 py-2 font-mono text-[11.5px] text-muted-foreground">
                            {g.rateCode}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rows.length === 0 && (
                  <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
                    No guests match “{q}”.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
                <span className="tabular-nums">
                  {rows.length} shown · {resolved.recipients.length} selected ·{" "}
                  {resolved.removedGuests.length} removed
                </span>
                {resolved.removedGuests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...draft, excluded: [] })}
                    className="font-medium text-foreground hover:underline"
                  >
                    Restore removed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {cfg && (
        <ConfigurePanel
          key={cfg}
          title={CFG[cfg].title}
          searchPlaceholder={CFG[cfg].placeholder}
          options={CFG[cfg].options}
          counts={CFG[cfg].counts}
          allowRange={cfg === "rooms"}
          initial={draft.rules[cfg]}
          onClose={() => setCfg(null)}
          onApply={(next) => {
            onChange({ ...draft, rules: { ...draft.rules, [cfg]: next } });
            setCfg(null);
          }}
        />
      )}


      {addOpen && (
        <Modal
          open
          onClose={() => setAddOpen(false)}
          title="Add guests individually"
          subtitle="Guests you add are included even if they do not match the filters."
          width="60rem"
          footer={
            <button type="button" className={btnPrimary} onClick={() => setAddOpen(false)}>
              Done
            </button>
          }
        >
          <GuestTable
            guests={GUESTS}
            selected={new Set(draft.added)}
            showStatus
            onToggle={(id) =>
              onChange({
                ...draft,
                added: draft.added.includes(id)
                  ? draft.added.filter((x) => x !== id)
                  : [...draft.added, id],
              })
            }
            onSelectAll={() => onChange({ ...draft, added: GUESTS.map((g) => g.id) })}
            onClearAll={() => onChange({ ...draft, added: [] })}
          />
        </Modal>
      )}
    </div>
  );
}

function ConfigCard({
  title,
  values,
  emptyLabel,
  onConfigure,
}: {
  title: string;
  values: string[];
  emptyLabel: string;
  onConfigure: () => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3.5">
      <p className="text-[12.5px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {values.length === 0 ? emptyLabel : `${values.length} selected`}
      </p>
      {values.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {values.slice(0, 6).map((v) => (
            <span
              key={v}
              className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
            >
              {v}
            </span>
          ))}
          {values.length > 6 && (
            <span className="text-[10.5px] text-muted-foreground">+{values.length - 6}</span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onConfigure}
        className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground hover:underline"
      >
        <Settings2 size={13} />
        Configure
      </button>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11.5px] text-muted-foreground">{label}</dt>
      <dd
        className={`tabular-nums ${strong ? "text-[15px] font-semibold text-foreground" : "text-[13px] font-medium text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-md border border-dashed border-border px-4 py-12 text-center">
      <Users size={18} className="text-muted-foreground" />
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
