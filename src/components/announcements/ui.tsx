import { X } from "lucide-react";

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25`;
export const btnGhost = `${btnBase} border border-input bg-background text-foreground shadow-xs hover:border-ring/40 hover:bg-accent hover:text-accent-foreground`;
export const btnDanger = `${btnBase} bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90`;


/**
 * Large centered overlay used for the audience builder and usage view.
 * (Kept the SidePanel name for call sites; it renders as a middle overlay.)
 */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  width = "56rem",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl duration-150 animate-in fade-in zoom-in-95"
        style={{ maxWidth: width }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-muted/30 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-3.5">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}

/** Centered modal for confirmations and the schedule flow. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  width = "34rem",
  headerExtra,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full flex-col rounded-lg border border-border bg-background shadow-2xl"
        style={{ maxWidth: width }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={15} />
          </button>
        </header>
        {headerExtra && <div className="shrink-0 border-b border-border px-5">{headerExtra}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Scheduled"
      ? "border-primary/25 bg-primary/10 text-primary"
      : status === "Completed"
        ? "border-border bg-muted text-muted-foreground"
        : "border-chart-5/40 bg-chart-5/10 text-chart-5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {status}
    </span>
  );
}

