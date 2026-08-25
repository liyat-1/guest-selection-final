import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

/** Searchable multi-select, mirroring the drip-campaign rate-code selector. */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Search…",
  emptyLabel = "Select values",
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const available = options.filter(
    (o) => !selected.includes(o) && o.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);

  return (
    <div className="space-y-2">
      <div className="text-[12.5px] font-medium text-foreground">{label}</div>
      <div ref={wrap} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5 text-left text-[13px] transition-colors ${
            open ? "border-ring ring-2 ring-ring/20" : "border-input hover:border-ring/60"
          }`}
        >
          <span className="flex flex-wrap gap-1">
            {selected.length === 0 && <span className="text-muted-foreground">{emptyLabel}</span>}
            {selected.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[11.5px] font-medium text-foreground"
              >
                {s}
                <X
                  size={11}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(s);
                  }}
                />
              </span>
            ))}
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="mb-1 h-8 w-full rounded border border-input bg-background px-2 text-[12.5px] outline-none focus:border-ring"
            />
            <div className="px-2 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Available {label.toLowerCase()} ({available.length})
            </div>
            <div className="max-h-52 overflow-y-auto">
              {available.length === 0 && (
                <div className="px-2 py-3 text-[12.5px] text-muted-foreground">No matches</div>
              )}
              {available.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent"
                >
                  {o}
                </button>
              ))}
            </div>
            {selected.length > 0 && (
              <>
                <div className="mt-1 border-t border-border px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Selected ({selected.length})
                </div>
                {selected.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggle(o)}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent"
                  >
                    {o}
                    <Check size={13} />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
