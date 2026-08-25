/**
 * Stage-specific guest landing pages.
 *
 * Just Booked keeps the original confirmation landing (see GuestScreens).
 * Every other stage gets its own reason to interact — arrival time, in-stay
 * help, feedback, or a return offer — with the contact details as a calm
 * secondary step. Success screens reflect what the guest actually submitted.
 */

import { useState } from "react";
import {
  ArrowRight,
  BedDouble,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { ARRIVAL_TIMES, GUEST, useStageDraft, type StageDraft } from "@/lib/guestSession";
import { HOTEL } from "@/lib/offers";
import type { SequenceMessage, Stage, StageId } from "@/lib/otaJourney";

/** Stages that have a bespoke landing design. */
export const CUSTOM_LANDING: StageId[] = ["pre_checkin", "during_stay", "post_checkout", "retain"];

export const hasCustomLanding = (id: StageId) => CUSTOM_LANDING.includes(id);

/* ------------------------------ primitives ----------------------------- */

function Hero({
  eyebrow,
  headline,
  sub,
  tall = false,
}: {
  eyebrow: string;
  headline: string;
  sub: string;
  tall?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${tall ? "h-[17.5rem]" : "h-64"}`}>
      <img src={HOTEL.hero} alt="" className="size-full object-cover" width={1024} height={768} />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/45 to-slate-950/25" />
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-5 pt-4">
        <span className="size-1.5 rounded-full bg-amber-300/90" />
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-white/85">
          {HOTEL.name}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-7">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-amber-200 backdrop-blur-md">
          {eyebrow}
        </span>
        <h4 className="mt-3 font-serif text-[27px] leading-[1.12] tracking-tight text-white">
          {headline}
        </h4>
        <p className="mt-2 max-w-[92%] text-[12.5px] leading-relaxed text-white/75">{sub}</p>
      </div>
    </div>
  );
}

const CARD_BASE =
  "rounded-[18px] border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const CTA_BASE =
  "group flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-[14px] bg-linear-to-r from-blue-700 via-blue-600 to-blue-500 text-[13.5px] font-semibold tracking-[-0.01em] text-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_-4px_rgba(37,99,235,0.35)] transition-all hover:from-blue-600 hover:via-blue-500 hover:to-blue-400 hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_16px_-4px_rgba(37,99,235,0.42)] active:scale-[0.98]";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`${CARD_BASE} p-4 ${className}`}>{children}</div>;
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 ${className}`}>
      {children}
    </p>
  );
}

