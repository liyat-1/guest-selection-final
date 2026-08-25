import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, Pin, X } from "lucide-react";

/**
 * Explainer used next to a metric label.
 *
 * Hover (or focus) previews the definition; clicking pins it so it stays open
 * while the number is being read, with an explicit dismiss control. Escape or
 * an outside click also unpins it.
 *
 * `tone="dark"` is for the solid coloured KPI tiles, where the trigger has to
 * read as white-on-colour.
 */
export function InfoTip({
  title,
  children,
  align = "left",
  tone = "light",
}: {
  title: string;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  tone?: "light" | "dark";
}) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const wrap = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPinned(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  const open = pinned || hovered;

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = wrap.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 248;
      const preferred =
        align === "right" ? rect.right - width : align === "center" ? rect.left + rect.width / 2 - width / 2 : rect.left;
      setPosition({
        left: Math.max(12, Math.min(preferred, window.innerWidth - width - 12)),
        top: Math.max(12, rect.top - 12),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [align, open]);

  const trigger = pinned
    ? "bg-slate-900 text-white ring-1 ring-slate-900"
    : tone === "dark"
      ? "bg-white/15 text-white/80 ring-1 ring-white/20 hover:bg-white/25 hover:text-white"
      : "text-slate-400 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-700";

  return (
    <span
      ref={wrap}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rendered as a span: these tips live inside clickable cards, and a
          nested <button> is invalid HTML. */}
      <span
        role="button"
        tabIndex={0}
        aria-label={pinned ? `Unpin ${title} explainer` : `Pin ${title} explainer`}
        aria-expanded={pinned}
        aria-describedby={id}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setPinned((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.stopPropagation();
          e.preventDefault();
          setPinned((v) => !v);
        }}
        className={`grid size-[17px] shrink-0 place-items-center rounded-full transition-colors ${trigger}`}
      >
        {pinned ? <Pin size={10} /> : <Info size={11} />}
      </span>

      {open && typeof document !== "undefined" ? createPortal(<span
        id={id}
        role="tooltip"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[120] w-[248px] -translate-y-full overflow-hidden rounded-lg border border-ota-border bg-ota-surface text-left shadow-pop"
        style={{ left: position.left, top: position.top }}
      >
        <span className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {title}
          </span>
          {pinned ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Unpin explainer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setPinned(false);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setPinned(false);
              }}
              className="grid size-5 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700"
            >
              <X size={11} />
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-slate-400">
              <Pin size={9} /> click to pin
            </span>
          )}
        </span>
        <span className="block px-3 py-2.5 text-[11.5px] font-normal leading-relaxed text-slate-600">
          {children}
        </span>
      </span>, document.body) : null}
    </span>
  );
}
