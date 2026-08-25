import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart3,
  LayoutTemplate,
  MousePointerSquareDashed,
  Route as RouteIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { ComponentType } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Directful Studio — Guest campaign workspace" },
      {
        name: "description",
        content:
          "Compose, orchestrate and measure guest email and SMS campaigns from one workspace built for hospitality teams.",
      },
      { property: "og:title", content: "Directful Studio — Guest campaign workspace" },
      {
        property: "og:description",
        content:
          "Authoring surfaces, journey orchestration and revenue analytics in a single hospitality campaign workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Destination = {
  to: string;
  title: string;
  body: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  meta: string;
  tag?: string;
};

const AUTHORING: Destination[] = [
  {
    to: "/canvas",
    title: "Live canvas",
    body: "Direct-manipulation editor with floating toolbars, inline typography and a contextual inspector.",
    icon: MousePointerSquareDashed,
    meta: "Best for one-off, design-led sends",
    tag: "Recommended",
  },
  {
    to: "/structured",
    title: "Structured builder",
    body: "Property-first editing with a read-only preview and grouped form controls. Predictable at scale.",
    icon: LayoutTemplate,
    meta: "Best for templated, multi-brand sends",
  },
];

const OPERATIONS: Destination[] = [
  {
    to: "/ota",
    title: "OTA Buster journey",
    body: "Five lifecycle stages from booking to return stay, with the timing rules that move each guest forward.",
    icon: RouteIcon,
    meta: "Orchestration",
  },
  {
    to: "/campaign",
    title: "Campaign wizard",
    body: "Guided setup for audience, sequence and delivery — the fastest path from brief to scheduled send.",
    icon: Sparkles,
    meta: "Setup",
  },
  {
    to: "/analytics",
    title: "Performance",
    body: "Opens, clicks and conversion by stage, with period comparison and per-message breakdowns.",
    icon: BarChart3,
    meta: "Reporting",
  },
  {
    to: "/roi",
    title: "Revenue impact",
    body: "Direct-booking value recovered from OTA channels, attributed back to the sequences that earned it.",
    icon: TrendingUp,
    meta: "Reporting",
  },
];

const STATS = [
  { label: "Direct bookings recovered", value: "1,284", note: "Last 30 days" },
  { label: "Attributed revenue", value: "$412K", note: "Net of OTA commission" },
  { label: "Median open rate", value: "62.4%", note: "Across active stages" },
  { label: "Active sequences", value: "18", note: "4 paused" },
];

function Index() {
  return (
    <div className="min-h-dvh bg-surface-muted text-slate-900">
      <SiteHeader />

      <main>
        <section className="border-b border-surface-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:py-20">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Directful Studio
              </p>
              <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-[3.25rem]">
                Every guest message, one workspace.
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-slate-600">
                Author in the surface that fits how you think, orchestrate the journey stage by
                stage, and measure the direct revenue it returns — all on one versioning,
                personalization and delivery pipeline.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/campaign"
                  className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Start a campaign
                </Link>
                <Link
                  to="/ota"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  View guest journey
                  <ArrowUpRight size={15} className="text-slate-400" />
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-surface-border bg-surface-border lg:w-[380px]">
              {STATS.map((s) => (
                <div key={s.label} className="bg-surface p-4">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {s.label}
                  </dt>
                  <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                    {s.value}
                  </dd>
                  <p className="mt-1 text-[11.5px] text-slate-400">{s.note}</p>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-14 px-6 py-14">
          <Section
            eyebrow="Authoring"
            title="Choose a composing surface"
            description="Both editors share the same templates, tokens and approval flow — switch at any time without losing work."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {AUTHORING.map((d) => (
                <DestinationCard key={d.to} {...d} size="lg" />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Operate"
            title="Run and measure the journey"
            description="Orchestration and reporting for sequences already in market."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {OPERATIONS.map((d) => (
                <DestinationCard key={d.to} {...d} />
              ))}
            </div>
          </Section>
        </div>
      </main>

      <footer className="border-t border-surface-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-[12.5px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Directful. Guest messaging for hospitality teams.</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
            Studio build 2.4
          </p>
        </div>
      </footer>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-border bg-surface/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3.5 md:grid-cols-[auto_1fr_auto]">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-900">
            <span className="size-2.5 rotate-45 bg-white" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">Directful</span>
          <span className="hidden rounded border border-surface-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 sm:inline">
            Studio
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-1 md:flex">
          {[
            { to: "/campaign", label: "Campaigns" },
            { to: "/announcements", label: "Announcements" },
            { to: "/ota", label: "Journey" },
            { to: "/analytics", label: "Analytics" },
            { to: "/roi", label: "Revenue" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              activeProps={{ className: "bg-slate-100 text-slate-900" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            to="/canvas"
            className="hidden h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-[13px] font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 sm:inline-flex"
          >
            Open editor
          </Link>
          <Link
            to="/campaign"
            className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
          >
            New campaign
          </Link>
        </div>
      </div>
    </header>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function DestinationCard({
  to,
  title,
  body,
  icon: Icon,
  meta,
  tag,
  size = "md",
}: Destination & { size?: "md" | "lg" }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-surface-border bg-surface p-5 shadow-card transition-colors hover:border-slate-300 hover:bg-slate-50/60 focus-visible:border-slate-400"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-surface-border bg-surface-muted text-slate-700">
          <Icon size={16} />
        </span>
        {tag ? (
          <span className="rounded border border-surface-border bg-surface-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {tag}
          </span>
        ) : null}
      </div>

      <h3
        className={`mt-4 font-semibold tracking-tight ${size === "lg" ? "text-[17px]" : "text-[15px]"}`}
      >
        {title}
      </h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{body}</p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-surface-border pt-3.5">
        <span className="truncate text-[11.5px] text-slate-400">{meta}</span>
        <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-900">
          Open
          <ArrowUpRight
            size={14}
            className="text-slate-400 transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
          />
        </span>
      </div>
    </Link>
  );
}
