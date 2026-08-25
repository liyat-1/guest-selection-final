import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Megaphone,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Announcement, CustomAudience } from "@/lib/announcements";
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIENCES,
  PRESETS,
  audienceCount,
  emptyRules,
  guestsForPreset,
  presetName,
} from "@/lib/announcements";
import { AudienceEditor, type AudienceDraft } from "@/components/announcements/AudienceEditor";
import { AudienceWorkspace } from "@/components/announcements/AudienceWorkspace";
import { UsagePanel } from "@/components/announcements/UsagePanel";
import { DeleteAudienceDialog } from "@/components/announcements/DeleteAudienceDialog";
import { ScheduleFlow } from "@/components/announcements/ScheduleFlow";
import { SidePanel, StatusPill, btnGhost, btnPrimary } from "@/components/announcements/ui";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Guest announcements — Directful Studio" },
      {
        name: "description",
        content:
          "Target in-house, arriving and departing guests with reusable audiences, then schedule announcements per guest category.",
      },
      { property: "og:title", content: "Guest announcements — Directful Studio" },
      {
        property: "og:description",
        content:
          "Manage guest categories and reusable audiences, then schedule property announcements with a live phone preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnnouncementsPage,
});

type Tab = "categories" | "audiences";

const blankDraft = (): AudienceDraft => ({
  id: null,
  name: "",
  rules: { ...emptyRules },
  added: [],
  excluded: [],
});

