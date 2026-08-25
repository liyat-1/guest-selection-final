import { useState } from "react";
import { CalendarClock, Check, Send, TriangleAlert, Users } from "lucide-react";
import { Modal, btnGhost, btnPrimary } from "./ui";

const HOTEL_TZ = "Hotel time (GMT+3)";

function formatWhen(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const clock = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${clock}`;
}

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Final step after "Schedule announcement": date, time, hotel timezone and the
 * send/schedule decision. Deliberately small — never a second workspace.
 */
export function SchedulerOverlay({
  audienceLabel,
  recipients,
  onClose,
  onConfirm,
}: {
  audienceLabel: string;
  recipients: number;
  onClose: () => void;
  onConfirm: (result: { sendNow: boolean; when: string }) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("18:00");
  const [tried, setTried] = useState(false);

  const noRecipients = recipients === 0;
  const parsed = new Date(`${date}T${time}`);
  const error = noRecipients
    ? "Add at least one guest before scheduling this announcement."
    : !date
      ? "Select a date."
      : !time
        ? "Select a time."
        : Number.isNaN(parsed.getTime())
          ? "That date and time is not valid."
          : parsed.getTime() <= Date.now()
            ? "Pick a date and time in the future."
            : null;

  const confirm = (sendNow: boolean) => {
    setTried(true);
    if (noRecipients) return;
    if (sendNow) {
      onConfirm({ sendNow: true, when: `Sent ${formatWhen(todayISO(), "12:00")}` });
      return;
    }
    if (error) return;
    onConfirm({ sendNow: false, when: formatWhen(date, time) });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Schedule announcement"
      subtitle="Choose when this message goes out."
      width="30rem"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnGhost} onClick={() => confirm(true)}>
            <Send size={14} />
            Send now
          </button>
          <button type="button" className={btnPrimary} onClick={() => confirm(false)}>
            <Check size={14} />
            Schedule
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/40 px-3.5 py-3 text-[12.5px]">
          <p className="text-foreground">
            <span className="text-muted-foreground">Audience: </span>
            <span className="font-medium">{audienceLabel || "—"}</span>
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-muted-foreground">
            <Users size={13} />
            {recipients} recipient{recipients === 1 ? "" : "s"}
          </p>
        </div>

        {noRecipients ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3.5 py-3">
            <p className="text-[13px] font-medium text-foreground">No recipients selected</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Add at least one guest before scheduling this announcement.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="sch-date" className="text-[12.5px] font-medium text-foreground">
                Date
              </label>
              <input
                id="sch-date"
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none focus:border-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sch-time" className="text-[12.5px] font-medium text-foreground">
                Time
              </label>
              <input
                id="sch-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none focus:border-ring"
              />
            </div>
          </div>
        )}

        <p className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <CalendarClock size={13} />
          {HOTEL_TZ}
        </p>

        {tried && error && (
          <p className="inline-flex items-center gap-1.5 text-[12.5px] text-destructive">
            <TriangleAlert size={14} />
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