/** Consistent card heading: eyebrow label, title, optional hint. */
function CardHead({ label, title, hint }: { label: string; title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <p className="mt-2 text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-slate-900">
        {title}
      </p>
      {hint ? <p className="mt-1.5 text-[12px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

const FIELD_BASE =
  "w-full rounded-[12px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

function Field({
  label,
  value,
  onChange,
  placeholder,
  known,
  area = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  known?: boolean;
  area?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </span>
        {known ? (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
            <Check size={10} strokeWidth={3} /> Saved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span className="size-1.5 rounded-full bg-amber-400" /> Needed
          </span>
        )}
      </span>
      {area ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${FIELD_BASE} resize-none px-3.5 py-3`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${FIELD_BASE} h-11 px-3.5`}
        />
      )}
    </label>
  );
}

function Cta({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={CTA_BASE}>
      {children}
      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function ContactBlock({
  title,
  hint,
  draft,
  patch,
  withAddress,
}: {
  title: string;
  hint: string;
  draft: StageDraft;
  patch: (n: Partial<StageDraft>) => void;
  withAddress?: boolean;
}) {
  return (
    <Card>
      <CardHead label={title} title="Where can we reach you?" hint={hint} />
      <div className="space-y-3.5">
        <Field
          label="Email"
          value={draft.email}
          known={!!draft.email}
          onChange={(email) => patch({ email })}
          placeholder="you@example.com"
        />
        <Field
          label="Phone"
          value={draft.phone}
          known={!!draft.phone}
          onChange={(phone) => patch({ phone })}
          placeholder="+1 …"
        />
        {withAddress ? (
          <Field
            label="Address"
            value={draft.address}
            known={!!draft.address}
            onChange={(address) => patch({ address })}
            placeholder="Street, city, postal code"
          />
        ) : null}
      </div>
    </Card>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="bg-white pb-10">{children}</div>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <div className="relative z-10 -mt-5 space-y-3.5 px-4 pb-1">{children}</div>;
}

/* ---------------------------- pre-check-in ----------------------------- */

function PreCheckInLanding({ msg }: { msg: SequenceMessage }) {
  const [draft, patch] = useStageDraft("pre_checkin");
  const [open, setOpen] = useState(false);

  return (
    <Page>
      <Hero
        eyebrow={`Welcome back, ${GUEST.firstName}`}
        headline="Let's get your arrival ready."
        sub="A few details before you arrive will help us prepare for your stay."
      />
      <Body>
        <Card className="flex items-center justify-between gap-3">
          <span>
            <Label>Your stay</Label>
            <p className="mt-1 text-[14px] font-semibold text-slate-900">June 24 — June 27</p>
            <p className="mt-0.5 text-[11.5px] text-slate-500">2 Guests · Room 1208</p>
          </span>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <BedDouble size={17} />
          </span>
        </Card>

        <Card>
          <CardHead label="When will you arrive?" title="What's your expected arrival time?" />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 text-[14px] font-semibold text-slate-900 transition-colors hover:border-slate-300"
          >
            <span className="flex items-center gap-2">
              <Clock size={15} className="text-blue-700" /> {draft.arrival}
            </span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {open ? (
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
              {ARRIVAL_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    patch({ arrival: t });
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12.5px] ${
                    t === draft.arrival
                      ? "bg-blue-50 font-semibold text-blue-800"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t}
                  {t === draft.arrival ? <Check size={13} /> : null}
                </button>
              ))}
            </div>
          ) : null}

          <p className="mt-2.5 text-[11.5px] text-slate-400">
            This helps us prepare for your arrival.
          </p>
        </Card>

        <ContactBlock
          title="One last detail"
          hint="Where can we reach you about your stay?"
          draft={draft}
          patch={patch}
        />

        <Cta onClick={() => patch({ submitted: true })}>
          {msg.landing.submitLabel || "Complete pre-check-in"}
        </Cta>
      </Body>
    </Page>
  );
}

function PreCheckInSuccess() {
  const [draft] = useStageDraft("pre_checkin");
  return (
    <SuccessFrame
      headline={`You're all set, ${GUEST.firstName}.`}
      message={`We've got your arrival details and look forward to welcoming you on June 24.`}
      rows={[
        { label: "Expected arrival", value: draft.arrival },
        { label: "Email", value: draft.email || "—" },
        { label: "Phone", value: draft.phone || "—" },
      ]}
      footnote="Your room will be ready ahead of the time you gave us."
      cta="View my reservation"
    />
  );
}

/* ----------------------------- during stay ----------------------------- */

const STAY_ACTIONS = [
  {
    id: "assist",
    label: "Request assistance",
    hint: "Housekeeping, amenities, anything",
    icon: BellRing,
  },
  {
    id: "amenities",
    label: "Explore hotel amenities",
    hint: "Pool, spa, fitness, rooftop",
    icon: Compass,
  },
  {
    id: "dining",
    label: "Dining & experiences",
    hint: "Reserve a table or a tasting",
    icon: UtensilsCrossed,
  },
  {
    id: "special",
    label: "Special requests",
    hint: "Occasions, preferences, extras",
    icon: Sparkles,
  },
];

function DuringStayLanding() {
  const [draft, patch] = useStageDraft("during_stay");
  const chosen = STAY_ACTIONS.find((a) => a.id === draft.action);

  return (
    <Page>
      <Hero
        eyebrow="While you're with us"
        headline={`Enjoy your stay, ${GUEST.firstName}.`}
        sub="Need anything during your stay? We're here to help."
      />
      <Body>
        <Card>
          <CardHead
            label="During your stay"
            title="How can we make your stay better?"
            hint="Pick what you need and we'll take it from there."
          />
          <div className="space-y-2.5">
            {STAY_ACTIONS.map((a) => {
              const active = a.id === draft.action;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => patch({ action: active ? null : a.id })}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left transition-all ${
                    active
                      ? "border border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/15 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                      : "border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-[0_4px_10px_-4px_rgba(15,23,42,0.08)] active:translate-y-0 active:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-[10px] transition-colors ${
                      active
                        ? "bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-[0_2px_6px_-2px_rgba(37,99,235,0.35)]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <a.icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-slate-900">
                      {a.label}
                    </span>
                    <span className="block truncate text-[11.5px] text-slate-500">{a.hint}</span>
                  </span>
                  {active ? <Check size={15} className="shrink-0 text-blue-700" /> : null}
                </button>
              );
            })}
          </div>

          {chosen ? (
            <div className="mt-3">
              <Field
                label={`Anything we should know about your ${chosen.label.toLowerCase()}?`}
                value={draft.request}
                known
                area
                onChange={(request) => patch({ request })}
                placeholder="Tell us what you need…"
              />
            </div>
          ) : null}
        </Card>

        <ContactBlock
          title="Stay connected"
          hint="Complete your details so we can keep your stay updates and requests connected."
          draft={draft}
          patch={patch}
          withAddress
        />

        <Cta onClick={() => patch({ submitted: true })}>
          {chosen ? "Submit request" : "Continue"}
        </Cta>
      </Body>
    </Page>
  );
}

function DuringStaySuccess() {
  const [draft] = useStageDraft("during_stay");
  const chosen = STAY_ACTIONS.find((a) => a.id === draft.action);
  return (
    <SuccessFrame
      headline={chosen ? "We're on it." : `Thanks, ${GUEST.firstName}.`}
      message={
        chosen
          ? `Our team has your ${chosen.label.toLowerCase()} and will follow up in your room shortly.`
          : "Your details are up to date — reach us any time during your stay."
      }
      rows={[
        ...(chosen ? [{ label: "Request", value: chosen.label }] : []),
        ...(draft.request ? [{ label: "Note", value: draft.request }] : []),
        { label: "Email", value: draft.email || "—" },
        { label: "Phone", value: draft.phone || "—" },
        { label: "Address", value: draft.address || "Not provided" },
      ]}
      footnote="Reception can be reached from your room at any time."
      cta="Back to my stay"
    />
  );
}

/* ---------------------------- post-checkout ---------------------------- */

function PostCheckoutLanding() {
  const [draft, patch] = useStageDraft("post_checkout");
  const positive = draft.rating >= 4;
  const negative = draft.rating > 0 && draft.rating <= 3;

  return (
    <Page>
      <Hero
        eyebrow="Before you go"
        headline={`How was your stay, ${GUEST.firstName}?`}
        sub="Your feedback helps us create better experiences for every guest."
      />
      <Body>
        <Card>
          <CardHead
            label="Your rating"
            title="How would you rate your stay?"
            hint="Tap a star — it only takes a second."
          />
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => patch({ rating: n })}
                className="rounded-lg p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={30}
                  strokeWidth={1.6}
                  className={n <= draft.rating ? "text-amber-500" : "text-slate-300"}
                  fill={n <= draft.rating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>

          {draft.rating ? (
            <p
              className={`mt-3.5 rounded-xl px-3.5 py-2.5 text-[12.5px] leading-snug ${
                positive ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {positive
                ? "We're glad you enjoyed your stay."
                : "We're sorry we didn't meet your expectations."}
            </p>
          ) : null}
        </Card>

        <Card>
          <CardHead
            label="Tell us about your experience"
            title={
              negative ? "What could we have done better?" : "What did you enjoy about your stay?"
            }
            hint="Your answer only goes to the hotel."
          />
          <textarea
            value={draft.review}
            onChange={(e) => patch({ review: e.target.value })}
            rows={4}
            placeholder="Share your experience with us..."
            className={`${FIELD_BASE} resize-none px-3.5 py-3`}
          />
          {positive ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
              <span className="text-[12.5px] font-medium text-slate-700">
                Would you like to share your experience?
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-blue-700">
                Leave a review <ArrowRight size={13} />
              </span>
            </div>
          ) : null}
        </Card>

        <ContactBlock
          title="Stay connected"
          hint="Where can we reach you?"
          draft={draft}
          patch={patch}
          withAddress
        />

        <Cta onClick={() => patch({ submitted: true })}>Submit feedback</Cta>
      </Body>
    </Page>
  );
}

function PostCheckoutSuccess() {
  const [draft] = useStageDraft("post_checkout");
  const positive = draft.rating >= 4;
  return (
    <SuccessFrame
      headline={`Thank you, ${GUEST.firstName}.`}
      message="We appreciate you taking the time to share your experience."
      stars={draft.rating || undefined}
      rows={[
        ...(draft.review ? [{ label: "Your feedback", value: draft.review }] : []),
        { label: "Email", value: draft.email || "—" },
        { label: "Address", value: draft.address || "Not provided" },
      ]}
      footnote={
        positive
          ? "Thank you for the kind words — we've shared them with the team."
          : draft.rating
            ? "A guest relations manager will read your note personally."
            : "We'd still love to hear how your stay went."
      }
      cta="Book direct next time"
    />
  );
}

/* ------------------------------- retain -------------------------------- */

function RetainLanding({ msg }: { msg: SequenceMessage }) {
  const [, patch] = useStageDraft("retain");
  const offer = msg.offer.enabled ? msg.offer : null;

  return (
    <Page>
      <Hero
        tall
        eyebrow="We'd love to welcome you back"
        headline={`Ready for your next stay, ${GUEST.firstName}?`}
        sub="We'd love to welcome you back. Book directly with us for your next visit."
      />
      <Body>
        <Card className="overflow-hidden p-0 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden border-b border-blue-100 bg-linear-to-br from-blue-600 to-blue-700 px-4 pb-5 pt-5 text-center">
            <span className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10 blur-2xl" />
            <span className="absolute -left-4 -bottom-4 size-20 rounded-full bg-blue-400/20 blur-2xl" />
            <Label className="relative text-blue-100/90">Your return offer</Label>
            <p className="relative mt-2 font-serif text-[38px] leading-none text-white">
              {offer?.kind === "percent" ? `${offer.value}% OFF` : offer ? offer.value : "10% OFF"}
            </p>
            <p className="relative mt-1.5 text-[13px] text-blue-100/90">your next direct stay</p>
            <p className="relative mx-auto mt-2.5 max-w-[16rem] text-[11.5px] leading-snug text-blue-100/70">
              {offer?.description ?? "Enjoy a special rate when you book directly with the hotel."}
            </p>
          </div>
          <div className="space-y-2.5 px-4 py-4">
            <Label>Book direct and enjoy</Label>
            {["Direct hotel benefits", "Personalized service", "A simpler booking experience"].map(
              (b) => (
                <p key={b} className="flex items-center gap-2.5 text-[12.5px] text-slate-700">
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {b}
                </p>
              ),
            )}
          </div>
        </Card>

        <div className="flex items-center gap-2.5 rounded-[18px] border border-slate-200/70 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
            MW
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-slate-900">
              Booking as {GUEST.firstName} {GUEST.lastName}
            </span>
            <span className="block truncate text-[11px] text-slate-500">
              We&rsquo;ll use your saved guest details when you book.
            </span>
          </span>
        </div>

        <div className="space-y-2.5">
          <Cta onClick={() => patch({ submitted: true })}>Book Direct</Cta>
          <button
            type="button"
            onClick={() => patch({ submitted: true })}
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white text-[13px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            View my offer
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <p className="px-2 text-center text-[11px] leading-snug text-slate-400">
          <MapPin size={11} className="mr-1 inline-block align-[-1px]" />
          {HOTEL.name} · {HOTEL.place}
        </p>
      </Body>
    </Page>
  );
}

function RetainSuccess({ msg }: { msg: SequenceMessage }) {
  const offer = msg.offer.enabled ? msg.offer : null;
  return (
    <SuccessFrame
      headline={`Your offer is saved, ${GUEST.firstName}.`}
      message="Continue to booking and your rate is applied automatically — no code needed."
      rows={[
        {
          label: "Offer",
          value: offer?.kind === "percent" ? `${offer.value}% off direct` : "10% off direct",
        },
        { label: "Guest", value: `${GUEST.firstName} ${GUEST.lastName}` },
        { label: "Valid until", value: offer?.validity ?? "Your next stay" },
      ]}
      footnote="Booking direct keeps your preferences and history with the hotel."
      cta="Continue to booking"
    />
  );
}

/* ---------------------------- success frame ---------------------------- */

function SuccessFrame({
  headline,
  message,
  rows,
  footnote,
  cta,
  stars,
}: {
  headline: string;
  message: string;
  rows: { label: string; value: string }[];
  footnote: string;
  cta: string;
  stars?: number;
}) {
  return (
    <div className="flex min-h-full flex-col justify-center bg-white px-5 py-10">
      <span className="relative mx-auto grid size-20 place-items-center">
        <span className="absolute inset-0 rounded-full bg-emerald-100/60" />
        <span className="absolute inset-2 rounded-full bg-emerald-200/50" />
        <span className="absolute inset-4 grid place-items-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.45)]">
          <Check size={26} strokeWidth={3} />
        </span>
      </span>
      <h4 className="mt-6 text-center font-serif text-[24px] leading-tight text-slate-900">
        {headline}
      </h4>
      <p className="mt-2.5 text-center text-[13.5px] leading-relaxed text-slate-500">{message}</p>

      {stars ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={19}
              strokeWidth={1.6}
              className={n <= stars ? "text-amber-500" : "text-slate-300"}
              fill={n <= stars ? "currentColor" : "none"}
            />
          ))}
        </div>
      ) : null}

      <div className={`mt-6 divide-y divide-slate-100 overflow-hidden ${CARD_BASE}`}>
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
            <span className="shrink-0 text-[11.5px] font-medium text-slate-500">{r.label}</span>
            <span className="text-right text-[12.5px] font-semibold text-slate-900">{r.value}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-start gap-2 text-center text-[12px] leading-snug text-slate-500">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
        <span className="text-left">{footnote}</span>
      </p>

      <div className={`${CTA_BASE} mt-5`}>
        {cta}
        <ArrowRight size={15} />
      </div>
    </div>
  );
}

/* ------------------------------ dispatchers ---------------------------- */

export function StageLanding({ stage, msg }: { stage: Stage; msg: SequenceMessage }) {
  if (stage.id === "pre_checkin") return <PreCheckInLanding msg={msg} />;
  if (stage.id === "during_stay") return <DuringStayLanding />;
  if (stage.id === "post_checkout") return <PostCheckoutLanding />;
  return <RetainLanding msg={msg} />;
}

export function StageSuccess({ stage, msg }: { stage: Stage; msg: SequenceMessage }) {
  if (stage.id === "pre_checkin") return <PreCheckInSuccess />;
  if (stage.id === "during_stay") return <DuringStaySuccess />;
  if (stage.id === "post_checkout") return <PostCheckoutSuccess />;
  return <RetainSuccess msg={msg} />;
}
