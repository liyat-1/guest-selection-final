import { useState } from "react";
import {
  Check,
  GitBranch,
  Mail,
  MessageSquare,
  Pencil,
  Repeat,
  Rocket,
  Save,
  X,
} from "lucide-react";
import {
  PanelTabs,
  StageMessageEditor,
  StageScreens,
  panelsFor,
  type Panel,
} from "@/components/ota/StageMessageEditor";
import { JourneyCanvas } from "@/components/ota/JourneyCanvas";
import { AddRuleDialog } from "@/components/ota/AddRuleDialog";
import {
  ROOT,
  addToContainer,
  buildJourney,
  containerBranch,
  getContainer,
  makeRule,
  msgNode,
  newFollowUp,
  patchNode,
  removeNode,
  type JourneyNode,
  type RuleSource,
  type Wait,
} from "@/lib/otaBranching";
import type { Channel, SequenceMessage, Stage } from "@/lib/otaJourney";

type StrategyId = "email" | "text" | "both" | "fallback";

const STRATEGIES: {
  id: StrategyId;
  label: string;
  icon: typeof Mail;
  copy: string;
  channel: Channel;
}[] = [
  {
    id: "email",
    label: "Email Only",
    icon: Mail,
    channel: "email",
    copy: "Sends messages only by email to guests with a valid email address when a compliant customer–hotel relationship allows email communication.",
  },
  {
    id: "text",
    label: "Text Only",
    icon: MessageSquare,
    channel: "text",
    copy: "Sends messages only by text (SMS) to guests with a valid mobile number when a compliant customer–hotel relationship allows text communication.",
  },
  {
    id: "both",
    label: "Text + Email Together",
    icon: Repeat,
    channel: "both",
    copy: "Sends the same message by both text (SMS) and email when a compliant customer–hotel relationship allows communication through both channels.",
  },
  {
    id: "fallback",
    label: "Text with email Fallback",
    icon: GitBranch,
    channel: "both",
    copy: "Sends a text (SMS) first to guests with a valid mobile number. If the text can't be sent, a separate email version is sent when a compliant customer–hotel relationship allows email communication.",
  },
];

const TEMPLATES = [
  {
    id: "default",
    name: "Default",
    copy: "Clean and modern layout with a focused call to action.",
  },
  {
    id: "feature",
    name: "Feature",
    copy: "Hero image on top, ideal for showing the room or the offer.",
  },
  { id: "minimal", name: "Minimal", copy: "Text-first layout that reads like a personal note." },
];

const STEPS = ["Channel Strategy", "Sequence", "Promote & Launch"] as const;

/**
 * The stage campaign editor, as a layered overlay: a three-step wizard, with
 * template selection and the message editor stacked on top of it.
 */