function AnnouncementsPage() {
  const [audiences, setAudiences] = useState<CustomAudience[]>(INITIAL_AUDIENCES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);

  const [tab, setTab] = useState<Tab>("categories");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [editor, setEditor] = useState<{ open: boolean; draft: AudienceDraft }>({
    open: false,
    draft: blankDraft(),
  });
  const [usageFor, setUsageFor] = useState<CustomAudience | null>(null);
  const [deleteFor, setDeleteFor] = useState<CustomAudience | null>(null);
  const [schedule, setSchedule] = useState<{
    open: boolean;
    categoryId: string | null;
    audienceId: string | null;
  }>({ open: false, categoryId: null, audienceId: null });

  const usageById = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of announcements) map.set(a.audienceId, (map.get(a.audienceId) ?? 0) + 1);
    return map;
  }, [announcements]);

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of announcements) map.set(a.categoryId, (map.get(a.categoryId) ?? 0) + 1);
    return map;
  }, [announcements]);

  const saveAudience = (a: CustomAudience) => {
    const exists = audiences.some((x) => x.id === a.id);
    setAudiences((prev) => (exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a]));
    toast.success(exists ? "Audience updated" : "Audience created", {
      description: `“${a.name}” now matches ${audienceCount(a)} guests.`,
    });
  };

  const deleteAudience = (target: CustomAudience) => {
    setAudiences((prev) => prev.filter((x) => x.id !== target.id));
    // Scheduled announcements targeting the deleted audience fall back to draft.
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.audienceId === target.id && a.status === "Scheduled"
          ? { ...a, status: "Draft" as const, when: "Draft" }
          : a,
      ),
    );
    setUsageFor(null);
    toast.success("Audience deleted", {
      description: `“${target.name}” was removed. Scheduled sends using it moved to draft.`,
    });
  };

  const duplicateAudience = (a: CustomAudience) => {
    saveAudience({
      ...a,
      id: `a${Date.now().toString(36)}`,
      name: `${a.name} copy`,
      updated: "Today",
    });
  };

  const onScheduled = (a: Announcement) => {
    setAnnouncements((prev) => [a, ...prev]);
    setSchedule({ open: false, categoryId: null, audienceId: null });
    toast.success(a.status === "Scheduled" ? "Announcement scheduled" : "Announcement sent", {
      description: `${a.title} → ${a.audienceLabel} · ${a.when}`,
    });
  };

  const saveFromEditor = () => {
    const d = editor.draft;
    if (!d.name.trim()) return;
    saveAudience({
      id: d.id ?? `a${Date.now().toString(36)}`,
      name: d.name.trim(),
      rules: d.rules,
      added: d.added,
      excluded: d.excluded,
      updated: "Today",
    });
    setEditor({ open: false, draft: blankDraft() });
  };

  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-6 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft size={14} />
            Studio
          </Link>
          <span className="text-border">/</span>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
            <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
              <Megaphone size={13} />
            </span>
            Announcements
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={() => setEditor({ open: true, draft: blankDraft() })}
            >
              <Plus size={14} />
              New audience
            </button>
            <button
              type="button"
              className={btnPrimary}
              onClick={() =>
                setSchedule({
                  open: true,
                  categoryId: categoryId ?? PRESETS[0].id,
                  audienceId: null,
                })
              }
            >
              <CalendarPlus size={14} />
              Schedule announcement
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Guest messaging
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              Guest announcements
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              Pick the guest category you want to reach, then target it with a reusable audience —
              rooms, room types, rate codes or hand-picked guests.
            </p>
          </div>
        </div>

        <dl className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Guest categories", PRESETS.length, Users],
              [
                "Reachable guests",
                PRESETS.reduce((n, p) => n + guestsForPreset(p.id).length, 0),
                Users,
              ],
              ["Saved audiences", audiences.length, Users],
              [
                "Scheduled",
                announcements.filter((a) => a.status === "Scheduled").length,
                CalendarPlus,
              ],
            ] as const
          ).map(([label, value, Icon]) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 shadow-xs"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <dt className="truncate text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-[19px] font-semibold leading-tight tabular-nums tracking-tight text-foreground">
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <nav
          className="mb-6 inline-flex gap-1 rounded-xl border border-border bg-background p-1 shadow-xs"
          aria-label="Announcement workspace sections"
        >
          {(
            [
              ["categories", "Guest Categories"],
              ["audiences", "Audiences"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                if (id === "audiences") setCategoryId(null);
              }}
              aria-current={tab === id}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                tab === id
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>


        {tab === "categories" ? (
          categoryId ? (
            <CategoryDetail
              categoryId={categoryId}
              announcements={announcements.filter((a) => a.categoryId === categoryId)}
              onBack={() => setCategoryId(null)}
              onSchedule={() => setSchedule({ open: true, categoryId, audienceId: null })}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PRESETS.map((p) => {
                const eligible = guestsForPreset(p.id).length;
                const sends = countByCategory.get(p.id) ?? 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setCategoryId(p.id)}
                      className="group flex h-full w-full flex-col rounded-xl border border-border bg-background p-5 text-left shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Users size={16} />
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                          {eligible} guests
                        </span>
                      </span>
                      <span className="mt-3.5 text-[15px] font-semibold tracking-tight text-foreground">
                        {p.name}
                      </span>
                      <span className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                        {p.desc}
                      </span>
                      <span className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3.5 text-[12px] font-medium text-muted-foreground">
                        <span>
                          {sends === 0
                            ? "No announcements yet"
                            : `${sends} announcement${sends === 1 ? "" : "s"}`}
                        </span>
                        <ArrowRight
                          size={14}
                          className="transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )

        ) : (
          <AudienceWorkspace
            audiences={audiences}
            usageById={usageById}
            onCreate={() => setEditor({ open: true, draft: blankDraft() })}
            onEdit={(a) =>
              setEditor({
                open: true,
                draft: {
                  id: a.id,
                  name: a.name,
                  rules: a.rules,
                  added: a.added,
                  excluded: a.excluded,
                },
              })
            }
            onDuplicate={duplicateAudience}
            onUsage={setUsageFor}
            onDelete={setDeleteFor}
            onUseIn={(a, cat) => setSchedule({ open: true, categoryId: cat, audienceId: a.id })}
          />
        )}
      </div>

      <SidePanel
        open={editor.open}
        onClose={() => setEditor({ open: false, draft: blankDraft() })}
        title={editor.draft.id ? `Edit “${editor.draft.name}”` : "Create audience"}
        subtitle="Rooms, room types and rate codes combine with hand-picked guests."
        width="64rem"
        footer={
          <>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setEditor({ open: false, draft: blankDraft() })}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={!editor.draft.name.trim()}
              onClick={saveFromEditor}
            >
              {editor.draft.id ? "Save changes" : "Create audience"}
            </button>
          </>
        }
      >
        <AudienceEditor
          draft={editor.draft}
          onChange={(draft) => setEditor((e) => ({ ...e, draft }))}
        />
      </SidePanel>

      <UsagePanel
        open={!!usageFor}
        audience={usageFor}
        announcements={announcements}
        onClose={() => setUsageFor(null)}
        onEdit={() => {
          if (usageFor)
            setEditor({
              open: true,
              draft: {
                id: usageFor.id,
                name: usageFor.name,
                rules: usageFor.rules,
                added: usageFor.added,
                excluded: usageFor.excluded,
              },
            });
          setUsageFor(null);
        }}
        onDelete={() => setDeleteFor(usageFor)}
      />
      <DeleteAudienceDialog
        open={!!deleteFor}
        audience={deleteFor}
        announcements={announcements}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => {
          if (deleteFor) deleteAudience(deleteFor);
          setDeleteFor(null);
        }}
      />
      <ScheduleFlow
        open={schedule.open}
        categoryId={schedule.categoryId}
        audiences={audiences}
        announcements={announcements}
        initialAudienceId={schedule.audienceId}
        onClose={() => setSchedule({ open: false, categoryId: null, audienceId: null })}
        onScheduled={onScheduled}
        onSaveAudience={saveAudience}
        onDeleteAudience={deleteAudience}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CategoryDetail({
  categoryId,
  announcements,
  onBack,
  onSchedule,
}: {
  categoryId: string;
  announcements: Announcement[];
  onBack: () => void;
  onSchedule: () => void;
}) {
  const eligible = guestsForPreset(categoryId).length;
  const preset = PRESETS.find((p) => p.id === categoryId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="-ml-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft size={13} />
            All guest categories
          </button>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.015em]">
            {presetName(categoryId)}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {preset?.desc} ·{" "}
            <span className="font-medium tabular-nums text-foreground">
              {eligible} eligible guest{eligible === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <button type="button" className={btnPrimary} onClick={onSchedule}>
          <CalendarPlus size={14} />
          Schedule announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border bg-background px-6 py-16 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <Megaphone size={18} />
          </span>
          <p className="mt-1 text-[13.5px] font-semibold text-foreground">No announcements yet</p>
          <p className="max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
            Nothing has been sent to this guest category. Schedule one to reach these guests.
          </p>
          <button type="button" className={`${btnPrimary} mt-2`} onClick={onSchedule}>
            <CalendarPlus size={14} />
            Schedule announcement
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id}>
              <article className="rounded-xl border border-border bg-background p-5 shadow-xs transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={a.status} />
                  <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {a.when}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Users size={11} />
                    {a.audienceLabel} · {a.recipients}
                  </span>
                </div>
                <h3 className="mt-2.5 text-[15px] font-semibold tracking-tight text-foreground">
                  {a.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{a.body}</p>
                <p className="mt-3 border-t border-border pt-2.5 text-[11.5px] text-muted-foreground">
                  Created by {a.createdBy} · {a.createdAt}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

