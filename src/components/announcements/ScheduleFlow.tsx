import { useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { Announcement, CustomAudience, Guest } from "@/lib/announcements";
import {
  GUESTS,
  PRESETS,
  audienceCount,
  audienceSummary,
  emptyRules,
  guestsForPreset,
  isPresetId,
  presetName,
  resolveAudience,
} from "@/lib/announcements";
import { AudienceEditor, type AudienceDraft } from "./AudienceEditor";
import { GuestTable } from "./GuestTable";
import { SchedulerOverlay } from "./SchedulerOverlay";
import { SmsPreview } from "@/components/editor/SmsPreview";
import { Modal, btnGhost, btnPrimary } from "./ui";

type Tab = "announcement" | "audience";
/** How the recipient set for this announcement is being defined. */
type Source = "existing" | "new" | "individual";

const TOKENS = [
  { label: "First name", value: "{{guest.first_name}}" },
  { label: "Room type", value: "{{room_type}}" },
  { label: "Arrival date", value: "{{arrival_date}}" },
];

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

const blankDraft = (): AudienceDraft => ({
  id: null,
  name: "",
  rules: { ...emptyRules },
  added: [],
  excluded: [],
});

/**
 * Single scheduling workspace: two tabs (Announcement / Audience) that share
 * state. Delivery date and time never live inside the tabs — the persistent
 * "Schedule announcement" action opens the small scheduler overlay instead.
 */
export function ScheduleFlow({
  open,
  categoryId,
  audiences,
  announcements,
  initialAudienceId,
  onClose,
  onScheduled,
  onSaveAudience,
  onDeleteAudience,
}: {
  open: boolean;
  /** Guest category this announcement is being written for. */
  categoryId: string | null;
  audiences: CustomAudience[];
  announcements: Announcement[];
  initialAudienceId?: string | null;
  onClose: () => void;
  onScheduled: (a: Announcement) => void;
  onSaveAudience: (a: CustomAudience) => void;
  onDeleteAudience: (a: CustomAudience) => void;
}) {
  if (!open) return null;
  return (
    <FlowInner
      key={`${categoryId ?? "all"}:${initialAudienceId ?? "blank"}`}
      categoryId={categoryId}
      audiences={audiences}
      announcements={announcements}
      initialAudienceId={initialAudienceId ?? null}
      onClose={onClose}
      onScheduled={onScheduled}
      onSaveAudience={onSaveAudience}
      onDeleteAudience={onDeleteAudience}
    />
  );
}

function FlowInner({
  categoryId,
  audiences,
  announcements,
  initialAudienceId,
  onClose,
  onScheduled,
  onSaveAudience,
  onDeleteAudience,
}: {
  categoryId: string | null;
  audiences: CustomAudience[];
  announcements: Announcement[];
  initialAudienceId: string | null;
  onClose: () => void;
  onScheduled: (a: Announcement) => void;
  onSaveAudience: (a: CustomAudience) => void;
  onDeleteAudience: (a: CustomAudience) => void;
}) {
  const [tab, setTab] = useState<Tab>(initialAudienceId ? "announcement" : "audience");

  // ---- message state ----
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // ---- audience state ----
  const [source, setSource] = useState<Source>("existing");
  const [attachedId, setAttachedId] = useState<string | null>(initialAudienceId);
  /** Guests removed from this announcement only (never saved to the audience). */
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // ---- inline builder state (create / edit a reusable audience) ----
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AudienceDraft>(blankDraft);

  const [confirmDelete, setConfirmDelete] = useState<CustomAudience | null>(null);
  const [tried, setTried] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  /** Guests eligible for this announcement — scoped by the guest category. */
  const pool: Guest[] = useMemo(
    () => (categoryId && isPresetId(categoryId) ? guestsForPreset(categoryId) : GUESTS),
    [categoryId],
  );
  const poolIds = useMemo(() => new Set(pool.map((g) => g.id)), [pool]);

  const attachedAudience = audiences.find((a) => a.id === attachedId) ?? null;

  const draftResolved = useMemo(
    () => resolveAudience(draft.rules, draft.added, draft.excluded),
    [draft.rules, draft.added, draft.excluded],
  );

  /** Guests matched by the current audience definition, inside the category pool. */
  const matched: Guest[] = useMemo(() => {
    if (source === "individual") return pool;
    if (source === "new") return draftResolved.recipients.filter((g) => poolIds.has(g.id));
    if (!attachedAudience) return [];
    return resolveAudience(
      attachedAudience.rules,
      attachedAudience.added,
      attachedAudience.excluded,
    ).recipients.filter((g) => poolIds.has(g.id));
  }, [source, pool, poolIds, draftResolved, attachedAudience]);

  const recipients: Guest[] = useMemo(() => {
    if (source === "individual") return pool.filter((g) => picked.has(g.id));
    return matched.filter((g) => !removed.has(g.id));
  }, [source, pool, picked, matched, removed]);

  const matchedCount = source === "individual" ? pool.length : matched.length;
  const selectedCount = recipients.length;
  const selectedIds = useMemo(() => new Set(recipients.map((g) => g.id)), [recipients]);

  const audienceLabel =
    source === "individual"
      ? `${picked.size} hand-picked guest${picked.size === 1 ? "" : "s"}`
      : source === "new"
        ? draft.name.trim() || "New audience"
        : (attachedAudience?.name ?? "");
  const audienceRuleText =
    source === "individual"
      ? "Individually selected guests"
      : source === "new"
        ? "Unsaved audience"
        : attachedAudience
          ? audienceSummary(attachedAudience)
          : "";

  const hasAudience =
    source === "individual" ? picked.size > 0 : source === "new" ? false : !!attachedAudience;

  const messageOk = title.trim().length > 0 && body.trim().length > 0;

  const blocker = !messageOk
    ? "Add a title and message before scheduling this announcement."
    : source === "new"
      ? "Save the audience you are building, then schedule the announcement."
      : !hasAudience
        ? "Select an audience before scheduling this announcement."
        : selectedCount === 0
          ? "No guests match this audience. Adjust your audience before scheduling."
          : null;

  const insertToken = (token: string) => setBody((b) => (b ? `${b.trimEnd()} ${token}` : token));

  const toggleRecipient = (id: string) => {
    if (source === "individual") {
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllRecipients = () => {
    if (source === "individual") setPicked(new Set(pool.map((g) => g.id)));
    else setRemoved(new Set());
  };
  const clearAllRecipients = () => {
    if (source === "individual") setPicked(new Set());
    else setRemoved(new Set(matched.map((g) => g.id)));
  };

  const startNew = () => {
    setEditingId(null);
    setDraft(blankDraft());
    setSource("new");
  };
  const startEdit = (a: CustomAudience) => {
    setEditingId(a.id);
    setDraft({
      id: a.id,
      name: a.name,
      rules: a.rules,
      added: a.added,
      excluded: a.excluded,
    });
    setSource("new");
  };
  const cancelBuilder = () => {
    setEditingId(null);
    setSource("existing");
  };

  const canSaveDraft = draft.name.trim().length > 0 && draftResolved.recipients.length > 0;
  const saveDraft = () => {
    if (!canSaveDraft) return;
    const saved: CustomAudience = {
      id: editingId ?? `a${Date.now().toString(36)}`,
      name: draft.name.trim(),
      rules: draft.rules,
      added: draft.added,
      excluded: draft.excluded,
      updated: "Today",
    };
    onSaveAudience(saved);
    setEditingId(null);
    setSource("existing");
    setAttachedId(saved.id);
    setRemoved(new Set());
  };

  const duplicate = (a: CustomAudience) => {
    const copy: CustomAudience = {
      ...a,
      id: `a${Date.now().toString(36)}`,
      name: `${a.name} copy`,
      updated: "Today",
    };
    onSaveAudience(copy);
    setAttachedId(copy.id);
    setSource("existing");
  };

  const openScheduler = () => {
    setTried(true);
    if (blocker) return;
    setSchedulerOpen(true);
  };

  const finish = ({ sendNow, when }: { sendNow: boolean; when: string }) => {
    onScheduled({
      id: `n${Date.now().toString(36)}`,
      categoryId: categoryId ?? "in-house",
      audienceId: source === "individual" ? "custom" : (attachedId as string),
      audienceLabel,
      title: title.trim(),
      body: body.trim(),
      status: sendNow ? "Completed" : "Scheduled",
      when,
      recipients: selectedCount,
      createdBy: "Front desk",
      createdAt: "Today",
    });
    setSchedulerOpen(false);
  };

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title="Schedule announcement"
        subtitle={categoryId ? `Guest category · ${presetName(categoryId)}` : undefined}
        width="78rem"
        headerExtra={
          <nav className="-mb-px flex gap-6" aria-label="Scheduling sections">
            {(
              [
                ["announcement", "Announcement"],
                ["audience", "Audience"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id}
                className={`-mb-px border-b-2 px-0.5 py-2.5 text-[13px] font-medium transition-colors ${
                  tab === id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        }
        footer={
          <>
            {tried && blocker ? (
              <span className="mr-auto inline-flex items-center gap-1.5 text-[12.5px] text-destructive">
                <TriangleAlert size={14} />
                {blocker}
              </span>
            ) : hasAudience ? (
              <span className="mr-auto inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                <Users size={14} />
                <span className="font-semibold tabular-nums text-foreground">{selectedCount}</span>
                recipient{selectedCount === 1 ? "" : "s"}
              </span>
            ) : null}
            <button type="button" className={btnGhost} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={openScheduler}>
              <Check size={14} />
              Schedule announcement
            </button>
          </>
        }
      >
        {tab === "announcement" ? (
          <div className="space-y-6">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="ann-title" className="text-[12.5px] font-medium text-foreground">
                    Announcement title
                  </label>
                  <input
                    id="ann-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Pool maintenance notice"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ann-body" className="text-[12.5px] font-medium text-foreground">
                      Message
                    </label>
                    <div className="flex gap-1">
                      {TOKENS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => insertToken(t.value)}
                          className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:bg-accent"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="ann-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={7}
                    placeholder="Hi {{guest.first_name}}, ..."
                    className="w-full resize-none rounded-md border border-input bg-background px-2.5 py-2 text-[13px] leading-relaxed outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                  <p className="text-right text-[11.5px] tabular-nums text-muted-foreground">
                    {body.length} characters
                  </p>
                </div>
              </div>

              <div className="hidden lg:block">
                <SmsPreview
                  message={body || "Hi {{guest.first_name}}, ..."}
                  sender="Hellas Gadgets"
                  scale={0.6}
                />
              </div>
            </div>

            {/* ---- compact audience summary ---- */}
            <section className="rounded-md border border-border bg-muted/30 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Audience
              </p>
              {hasAudience ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">
                      {audienceLabel}
                      <span className="ml-2 text-[12.5px] font-normal tabular-nums text-muted-foreground">
                        {matchedCount === selectedCount
                          ? `${selectedCount} guest${selectedCount === 1 ? "" : "s"}`
                          : `${matchedCount} matched · ${selectedCount} selected`}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{audienceRuleText}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button type="button" className={btnGhost} onClick={() => setTab("audience")}>
                      Change audience
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setAttachedId(null);
                        setPicked(new Set());
                        setRemoved(new Set());
                        setSource("existing");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">
                      No audience selected
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      Add an audience to schedule this announcement.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${btnPrimary} ml-auto`}
                    onClick={() => setTab("audience")}
                  >
                    <Plus size={14} />
                    Add audience
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : source === "new" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                  {editingId ? `Edit “${draft.name || "audience"}”` : "Create new audience"}
                </h3>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Saved audiences can be reused across guest categories.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className={btnGhost} onClick={cancelBuilder}>
                  Back to audiences
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={!canSaveDraft}
                  onClick={saveDraft}
                >
                  {editingId ? "Save changes" : "Save & use"}
                </button>
              </div>
            </div>

            <AudienceEditor draft={draft} onChange={setDraft} />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                Select audience
              </h3>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                Start from a saved audience, create a new one, or hand-pick guests.
              </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              <div className="space-y-4">
                <SavedAudienceList
                  audiences={audiences}
                  announcements={announcements}
                  attachedId={source === "individual" ? null : attachedId}
                  onSelect={(id) => {
                    setSource("existing");
                    setAttachedId(id);
                    setRemoved(new Set());
                  }}
                  onCreate={startNew}
                  onEdit={startEdit}
                  onDuplicate={duplicate}
                  onDelete={setConfirmDelete}
                />

                <div className="rounded-md border border-border px-3.5 py-3">
                  <p className="text-[12.5px] font-medium text-foreground">Individual guests</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Skip saved audiences and hand-pick recipients from the roster.
                  </p>
                  <button
                    type="button"
                    className={`${btnGhost} mt-2.5`}
                    onClick={() => {
                      setSource("individual");
                      setAttachedId(null);
                    }}
                  >
                    Select individual guests
                  </button>
                </div>
                {source === "individual" && (
                  <p className="text-[12px] text-muted-foreground">
                    Hand-picking guests.{" "}
                    <button
                      type="button"
                      className="font-medium text-foreground hover:underline"
                      onClick={() => {
                        setSource("existing");
                        setPicked(new Set());
                      }}
                    >
                      Use a saved audience instead
                    </button>
                  </p>
                )}
              </div>

              {/* ---------- live recipients ---------- */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-[13px] font-semibold text-foreground">Recipients</h4>
                  <p className="text-[12.5px] tabular-nums text-muted-foreground">
                    {matchedCount === selectedCount ? (
                      <>
                        <span className="text-[15px] font-semibold text-foreground">
                          {selectedCount}
                        </span>{" "}
                        guest{selectedCount === 1 ? "" : "s"} selected
                      </>
                    ) : (
                      <>
                        {matchedCount} matched ·{" "}
                        <span className="text-[15px] font-semibold text-foreground">
                          {selectedCount}
                        </span>{" "}
                        selected
                      </>
                    )}
                  </p>
                </div>
                {source === "existing" && !attachedAudience ? (
                  <div className="rounded-md border border-dashed border-border px-4 py-12 text-center">
                    <p className="text-[13px] font-medium text-foreground">No audience selected</p>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      Pick a saved audience, create a new one, or hand-pick guests to preview
                      recipients here.
                    </p>
                  </div>
                ) : (
                  <>
                    <GuestTable
                      guests={source === "individual" ? pool : matched}
                      selected={selectedIds}
                      onToggle={toggleRecipient}
                      onSelectAll={selectAllRecipients}
                      onClearAll={clearAllRecipients}
                      showStatus={source === "individual"}
                    />
                    <p className="text-[11.5px] text-muted-foreground">
                      Guest count may change as reservations change.
                    </p>
                  </>
                )}
              </div>
            </div>

            {confirmDelete && (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-3.5 py-3">
                <TriangleAlert size={15} className="shrink-0 text-destructive" />
                <p className="text-[12.5px] text-foreground">
                  Delete the saved audience “{confirmDelete.name}”? This removes it from the
                  reusable audience library.
                </p>
                <div className="ml-auto flex gap-2">
                  <button type="button" className={btnGhost} onClick={() => setConfirmDelete(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => {
                      onDeleteAudience(confirmDelete);
                      if (attachedId === confirmDelete.id) setAttachedId(null);
                      setConfirmDelete(null);
                    }}
                  >
                    Delete audience
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {schedulerOpen && (
        <SchedulerOverlay
          audienceLabel={audienceLabel}
          recipients={selectedCount}
          onClose={() => setSchedulerOpen(false)}
          onConfirm={finish}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function SavedAudienceList({
  audiences,
  announcements,
  attachedId,
  onSelect,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  audiences: CustomAudience[];
  announcements: Announcement[];
  attachedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (a: CustomAudience) => void;
  onDuplicate: (a: CustomAudience) => void;
  onDelete: (a: CustomAudience) => void;
}) {
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const term = q.trim().toLowerCase();

  const rows = audiences
    .map((a) => ({
      audience: a,
      count: audienceCount(a),
      summary: audienceSummary(a),
      used: announcements.filter((n) => n.audienceId === a.id).length,
    }))
    .filter(
      ({ audience, summary }) =>
        !term ||
        audience.name.toLowerCase().includes(term) ||
        summary.toLowerCase().includes(term),
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search saved audiences…"
            aria-label="Search audiences"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <button type="button" className={btnGhost} onClick={onCreate}>
          <Plus size={14} />
          Create
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <p className="border-b border-border bg-muted/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Saved audiences
        </p>
        <ul className="divide-y divide-border">
          {rows.map(({ audience, count, summary, used }) => (
            <li key={audience.id} className="relative">
              <div
                className={`flex items-start gap-2 px-3 py-2.5 ${
                  attachedId === audience.id ? "bg-accent/50" : "hover:bg-muted/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(audience.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                    {attachedId === audience.id && <Check size={13} className="text-primary" />}
                    {audience.name}
                  </span>
                  <span className="mt-0.5 block text-[12px] tabular-nums text-muted-foreground">
                    {count} guest{count === 1 ? "" : "s"} currently match ·{" "}
                    {used === 0 ? "unused" : `${used} announcement${used === 1 ? "" : "s"}`}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                    {summary}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`More actions for ${audience.name}`}
                  onClick={() => setMenu((m) => (m === audience.id ? null : audience.id))}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
              {menu === audience.id && (
                <div className="absolute right-2 top-9 z-20 w-44 rounded-md border border-border bg-popover p-1 shadow-lg">
                  {(
                    [
                      ["Edit", Pencil, () => onEdit(audience)],
                      ["Duplicate", Copy, () => onDuplicate(audience)],
                      ["Use for this send", BarChart3, () => onSelect(audience.id)],
                      ["Delete audience", Trash2, () => onDelete(audience)],
                    ] as const
                  ).map(([label, Icon, act]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setMenu(null);
                        act();
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] hover:bg-accent ${
                        label === "Delete audience" ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-3 py-4 text-[12.5px] text-muted-foreground">
              No saved audiences match.
            </li>
          )}
        </ul>
        <p className="border-y border-border bg-muted/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Guest categories
        </p>
        <ul className="divide-y divide-border">
          {PRESETS.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-muted-foreground"
            >
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <span className="shrink-0 tabular-nums">{guestsForPreset(p.id).length}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
