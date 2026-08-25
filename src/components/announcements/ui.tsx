import { useEffect } from "react";
import { X } from "lucide-react";

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25`;
export const btnGhost = `${btnBase} border border-input bg-background text-foreground shadow-xs hover:border-ring/40 hover:bg-accent hover:text-accent-foreground`;
export const btnDanger = `${btnBase} bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90`;
export const btnSubtle = `${btnBase} text-muted-foreground hover:bg-accent hover:text-accent-foreground`;

/* ---------------------------- form controls ---------------------------- */

/** Shared input/select chrome so every filter row reads identically. */
export const field =
  "h-9 rounded-lg border border-input bg-background px-2.5 text-[12.5px] text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground/70 hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/15";

export const fieldSelect = `${field} cursor-pointer pr-7 appearance-none bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat bg-[image:var(--select-caret)]`;

/* ------------------------------- tables -------------------------------- */

export const tableWrap =
  "overflow-hidden rounded-xl border border-border bg-background shadow-xs";
export const tableEl = "w-full border-collapse text-left text-[12.5px]";
export const tableHead =
  "border-b border-border bg-muted/45 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
export const th = "px-3.5 py-2.5 font-semibold whitespace-nowrap";
export const tr =
  "border-t border-border/70 transition-colors first:border-t-0 hover:bg-primary/[0.035]";
export const td = "px-3.5 py-2.5 align-middle";

/** Small circular initials chip used in roster tables. */
export function Initials({ name }: { name: string }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/15">
      {name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}

/* ----------------------------- empty state ----------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  dashed = false,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`grid place-items-center px-6 py-12 text-center ${
        dashed ? "rounded-xl border border-dashed border-border bg-muted/20" : ""
      } ${className}`}
    >
      <span className="grid size-11 place-items-center rounded-full bg-primary/[0.07] text-primary ring-1 ring-inset ring-primary/12">
        {icon}
      </span>
      <p className="mt-3 text-[13.5px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-3.5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------- overlays ------------------------------ */

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="grid size-8 shrink-0 place-items-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
    >
      <X size={15} />
    </button>
  );
}

function OverlayFrame({
  onClose,
  title,
  subtitle,
  eyebrow,
  width,
  headerExtra,
  footer,
  children,
  radius,
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  width: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  radius: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6">
      <div
        className="absolute inset-0 scrim backdrop-blur-[3px] duration-200 animate-in fade-in"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden border border-border bg-background shadow-overlay duration-200 animate-in fade-in zoom-in-[0.98] ${radius}`}
        style={{ maxWidth: width }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-gradient-to-b from-muted/50 to-muted/20 px-6 py-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                {eyebrow}
              </p>
            )}
            <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <CloseButton onClose={onClose} />
        </header>
        {headerExtra && (
          <div className="shrink-0 border-b border-border bg-background px-6">{headerExtra}</div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/[0.18] px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-6 py-3.5">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}

/**
 * Large centered overlay used for the audience builder and usage view.
 * (Kept the SidePanel name for call sites; it renders as a middle overlay.)
 */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  width = "56rem",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  width?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <OverlayFrame
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      width={width}
      footer={footer}
      radius="rounded-2xl"
    >
      {children}
    </OverlayFrame>
  );
}

/** Centered modal for confirmations and the schedule flow. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  width = "34rem",
  headerExtra,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  width?: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <OverlayFrame
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      width={width}
      headerExtra={headerExtra}
      footer={footer}
      radius="rounded-2xl"
    >
      {children}
    </OverlayFrame>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Scheduled"
      ? "border-primary/20 bg-primary/[0.08] text-primary"
      : status === "Completed"
        ? "border-chart-emerald/25 bg-chart-emerald/[0.1] text-chart-emerald"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
