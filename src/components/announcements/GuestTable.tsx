import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Guest } from "@/lib/announcements";
import { ROOM_TYPES, RATE_CODES } from "@/lib/announcements";

function Cb({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="size-3.5 cursor-pointer accent-primary align-middle"
    />
  );
}

/**
 * Compact roster table used both in the audience builder preview and in the
 * individual guest-selection step of the composer.
 */
export function GuestTable({
  guests,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  emptyAction,
  showStatus = false,
}: {
  guests: Guest[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  emptyAction?: React.ReactNode;
  showStatus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [roomType, setRoomType] = useState("");
  const [rateCode, setRateCode] = useState("");
  const [room, setRoom] = useState("");

  const rows = useMemo(
    () =>
      guests.filter((g) => {
        const t = q.trim().toLowerCase();
        if (t && !g.name.toLowerCase().includes(t) && !String(g.room).includes(t)) return false;
        if (roomType && g.roomType !== roomType) return false;
        if (rateCode && g.rateCode !== rateCode) return false;
        if (room && !String(g.room).startsWith(room)) return false;
        return true;
      }),
    [guests, q, roomType, rateCode, room],
  );

  const allOn = rows.length > 0 && rows.every((g) => selected.has(g.id));
  const selectCls =
    "h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground outline-none focus:border-ring";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guests by name or room..."
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-[12.5px] outline-none focus:border-ring"
          />
        </div>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value.replace(/\D/g, ""))}
          placeholder="Room number"
          className={`${selectCls} w-28`}
        />
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className={selectCls}
          aria-label="Room type filter"
        >
          <option value="">Room type</option>
          {ROOM_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={rateCode}
          onChange={(e) => setRateCode(e.target.value)}
          className={selectCls}
          aria-label="Rate code filter"
        >
          <option value="">Rate code</option>
          {RATE_CODES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
        <button
          type="button"
          onClick={onSelectAll}
          className="font-medium text-foreground hover:underline"
        >
          Select all
        </button>
        <span className="text-border">|</span>
        <button
          type="button"
          onClick={onClearAll}
          className="font-medium text-foreground hover:underline"
        >
          Deselect all
        </button>
        <span className="ml-auto tabular-nums">
          {guests.length} matched · {selected.size} selected
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-9 px-3 py-2">
                <Cb checked={allOn} onChange={() => (allOn ? onClearAll() : onSelectAll())} />
              </th>
              <th className="px-3 py-2 font-medium">Guest</th>
              <th className="px-3 py-2 font-medium">Room</th>
              <th className="px-3 py-2 font-medium">Room type</th>
              <th className="px-3 py-2 font-medium">Rate code</th>
              <th className="px-3 py-2 font-medium">Stay</th>
              {showStatus && <th className="px-3 py-2 font-medium">Status</th>}
              <th className="w-9 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-3 py-2">
                  <Cb checked={selected.has(g.id)} onChange={() => onToggle(g.id)} />
                </td>
                <td className="px-3 py-2 font-medium text-foreground">{g.name}</td>
                <td className="px-3 py-2 tabular-nums text-foreground">{g.room}</td>
                <td className="px-3 py-2 text-muted-foreground">{g.roomType}</td>
                <td className="px-3 py-2 font-mono text-[11.5px] text-muted-foreground">
                  {g.rateCode}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{g.stay}</td>
                {showStatus && <td className="px-3 py-2 text-muted-foreground">{g.status}</td>}
                <td className="px-3 py-2">
                  {selected.has(g.id) && (
                    <button
                      type="button"
                      aria-label={`Remove ${g.name}`}
                      onClick={() => onToggle(g.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] font-medium text-foreground">
              No guests match these conditions
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Try adjusting the room number, room type, or rate code filters.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setRoom("");
                  setRoomType("");
                  setRateCode("");
                }}
                className="rounded-md border border-input px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-accent"
              >
                Clear filters
              </button>
              {emptyAction}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
