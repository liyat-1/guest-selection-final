import { CalendarClock, MessageSquareOff, Pencil, Trash2 } from "lucide-react";
import type { Announcement, CustomAudience } from "@/lib/announcements";
import { audienceSummary } from "@/lib/announcements";
import { SidePanel, StatusPill, btnDanger, btnGhost } from "./ui";

/**
 * Read-only view of the messages that reference an audience — the "message
 * context" used before editing or deleting it.
 */
export function UsagePanel({
  open,
  audience,
  announcements,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  audience: CustomAudience | null;
  announcements: Announcement[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!audience) return null;
  const used = announcements.filter((a) => a.audienceId === audience.id);
  const scheduled = used.filter((a) => a.status === "Scheduled").length;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={`“${audience.name}” usage`}
      subtitle={audienceSummary(audience)}
      width="30rem"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onEdit}>
            <Pencil size={14} />
            Edit audience
          </button>
          <button type="button" className={btnDanger} onClick={onDelete}>
            <Trash2 size={14} />
            Delete
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-[12.5px] text-muted-foreground">
          <CalendarClock size={14} className="shrink-0" />
          {used.length === 0
            ? "No messages use this audience yet."
            : `${used.length} message${used.length === 1 ? "" : "s"} use this audience${
                scheduled ? ` — ${scheduled} still scheduled` : ""
              }.`}
        </div>

        {used.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-md border border-dashed border-border px-4 py-10 text-center">
            <MessageSquareOff size={18} className="text-muted-foreground" />
            <p className="text-[13px] font-medium text-foreground">Nothing references it</p>
            <p className="text-[12.5px] text-muted-foreground">
              Safe to edit or delete — no announcements depend on this audience.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {used.map((a) => (
              <li key={a.id} className="rounded-md border border-border bg-background p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-foreground">{a.title}</p>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  {a.body}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span className="truncate">{a.when}</span>
                  <span className="shrink-0 tabular-nums">
                    {a.recipients.toLocaleString()} recipient{a.recipients === 1 ? "" : "s"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidePanel>
  );
}
