import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search, X } from "lucide-react";
import { Modal, btnGhost, btnPrimary } from "./ui";

/**
 * Shared Configure panel used for room numbers, room types and rate codes.
 * Two panes: everything available on the left, the current selection on the
 * right. Room numbers additionally support "from → to" range selection.
 * Mount it with a `key` so the draft selection resets each time it opens.
 */
export function ConfigurePanel({
  title,
  searchPlaceholder,
  options,
  counts,
  initial,
  allowRange = false,
  onClose,
  onApply,
}: {
  title: string;
  searchPlaceholder: string;
  options: readonly string[];
  counts?: Record<string, number>;
  initial: string[];
  /** Enables the numeric from–to range adder (room numbers). */
  allowRange?: boolean;
  onClose: () => void;
  onApply: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>(initial);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(t));
  }, [options, q]);

  const selSet = useMemo(() => new Set(sel), [sel]);
  const allShown = rows.length > 0 && rows.every((o) => selSet.has(o));
  const toggle = (v: string) =>
    setSel((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const orderedSel = useMemo(
    () =>
      allowRange
        ? [...sel].sort((a, b) => Number(a) - Number(b))
        : [...sel].sort((a, b) => a.localeCompare(b)),
    [sel, allowRange],
  );

  const addRange = () => {
    const a = Number(from);
    const b = Number(to);
    if (!from || !to || Number.isNaN(a) || Number.isNaN(b)) {
      setRangeError("Enter both a start and an end room number.");
      return;
    }
    if (b < a) {
      setRangeError("The end room must be greater than the start room.");
      return;
    }
    const inRange = options.filter((o) => {
      const n = Number(o);
      return !Number.isNaN(n) && n >= a && n <= b;
    });
    if (inRange.length === 0) {
      setRangeError(`No rooms exist between ${a} and ${b}.`);
      return;
    }
    setRangeError(null);
    setSel((prev) => [...new Set([...prev, ...inRange])]);
    setFrom("");
    setTo("");
  };

  const numInput =
    "h-9 w-24 rounded-md border border-input bg-background px-2.5 text-[13px] tabular-nums outline-none focus:border-ring";

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={
        allowRange
          ? "Add a room range, then fine-tune with individual rooms."
          : "Pick from the list on the left — your selection builds on the right."
      }
      width="58rem"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={() => onApply(sel)}>
            <Check size={14} />
            Apply {sel.length > 0 && `(${sel.length})`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {allowRange && (
          <section className="rounded-md border border-border bg-muted/40 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Add a room range
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor="room-from" className="text-[12.5px] text-muted-foreground">
                From
              </label>
              <input
                id="room-from"
                inputMode="numeric"
                value={from}
                onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))}
                placeholder="100"
                className={numInput}
              />
              <label htmlFor="room-to" className="text-[12.5px] text-muted-foreground">
                To
              </label>
              <input
                id="room-to"
                inputMode="numeric"
                value={to}
                onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))}
                placeholder="199"
                className={numInput}
              />
              <button type="button" className={btnGhost} onClick={addRange}>
                <Plus size={14} />
                Add range
              </button>
              <span className="text-[12px] text-muted-foreground">
                You can add several ranges and single rooms.
              </span>
            </div>
            {rangeError && <p className="mt-2 text-[12px] text-destructive">{rangeError}</p>}
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* -------- available -------- */}
          <section className="rounded-md border border-border">
            <header className="border-b border-border px-3.5 py-2.5">
              <p className="text-[13px] font-semibold text-foreground">
                Available ({options.length})
              </p>
              <p className="text-[12px] text-muted-foreground">Tap a row to add it</p>
              <div className="relative mt-2.5">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-[13px] outline-none focus:border-ring"
                />
              </div>
              <div className="mt-2 flex items-center gap-3 text-[12px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() =>
                    setSel(
                      allShown
                        ? sel.filter((s) => !rows.includes(s))
                        : [...new Set([...sel, ...rows])],
                    )
                  }
                  className="font-medium text-foreground hover:underline"
                >
                  {allShown ? "Remove shown" : "Add all shown"}
                </button>
                <span className="ml-auto tabular-nums">{rows.length} shown</span>
              </div>
            </header>

            <div className="max-h-72 overflow-y-auto">
              {rows.length === 0 && (
                <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
                  No matches
                </p>
              )}
              {rows.map((o) => {
                const on = selSet.has(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggle(o)}
                    className="flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left text-[13px] last:border-b-0 hover:bg-muted/50"
                  >
                    <span
                      aria-hidden
                      className={`grid size-4.5 shrink-0 place-items-center rounded-full ${
                        on
                          ? "bg-chart-2 text-primary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                      style={{ width: "1.125rem", height: "1.125rem" }}
                    >
                      {on ? <Check size={11} /> : <Plus size={11} />}
                    </span>
                    <span className="flex-1 truncate text-foreground">{o}</span>
                    {counts?.[o] !== undefined && (
                      <span className="tabular-nums text-[12px] text-muted-foreground">
                        {counts[o]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* -------- selected -------- */}
          <section className="rounded-md border border-border">
            <header className="flex items-start justify-between gap-3 border-b border-border px-3.5 py-2.5">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Selected</p>
                <p className="text-[12px] text-muted-foreground">
                  {sel.length} selected — this is your preview
                </p>
              </div>
              {sel.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSel([])}
                  className="text-[12px] font-medium text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </button>
              )}
            </header>

            <div className="max-h-72 overflow-y-auto">
              {orderedSel.length === 0 ? (
                <p className="px-3 py-10 text-center text-[12.5px] text-muted-foreground">
                  Nothing selected yet.
                </p>
              ) : (
                orderedSel.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-2.5 border-b border-border px-3 py-2 text-[13px] last:border-b-0"
                  >
                    <button
                      type="button"
                      aria-label={`Remove ${s}`}
                      onClick={() => toggle(s)}
                      className="grid shrink-0 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      style={{ width: "1.125rem", height: "1.125rem" }}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="flex-1 truncate text-foreground">{s}</span>
                    {counts?.[s] !== undefined && (
                      <span className="tabular-nums text-[12px] text-muted-foreground">
                        {counts[s]}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {sel.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Preview
            </span>
            {orderedSel.slice(0, 24).map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[11.5px] font-medium text-foreground"
              >
                {s}
                <button
                  type="button"
                  aria-label={`Remove ${s}`}
                  onClick={() => toggle(s)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            {orderedSel.length > 24 && (
              <span className="text-[11.5px] text-muted-foreground">
                +{orderedSel.length - 24} more
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
