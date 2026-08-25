import { TriangleAlert } from "lucide-react";
import type { Announcement, CustomAudience } from "@/lib/announcements";
import { audienceSummary } from "@/lib/announcements";
import { Modal, btnDanger, btnGhost } from "./ui";

/** Confirmation modal before deleting a custom audience. */
export function DeleteAudienceDialog({
  open,
  audience,
  announcements,
  onClose,
  onConfirm,
}: {
  open: boolean;
  audience: CustomAudience | null;
  announcements: Announcement[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!audience) return null;
  const scheduled = announcements.filter(
    (a) => a.audienceId === audience.id && a.status === "Scheduled",
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delete “${audience.name}”?`}
      subtitle={audienceSummary(audience)}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnDanger} onClick={onConfirm}>
            Delete audience
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          This removes the audience and its rule set. Past announcements that used it keep their
          delivery history.
        </p>
        {scheduled.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-md border border-chart-5/40 bg-chart-5/10 px-3 py-2.5">
            <TriangleAlert size={15} className="mt-0.5 shrink-0 text-chart-5" />
            <p className="text-[12.5px] leading-relaxed text-foreground">
              {scheduled.length} scheduled announcement{scheduled.length === 1 ? "" : "s"} still
              target{scheduled.length === 1 ? "s" : ""} this audience
              {scheduled.length === 1 ? "" : ""} — {scheduled.length === 1 ? "it" : "they"} will be
              moved to draft.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
