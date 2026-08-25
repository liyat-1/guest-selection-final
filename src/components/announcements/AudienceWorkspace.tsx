import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  UserX,
  Trash2,
  Users,
} from "lucide-react";
import type { CustomAudience } from "@/lib/announcements";
import {
  PRESETS,
  RATE_CODES,
  ROOM_TYPES,
  audienceCount,
  audienceSummary,
  guestsForPreset,
  resolveAudience,
  rulesSentence,
} from "@/lib/announcements";
import {
  EmptyState,
  Initials,
  btnGhost,
  btnPrimary,
  field,
  fieldSelect,
  tableEl,
  tableHead,
  tableWrap,
  td,
  th,
  tr,
} from "./ui";

const PAGE_SIZES = [5, 10, 25];

/**
 * Two-section audience workspace: browse audiences on the left, inspect the
 * selected audience's recipients and rules on the right.
 */
export function AudienceWorkspace({
  audiences,
  usageById,
  onCreate,
  onEdit,
  onDuplicate,
  onUsage,
  onDelete,
  onUseIn,
}: {
  audiences: CustomAudience[];
  usageById: Map<string, number>;
  onCreate: () => void;
  onEdit: (a: CustomAudience) => void;
  onDuplicate: (a: CustomAudience) => void;
  onUsage: (a: CustomAudience) => void;
  onDelete: (a: CustomAudience) => void;
  onUseIn: (a: CustomAudience, categoryId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(audiences[0]?.id ?? null);

  const term = q.trim().toLowerCase();
  const rows = audiences.filter(
    (a) =>
      !term ||
      a.name.toLowerCase().includes(term) ||
      audienceSummary(a).toLowerCase().includes(term),
  );

  useEffect(() => {
    if (!audiences.some((a) => a.id === selectedId)) setSelectedId(audiences[0]?.id ?? null);
  }, [audiences, selectedId]);

  const selected = audiences.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      {/* ------------------------- left: audience list ------------------------- */}
      <section className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
        <header className="space-y-2.5 border-b border-border bg-gradient-to-b from-muted/45 to-muted/15 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-foreground">
              Audiences
            </h2>
            <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {audiences.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[11rem] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search audiences…"
                aria-label="Search audiences"
                className={`${field} w-full pl-9`}
              />
            </div>
            <button type="button" className={btnPrimary} onClick={onCreate}>
              <Plus size={14} />
              Create audience
            </button>
          </div>
        </header>

        <ul className="max-h-[38rem] space-y-1.5 overflow-y-auto p-2.5">
          {rows.map((a) => {
            const used = usageById.get(a.id) ?? 0;
            const on = a.id === selectedId;
            return (
              <li key={a.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  aria-current={on}
                  className={`relative w-full overflow-hidden rounded-lg border py-2.5 pl-3.5 pr-10 text-left transition-all duration-150 ${
                    on
                      ? "border-primary/45 bg-primary/[0.055] shadow-xs ring-1 ring-inset ring-primary/10"
                      : "border-transparent bg-background hover:border-border hover:bg-muted/50"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-primary transition-opacity ${
                      on ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary ring-1 ring-inset ring-primary/12"
                      }`}
                    >
                      <Users size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {a.name}
                        </p>
                        <span className="ml-auto shrink-0 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground">
                          {audienceCount(a)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        {audienceSummary(a)}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-medium text-chart-emerald">
                          <span className="size-1.5 rounded-full bg-chart-emerald" />
                          Active
                        </span>
                        <span className="text-border">·</span>
                        <span className="truncate">
                          {used} announcement{used === 1 ? "" : "s"}
                        </span>
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`More actions for ${a.name}`}
                  onClick={() => setMenu((m) => (m === a.id ? null : a.id))}
                  className="absolute right-2 top-2.5 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <MoreHorizontal size={15} />
                </button>
                {menu === a.id && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />
                    <div className="absolute right-2 top-10 z-30 w-44 rounded-xl border border-border bg-popover p-1 shadow-menu duration-150 animate-in fade-in zoom-in-95">
                      {(
                        [
                          ["Edit audience", Pencil, () => onEdit(a)],
                          ["Duplicate", Copy, () => onDuplicate(a)],
                          ["View usage", BarChart3, () => onUsage(a)],
                          ["Delete audience", Trash2, () => onDelete(a)],
                        ] as const
                      ).map(([label, Icon, act], i) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setMenu(null);
                            act();
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors ${
                            i === 3
                              ? "mt-1 border-t border-border pt-2 text-destructive hover:bg-destructive/10"
                              : "text-foreground hover:bg-accent"
                          }`}
                        >
                          <Icon size={13} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </li>
            );
          })}
          {rows.length === 0 && (
            <li>
              <EmptyState
                icon={<Search size={17} />}
                title="No audiences found"
                description={`Nothing matches “${q}”. Try a different name, room type or rate code.`}
                action={
                  <button type="button" className={btnGhost} onClick={() => setQ("")}>
                    Clear search
                  </button>
                }
              />
            </li>
          )}
        </ul>
      </section>


      {/* ------------------------- right: details ------------------------- */}
      {selected ? (
        <AudienceDetail
          key={selected.id}
          audience={selected}
          used={usageById.get(selected.id) ?? 0}
          onEdit={() => onEdit(selected)}
          onDelete={() => onDelete(selected)}
          onUsage={() => onUsage(selected)}
          onUseIn={(cat) => onUseIn(selected, cat)}
        />
      ) : (
        <section className="grid place-items-center gap-2 rounded-xl border border-dashed border-border bg-background px-6 py-20 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <Users size={18} />
          </span>
          <p className="mt-1 text-[13.5px] font-semibold text-foreground">No audience selected</p>
          <p className="max-w-sm text-[12.5px] text-muted-foreground">
            Create an audience to target guests by room numbers, room types or rate codes.
          </p>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AudienceDetail({
  audience,
  used,
  onEdit,
  onDelete,
  onUsage,
  onUseIn,
}: {
  audience: CustomAudience;
  used: number;
  onEdit: () => void;
  onDelete: () => void;
  onUsage: () => void;
  onUseIn: (categoryId: string) => void;
}) {
  const [tab, setTab] = useState<"recipients" | "rules">("recipients");
  const [q, setQ] = useState("");
  const [room, setRoom] = useState("");
  const [roomType, setRoomType] = useState("");
  const [rateCode, setRateCode] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const [useMenu, setUseMenu] = useState(false);

  const resolved = useMemo(
    () => resolveAudience(audience.rules, audience.added, audience.excluded),
    [audience],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return resolved.recipients.filter((g) => {
      if (t && !g.name.toLowerCase().includes(t) && !String(g.room).includes(t)) return false;
      if (room && String(g.room) !== room) return false;
      if (roomType && g.roomType !== roomType) return false;
      if (rateCode && g.rateCode !== rateCode) return false;
      return true;
    });
  }, [resolved.recipients, q, room, roomType, rateCode]);

  useEffect(() => setPage(1), [q, room, roomType, rateCode, size]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * size, current * size);

  const rooms = useMemo(
    () => [...new Set(resolved.recipients.map((g) => String(g.room)))].sort(),
    [resolved.recipients],
  );

  const selectCls =
    "h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground outline-none focus:border-ring";

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <header className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[16px] font-semibold tracking-tight text-foreground">
                {audience.name}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded border border-chart-2/40 bg-chart-2/10 px-1.5 py-0.5 text-[11px] font-medium text-chart-2">
                <span className="size-1.5 rounded-full bg-chart-2" />
                Active
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{audienceSummary(audience)}</p>
          </div>
          <div className="relative flex items-center gap-1.5">
            <button
              type="button"
              className={btnGhost}
              onClick={() => setUseMenu((m) => !m)}
              aria-expanded={useMenu}
            >
              <CalendarPlus size={14} />
              Use in
              <ChevronDown size={13} />
            </button>
            <button type="button" className={btnGhost} onClick={onEdit}>
              <Pencil size={13} />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 size={13} />
              Delete
            </button>
            {useMenu && (
              <div className="absolute right-0 top-11 z-30 w-56 rounded-md border border-border bg-popover p-1 shadow-lg">
                <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Guest category
                </p>
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setUseMenu(false);
                      onUseIn(p.id);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] text-foreground hover:bg-accent"
                  >
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {guestsForPreset(p.id).length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="-mb-4 mt-3 flex gap-5" aria-label="Audience detail sections">
          {(
            [
              ["recipients", "Recipients"],
              ["rules", "Rules"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id}
              className={`border-b-2 px-0.5 pb-2.5 text-[13px] font-medium transition-colors ${
                tab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="space-y-4 p-5">
        {tab === "recipients" ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13.5px] font-semibold text-foreground">
                Recipients ({resolved.recipients.length})
              </h3>
              <button
                type="button"
                onClick={onUsage}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                <BarChart3 size={13} />
                Used in {used} announcement{used === 1 ? "" : "s"}
              </button>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search recipients..."
                aria-label="Search recipients"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal size={13} className="text-muted-foreground" />
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className={selectCls}
                aria-label="Filter by room"
              >
                <option value="">All rooms</option>
                {rooms.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className={selectCls}
                aria-label="Filter by room type"
              >
                <option value="">All room types</option>
                {ROOM_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <select
                value={rateCode}
                onChange={(e) => setRateCode(e.target.value)}
                className={selectCls}
                aria-label="Filter by rate code"
              >
                <option value="">All rate codes</option>
                {RATE_CODES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {(room || roomType || rateCode || q) && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setRoom("");
                    setRoomType("");
                    setRateCode("");
                  }}
                  className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead className="bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Guest name</th>
                    <th className="px-3 py-2 font-medium">Room</th>
                    <th className="px-3 py-2 font-medium">Room type</th>
                    <th className="px-3 py-2 font-medium">Rate code</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => (
                    <tr key={g.id} className="border-t border-border transition-colors hover:bg-primary/[0.04]">
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {g.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)}
                          </span>
                          <span className="font-medium text-foreground">{g.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-foreground">{g.room}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{g.roomType}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-muted-foreground">
                        {g.rateCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="grid place-items-center gap-1.5 border-t border-border px-6 py-12 text-center">
                  <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                    <UserX size={17} />
                  </span>
                  <p className="mt-1 text-[13px] font-semibold text-foreground">
                    {resolved.recipients.length === 0
                      ? "This audience matches no guests"
                      : "No recipients match these filters"}
                  </p>
                  <p className="max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
                    {resolved.recipients.length === 0
                      ? "The room, room-type and rate-code rules combine to an empty set. Loosen a rule to reach guests."
                      : "Try clearing a filter or searching for a different guest."}
                  </p>
                  {resolved.recipients.length === 0 ? (
                    <button type="button" className={`${btnGhost} mt-2`} onClick={onEdit}>
                      <Pencil size={13} />
                      Edit rules
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${btnGhost} mt-2`}
                      onClick={() => {
                        setQ("");
                        setRoom("");
                        setRoomType("");
                        setRateCode("");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
                <span className="tabular-nums">
                  Showing {(current - 1) * size + 1}–{Math.min(current * size, filtered.length)} of{" "}
                  {filtered.length} recipients
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <label htmlFor="rows-per-page">Rows per page:</label>
                  <select
                    id="rows-per-page"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className={selectCls}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                    className="grid size-7 place-items-center rounded-md border border-input disabled:opacity-40 hover:bg-accent"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="tabular-nums text-foreground">
                    {current} / {pages}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={current === pages}
                    onClick={() => setPage(current + 1)}
                    className="grid size-7 place-items-center rounded-md border border-input disabled:opacity-40 hover:bg-accent"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <RulesCard audience={audience} />
          </>
        ) : (
          <div className="space-y-4">
            <RuleRow label="Room numbers" values={audience.rules.rooms} rooms />
            <RuleRow label="Room types" values={audience.rules.roomTypes} />
            <RuleRow label="Rate codes" values={audience.rules.rateCodes} />
            <RuleRow
              label="Manual adjustments"
              values={[
                ...(audience.added.length ? [`+${audience.added.length} added`] : []),
                ...(audience.excluded.length ? [`−${audience.excluded.length} excluded`] : []),
              ]}
            />
            <RulesCard audience={audience} />
            <button type="button" className={btnGhost} onClick={onEdit}>
              <Pencil size={13} />
              Edit rules
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function RuleRow({
  label,
  values,
  rooms = false,
}: {
  label: string;
  values: string[];
  rooms?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {values.length === 0 ? (
        <p className="mt-1 text-[12.5px] text-muted-foreground">Not restricted</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(rooms ? compressed(values) : values).map((v) => (
            <span
              key={v}
              className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11.5px] font-medium text-foreground"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function compressed(rooms: string[]): string[] {
  const nums = rooms
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const out: string[] = [];
  let start = nums[0];
  let prev = nums[0];
  for (const n of nums.slice(1)) {
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    out.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  if (nums.length) out.push(start === prev ? `${start}` : `${start}–${prev}`);
  return out;
}

function RulesCard({ audience }: { audience: CustomAudience }) {
  return (
    <aside className="flex gap-2.5 rounded-lg border border-primary/20 border-l-2 border-l-primary bg-primary/[0.06] px-3.5 py-3">
      <Info size={15} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <p className="text-[12.5px] font-semibold text-foreground">Audience rules</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {rulesSentence(audience)}
        </p>
      </div>
    </aside>
  );
}
