import { useMemo, useState } from "react";
import { Search, UserX, X } from "lucide-react";
import type { Guest } from "@/lib/announcements";
import { ROOM_TYPES, RATE_CODES } from "@/lib/announcements";
import {
  EmptyState,
  Initials,
  btnGhost,
  field,
  fieldSelect,
  tableEl,
  tableHead,
  tableWrap,
  td,
  th,
  tr,
} from "./ui";

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
  const clearAllFilters = () => {
    setQ("");
    setRoom("");
    setRoomType("");
    setRateCode("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guests by name or room…"
            className={`${field} w-full pl-9`}
          />
        </div>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value.replace(/\D/g, ""))}
          placeholder="Room no."
          className={`${field} w-28`}
        />
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className={fieldSelect}
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
          className={fieldSelect}
          aria-label="Rate code filter"
        >
          <option value="">Rate code</option>
          {RATE_CODES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className={tableWrap}>
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/25 px-3.5 py-2 text-[12px] text-muted-foreground">
          <button
            type="button"
            onClick={onSelectAll}
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            Select all
          </button>
          <span className="h-3 w-px bg-border" />
          <button
            type="button"
            onClick={onClearAll}
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            Deselect all
          </button>
          <span className="ml-auto tabular-nums">
            <span className="font-semibold text-foreground">{rows.length}</span> matched ·{" "}
            <span className="font-semibold text-foreground">{selected.size}</span> selected
          </span>
        </div>

        <table className={tableEl}>
          <thead className={tableHead}>
            <tr>
              <th className="w-10 px-3.5 py-2.5">
                <Cb checked={allOn} onChange={() => (allOn ? onClearAll() : onSelectAll())} />
              </th>
              <th className={th}>Guest</th>
              <th className={th}>Room</th>
              <th className={th}>Room type</th>
              <th className={th}>Rate code</th>
              <th className={th}>Stay</th>
              {showStatus && <th className={th}>Status</th>}
              <th className="w-10 px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const on = selected.has(g.id);
              return (
                <tr key={g.id} className={`${tr} ${on ? "bg-primary/[0.045]" : ""}`}>
                  <td className={td}>
                    <Cb checked={on} onChange={() => onToggle(g.id)} />
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      <Initials name={g.name} />
                      <span className="font-medium text-foreground">{g.name}</span>
                    </span>
                  </td>
                  <td className={`${td} tabular-nums text-foreground`}>{g.room}</td>
                  <td className={`${td} text-muted-foreground`}>{g.roomType}</td>
                  <td className={`${td} font-mono text-[11.5px] text-muted-foreground`}>
                    {g.rateCode}
                  </td>
                  <td className={`${td} text-muted-foreground`}>{g.stay}</td>
                  {showStatus && <td className={`${td} text-muted-foreground`}>{g.status}</td>}
                  <td className={td}>
                    {on && (
                      <button
                        type="button"
                        aria-label={`Remove ${g.name}`}
                        onClick={() => onToggle(g.id)}
                        className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <EmptyState
            icon={<UserX size={18} />}
            title="No guests match these conditions"
            description="Try adjusting the room number, room type, or rate code filters."
            action={
              <>
                <button type="button" onClick={clearAllFilters} className={btnGhost}>
                  Clear filters
                </button>
                {emptyAction}
              </>
            }
          />
        )}
      </div>
    </div>
  );
}