export function StageCampaignOverlay({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [strategy, setStrategy] = useState<StrategyId>(
    stage.channel === "text" ? "text" : stage.channel === "both" ? "both" : "email",
  );
  const [messages, setMessages] = useState<SequenceMessage[]>(() =>
    stage.sequence.map((m) => ({ ...m })),
  );
  const [nodes, setNodes] = useState<JourneyNode[]>(() => buildJourney(stage, stage.sequence));
  const [ruleFor, setRuleFor] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, string | null>>({});
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewPanel, setPreviewPanel] = useState<Panel>("email");
  const [saved, setSaved] = useState(false);

  const channel = STRATEGIES.find((s) => s.id === strategy)!.channel;
  const textOnly = channel === "text";
  const editing = messages.find((m) => m.id === editId) ?? null;
  const previewing = messages.find((m) => m.id === previewId) ?? null;
  const defaultWait: Wait = stage.condition?.wait ?? { value: 2, unit: "days" };

  /** Picking a strategy rewrites every message channel, so editors follow suit. */
  const pickStrategy = (id: StrategyId) => {
    setStrategy(id);
    const next = STRATEGIES.find((s) => s.id === id)!.channel;
    setMessages((list) => list.map((m) => ({ ...m, channel: next })));
  };

  const patchMsg = (id: string, p: Partial<SequenceMessage>) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...p } : m)));

  /** Adds another message to the path the marketer clicked in. */
  const addFollowUp = (container: string) => {
    const list = getContainer(nodes, container);
    const meta = containerBranch(container);
    const branch = meta
      ? {
          key: meta.key,
          label: meta.label,
          range: meta.range,
          note: meta.note,
          tone: meta.tone,
          follow: meta.follow,
        }
      : undefined;
    const firstId = list.find((n) => n.kind === "message") as { msgId: string } | undefined;
    const base =
      messages.find((m) => m.id === firstId?.msgId) ??
      messages.find((m) => m.branch?.key === meta?.key) ??
      messages[0]!;
    const count = list.filter((n) => n.kind === "message").length;
    const msg = newFollowUp(base, `Follow-up ${count}`, branch);
    setMessages((all) => [...all, msg]);
    setNodes((n) => addToContainer(n, container, msgNode(msg.id, { value: 2, unit: "days" })));
  };

  /** "Add rule" — creates the visual branch structure in one step. */
  const createRule = (source: RuleSource, wait: Wait) => {
    const container = ruleFor ?? ROOT;
    const created: SequenceMessage[] = [];
    const rule = makeRule(source, wait, (meta) => {
      const base =
        messages.find((m) => m.branch?.key === meta.key) ?? messages[messages.length - 1]!;
      const msg = newFollowUp(base, base.branch ? base.name : `Follow-up — ${meta.follow}`, {
        key: meta.key,
        label: meta.label,
        range: meta.range,
        note: meta.note,
        tone: meta.tone,
        follow: meta.follow,
      });
      created.push(msg);
      return msg.id;
    });
    setMessages((all) => [...all, ...created]);
    setNodes((n) => addToContainer(n, container, rule));
    setRuleFor(null);
  };

  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-label={`${stage.name} campaign`}
        className="flex h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop duration-150 animate-in fade-in zoom-in-95"
      >
        {/* Chrome */}
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[18px] font-semibold tracking-tight text-slate-900">
              {stage.name} campaign
            </h2>
            <Pencil size={14} className="shrink-0 text-slate-400" />
          </div>
          {step > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-medium text-slate-700">
              {channel === "text" ? <MessageSquare size={13} /> : <Mail size={13} />}
              {STRATEGIES.find((s) => s.id === strategy)!.label}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close campaign editor"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </header>

        {/* Steps */}
        <nav className="grid shrink-0 grid-cols-3 gap-4 border-b border-slate-200 px-5">
          {STEPS.map((label, i) => (
            <button key={label} type="button" onClick={() => setStep(i)} className="pb-0 text-left">
              <span className="flex items-center gap-2 pb-3">
                <span
                  className={`grid size-6 place-items-center rounded-lg text-[11px] font-bold ${
                    i < step
                      ? "text-blue-600"
                      : i === step
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i < step ? <Check size={13} /> : i + 1}
                </span>
                <span
                  className={`text-[13.5px] ${
                    i === step ? "font-semibold text-slate-900" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </span>
              <span
                className={`block h-[3px] rounded-full ${
                  i === step ? "bg-blue-600" : i < step ? "bg-blue-200" : "bg-slate-200"
                }`}
              />
            </button>
          ))}
        </nav>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-hidden bg-slate-50">
          {step === 0 ? (
            <div className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-[31rem_minmax(0,1fr)]">
              <div className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-5">
                <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
                  Select channel strategy
                </h3>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Choose how this campaign will be delivered and preview each experience.
                </p>
                <div className="mt-4 space-y-3">
                  {STRATEGIES.map((s) => {
                    const active = s.id === strategy;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => pickStrategy(s.id)}
                        aria-pressed={active}
                        className={`w-full rounded-xl border p-4 text-left transition-colors ${
                          active
                            ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex items-center gap-2.5">
                            <span
                              className={`grid size-8 place-items-center rounded-lg ${
                                active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <s.icon size={15} />
                            </span>
                            <span className="text-[14px] font-semibold text-slate-900">
                              {s.label}
                            </span>
                          </span>
                          <span
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
                              active
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {active ? <Check size={12} /> : null}
                          </span>
                        </div>
                        <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-500">
                          {s.copy}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid min-h-0 place-items-center overflow-y-auto p-6">
                <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-10 text-center">
                  <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg bg-slate-50 text-slate-400">
                    {channel === "text" ? <MessageSquare size={13} /> : <Mail size={13} />}
                  </span>
                  <span className="mx-auto grid size-11 place-items-center rounded-lg bg-linear-to-br from-emerald-400 to-teal-500 text-white">
                    {channel === "text" ? <MessageSquare size={19} /> : <Mail size={19} />}
                  </span>
                  <p className="mt-4 text-[15px] font-semibold tracking-tight text-slate-900">
                    {messages[0]!.name}
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-slate-500">
                    The first message sent when your campaign begins.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="h-full overflow-y-auto px-5 py-7">
              <div className="mx-auto w-full max-w-5xl">
                <JourneyCanvas
                  stage={stage}
                  nodes={nodes}
                  messages={messages}
                  channel={channel}
                  templateName={(id) => TEMPLATES.find((t) => t.id === templates[id])?.name}
                  handlers={{
                    onEdit: setEditId,
                    onPreview: (id) => {
                      setPreviewPanel(textOnly ? "text" : "email");
                      setPreviewId(id);
                    },
                    onTemplate: textOnly ? undefined : setPickFor,

                    onDeleteNode: (nodeId) => setNodes((n) => removeNode(n, nodeId)),
                    onWait: (nodeId, w) => setNodes((n) => patchNode(n, nodeId, { wait: w })),
                    onRuleWait: (ruleId, w) => setNodes((n) => patchNode(n, ruleId, { wait: w })),
                    onAddFollowUp: addFollowUp,
                    onAddRule: setRuleFor,
                  }}
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="h-full overflow-y-auto px-5 py-7">
              <div className="mx-auto w-full max-w-2xl space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
                    Ready to launch
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                    {stage.purpose}
                  </p>
                  <dl className="mt-4 grid gap-px overflow-hidden rounded-lg bg-slate-200 sm:grid-cols-3">
                    <div className="bg-white p-3.5">
                      <dt className="text-[11px] text-slate-500">Strategy</dt>
                      <dd className="mt-1 text-[13px] font-semibold text-slate-900">
                        {STRATEGIES.find((s) => s.id === strategy)!.label}
                      </dd>
                    </div>
                    <div className="bg-white p-3.5">
                      <dt className="text-[11px] text-slate-500">Messages</dt>
                      <dd className="mt-1 text-[13px] font-semibold text-slate-900">
                        {messages.length}
                      </dd>
                    </div>
                    <div className="bg-white p-3.5">
                      <dt className="text-[11px] text-slate-500">Offers attached</dt>
                      <dd className="mt-1 text-[13px] font-semibold text-slate-900">
                        {messages.filter((m) => m.offer.enabled).length}
                      </dd>
                    </div>
                  </dl>
                </div>
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <Rocket size={14} /> Launch campaign
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-200 bg-white px-5 py-3.5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="mr-auto rounded-lg px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? "Saved" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => (step < 2 ? setStep((s) => s + 1) : onClose())}
            className="rounded-lg bg-blue-600 px-5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {step < 2 ? "Next" : "Done"}
          </button>
        </footer>
      </div>

      {/* Rule setup — stacked on top */}
      {ruleFor ? (
        <AddRuleDialog
          defaultWait={defaultWait}
          onCancel={() => setRuleFor(null)}
          onCreate={createRule}
        />
      ) : null}

      {/* Template picker — stacked on top */}

      {pickFor ? (
        <div className="fixed inset-0 z-[85] grid place-items-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-label="Select template"
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-pop"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
                  Select a template
                </h3>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Pick a starting layout — you can refine the content afterwards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickFor(null)}
                aria-label="Close template picker"
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>
            <ul className="mt-4 space-y-2.5">
              {TEMPLATES.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplates((m) => ({ ...m, [pickFor]: t.id }));
                      setPickFor(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-blue-600 hover:bg-blue-50/50"
                  >
                    <p className="text-[13.5px] font-semibold text-slate-900">{t.name}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{t.copy}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Guest-eye preview — stacked on top */}
      {previewing ? (
        <div className="fixed inset-0 z-[86] grid place-items-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-5">
          <div
            role="dialog"
            aria-label={`Preview ${previewing.name}`}
            className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop duration-150 animate-in fade-in zoom-in-95"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Preview
                </p>
                <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                  {previewing.name}
                </p>
                {previewing.branch ? (
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {previewing.branch.label} · {previewing.branch.range}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <PanelTabs
                  panel={previewPanel}
                  onChange={setPreviewPanel}
                  panels={panelsFor(previewing)}
                />
                <button
                  type="button"
                  onClick={() => setPreviewId(null)}
                  aria-label="Close preview"
                  className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={17} />
                </button>
              </div>
            </header>
            <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto bg-slate-50 p-5">
              <StageScreens stage={stage} msg={previewing} panel={previewPanel} device="mobile" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Message editor — stacked on top */}
      {editing ? (
        <div className="fixed inset-0 z-[88] grid place-items-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-5">
          <div
            role="dialog"
            aria-label={`Edit ${editing.name}`}
            className="flex h-[92vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop duration-150 animate-in fade-in zoom-in-95"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Editing
                </p>
                <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                  {stage.name}
                  {editing.branch ? ` · ${editing.branch.label} feedback` : ""} · {editing.name}
                </p>
                {editing.branch ? (
                  <p className="mt-0.5 text-[12px] text-slate-500">{editing.branch.note}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setEditId(null)}
                aria-label="Close message editor"
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={17} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
              <StageMessageEditor
                stage={stage}
                msg={editing}
                patch={(p) => patchMsg(editing.id, p)}
              />
            </div>
            <footer className="flex shrink-0 justify-end gap-2.5 border-t border-slate-200 bg-white px-5 py-3.5">
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-[12.5px] font-semibold text-white hover:bg-blue-700"
              >
                Save message
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
