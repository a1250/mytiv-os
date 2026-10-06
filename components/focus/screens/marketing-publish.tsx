"use client";

import Link from "@/components/focus/ui/link";
import { useReducer, useRef, useState, type ReactNode } from "react";
import { PUBLISH_SUSHI } from "@/lib/focus/fixtures/marketing";
import { personName } from "@/lib/focus/fixtures/people";
import { designById } from "@/lib/focus/fixtures/studio";
import { daysBetween, fmtDate, fmtDayMonth, fmtTime, fmtWeekday } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { canExecute, execReducer, initialExec, type ExecState } from "@/lib/focus/state/execution";
import { externalGate, type Job, jobStatus, metaTarget, TARGET_CHECK } from "@/lib/focus/state/jobs";
import { DesignThumb, PlannedAction, useCopy } from "@/components/focus/patterns/marketing/marketing-parts";
import { ContentTimeline, MetaPublishConfirm, type TimelineStep } from "@/components/focus/patterns/marketing/publish";
import { useDemo } from "@/components/focus/shell/demo-store";
import { FocusBar } from "@/components/focus/shell/focus-bar";
import { Button } from "@/components/focus/ui/button";
import { Banner } from "@/components/focus/ui/feedback";
import { Dialog } from "@/components/focus/ui/dialog";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { Bdi } from "@/components/focus/ui/misc";
import { APPROVAL, ApprovalPill, OriginTag } from "@/components/focus/ui/status";
import { useNavGuard } from "@/components/focus/shell/nav-guard";

/**
 * Export & publish after approval (handoff E7). Downloads are planned (never a fake file). Scheduling is an external
 * action at Meta: the form is validated, blocked while the content is unapproved or still has a placeholder photo, and
 * goes through the pre-execution summary. "תוזמן" appears only after the simulated Meta confirmed (a job in the demo
 * store, so it survives navigation); a failure keeps the content as a draft. The timeline reads the same real state.
 */
const plan = PUBLISH_SUSHI;
const JOB_ID = `publish-${plan.designId}`;
/** quick-approve in "היום שלי" schedules the same content through Meta (shell/use-queue) — both count */
const QUEUE_JOB_ID = `schedule-${plan.approvalId}`;

const isoDate = (iso: string) => iso.slice(0, 10);
const isoTime = (iso: string) => iso.slice(11, 16);
const whenText = (iso: string) => `${fmtWeekday(iso)} ${fmtDayMonth(iso)}, ${fmtTime(iso)}`;

/** 24h time slots every 15 minutes (the native time input follows the browser's 12h/24h locale) */
const TIME_SLOTS = [{ value: "", label: "בחרו שעה" }, ...Array.from({ length: 96 }, (_, i) => {
  const v = `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`;
  return { value: v, label: v };
})];

type Form = { channel: string; date: string; time: string };
type Errors = Partial<Record<keyof Form, string>>;

export default function MarketingPublishScreen() {
  const demo = useDemo();
  const { state, now } = demo;
  const copy = useCopy();
  const design = designById(plan.designId)!;
  const approval = demo.approval(plan.approvalId)!;
  const decision = state.decisions[plan.approvalId];
  const approved = approval.status === "approved";
  const photoTask = plan.placeholder ? state.tasks.find((t) => t.id === plan.placeholder!.taskId) : undefined;

  const job: Job | undefined = state.jobs
    .filter((j) => (j.id === JOB_ID || j.id === QUEUE_JOB_ID) && !j.cancelledAt)
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  const js = job ? jobStatus(job, state.clock) : null;
  const scheduledText = job?.detail || (approval.content ? `${whenText(approval.content.scheduledAt)} · ${approval.content.channel}` : "");

  const initial: Form = { channel: plan.channels[0].value, date: isoDate(plan.defaultAt), time: isoTime(plan.defaultAt) };
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [photoMarked, setPhotoMarked] = useState(false); // demo control: "the real photo was added"
  // the same rule as quick approve: ready once the photo task is done (or marked in the demo)
  const photoReady = photoMarked || photoTask?.status === "done";
  const [open, setOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const dirty = form.channel !== initial.channel || form.date !== initial.date || form.time !== initial.time;

  // unsaved schedule edits: every way out asks first (links, search, Back, closing the tab) — see NavGuardProvider
  useNavGuard({ dirty: dirty && !js, what: "השינויים בתזמון לא יישמרו." });

  const channelLabel = plan.channels.find((c) => c.value === form.channel)?.label ?? "";
  const at = `${form.date}T${form.time}:00+03:00`;
  const atValid = /^\d{4}-\d{2}-\d{2}$/.test(form.date) && /^\d{2}:\d{2}$/.test(form.time) && !Number.isNaN(new Date(at).getTime());
  const blocker = !approved
    ? approval.status === "changes_requested" ? "התוכן נשלח לתיקון. אפשר לתזמן רק גרסה שאושרה." : "התוכן עדיין לא אושר. אפשר לתזמן רק אחרי אישור."
    : plan.placeholder && !photoReady ? `${plan.placeholder.title}. ${plan.placeholder.detail}` : null;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.date) e.date = "יש לבחור תאריך.";
    if (!form.time) e.time = "יש לבחור שעה.";
    if (form.date && !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) e.date = "התאריך לא תקין.";
    else if (atValid && new Date(at).getTime() <= new Date(now).getTime()) e.time = "המועד כבר עבר. בחרו מועד עתידי.";
    if (!form.channel) e.channel = "יש לבחור ערוץ.";
    return e;
  };

  const proceed = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { dateRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(); return; }
    setOpen(true);
  };

  // the store's gate for this post at Meta (shared with quick approve on Today): an UNKNOWN outcome asks for the check
  const metaGate = externalGate(state.jobs, metaTarget(plan.approvalId), state.clock);
  const needsTargetCheck = metaGate.ok === false && metaGate.reason === "needs_target_check";

  /** `targetChecked`: the user stated the earlier (unknown) schedule does not exist at Meta — required by the store then */
  const startPublish = (targetChecked: boolean): boolean => {
    const fail = demo.getLatest().failNext;
    const g = externalGate(demo.getLatest().jobs, metaTarget(plan.approvalId), Date.now());
    const attested = targetChecked && g.ok === false && g.reason === "needs_target_check" ? g.unknownJobId : undefined;
    const r = demo.startExternal({
      id: JOB_ID, kind: "schedule_meta", target: metaTarget(plan.approvalId), label: "מבקש תזמון מ־Meta", detail: `${whenText(at)} · ${channelLabel}`,
      durationMs: plan.meta.latencyMs, outcome: fail ? "failure" : "success", href: R.designPublish(plan.designId),
    }, attested);
    if (!r.ok) return false;
    if (fail) demo.setFailNext(false);
    return true;
  };

  const formatsLabel = plan.formats.map((f) => plan.downloads.find((d) => d.format === f)?.label ?? f).join(" ו");
  const caption = approval.content ? `${approval.content.caption.before}${approval.content.caption.flagged}${approval.content.caption.after}` : "";

  const scheduleState: TimelineStep["state"] = !js ? "todo" : js.state === "running" ? "current" : js.state === "done" ? "done" : "failed";
  const confirmedAt = js?.state === "done" ? fmtTime(new Date(js.at).toISOString()) : "";
  const steps: TimelineStep[] = [
    { key: "saved", label: "נשמר", detail: `גרסה ${design.version} · ${fmtTime(design.savedAt)}`, state: "done" },
    {
      key: "approved", label: "אושר",
      state: approved ? "done" : approval.status === "rejected" ? "failed" : "current",
      detail: approved ? `${decision ? `${personName(decision.decidedBy)} · ${fmtTime(decision.decidedAt)}` : "אושר"}`
        : <>{APPROVAL[approval.status].word} · <Link href={R.approval(plan.approvalId)} className="f-link">לאישור</Link></>,
    },
    { key: "exported", label: "יוצא", detail: "עדיין לא הורד · הורדה מתוכננת", state: "todo" },
    {
      key: "scheduled", label: "תוזמן", state: scheduleState,
      detail: scheduleState === "done" ? `Meta אישרה ב־${confirmedAt} · ${scheduledText}`
        : scheduleState === "current" ? "ממתין לאישור Meta…" : scheduleState === "failed" ? "Meta לא אישרה · נשמר כטיוטה" : "רק אחרי ש־Meta מאשרת",
    },
    { key: "published", label: "פורסם", detail: scheduleState === "done" ? `יסומן רק כשהפוסט עלה בפועל · ${scheduledText.split(" · ")[0]}` : "רק כשהפוסט עלה בפועל", state: "todo" },
  ];

  return (
    <div className="f-focusmode f-mk-pub">
      <FocusBar
        exitHref={R.campaign(plan.campaignId)}
        exitLabel="לקמפיין"
        exitGlyph="→"
        center={<>
          <h1 className="f-mk-pub__title">{design.title} · {formatsLabel}</h1>
          {approved
            ? <ApprovalPill status="approved" size="sm" label={`אושר${decision ? ` ע״י ${personName(decision.decidedBy)}` : ""} · גרסה ${design.version}${decision ? ` · ${fmtTime(decision.decidedAt)}` : ""}`} />
            : <ApprovalPill status={approval.status} size="sm" label={`${APPROVAL[approval.status].word} · גרסה ${design.version}`} />}
        </>}
      />
      <div className="f-mk-pub__grid">
        <div className="f-mk-pub__main">
          <section className="f-panel f-mk-pub__card" aria-labelledby="dl-h">
            <h2 id="dl-h" className="f-mk-pub__h">הורדה</h2>
            <ul className="f-mk-pub__dls">
              {plan.downloads.map((d) => (
                <li key={d.format} className="f-mk-pub__dl">
                  <span className="f-mk-pub__dlthumb"><DesignThumb designId={plan.designId} format={d.format} fitHeight={42} label={`${d.label} · ${design.title}`} /></span>
                  <span className="f-mk-pub__dltext"><b>{d.label}</b><span className="f-meta">{d.files}</span></span>
                  <PlannedAction className="f-mk-pub__dlbtn">הורד</PlannedAction>
                </li>
              ))}
            </ul>
            <div className="f-mk-pub__row">
              <PlannedAction className="f-mk-planned--pill">הורד את כל הגדלים · ZIP</PlannedAction>
              {caption && <Button variant="neutral" onClick={() => copy(caption, "הטקסט הנלווה")}>העתק טקסט נלווה</Button>}
              <PlannedAction className="f-mk-planned--pill">PDF לקרוסלה</PlannedAction>
            </div>
            <p className="f-meta">הורדה מסמנת את התוכן &quot;יוצא&quot;, לא &quot;פורסם&quot;. ההורדה עצמה עדיין לא מחוברת, ולכן התוכן לא מסומן כיוצא.</p>
          </section>

          <section className="f-panel f-mk-pub__card" aria-labelledby="sch-h">
            <div className="f-mk-pub__headrow">
              <h2 id="sch-h" className="f-mk-pub__h">תזמון ופרסום</h2>
              <span className="f-meta">דרך {plan.account}</span>
            </div>
            {js?.state === "done" ? (
              <Banner kind="done" title={`תוזמן · ${scheduledText}`} detail={plan.meta.successDetail} />
            ) : js?.state === "running" ? (
              <Banner kind="processing" title={plan.meta.pendingLabel} detail={plan.meta.pendingNote} />
            ) : (
              <>
                {js?.state === "failed" && (js.unknown
                  ? <Banner kind="warning" title="לא ידוע אם התזמון נקלט ב־Meta" detail="הבקשה נקטעה לפני ש־Meta ענתה. בדקו ב־Meta Business Suite לפני תזמון חוזר, כדי לא לפרסם פעמיים." />
                  : <Banner kind="error" title={plan.meta.failureTitle} detail={plan.meta.failureDetail} />)}
                <div className="f-mk-pub__form" ref={dateRef}>
                  <SelectField label="ערוצים" value={form.channel} error={errors.channel} options={plan.channels}
                    onChange={(e) => { setForm({ ...form, channel: e.target.value }); setErrors({ ...errors, channel: undefined }); }} />
                  <TextField label="תאריך" type="date" required value={form.date} error={errors.date} min={isoDate(now)} help={/^\d{4}-\d{2}-\d{2}$/.test(form.date) ? `${fmtWeekday(form.date)} ${fmtDate(form.date)}` : "יום הפרסום"}
                    onChange={(e) => { setForm({ ...form, date: e.target.value }); setErrors({ ...errors, date: undefined, time: undefined }); }} />
                  <SelectField label="שעה" required value={form.time} error={errors.time} help="שעון ישראל · 24 שעות" options={TIME_SLOTS}
                    onChange={(e) => { setForm({ ...form, time: e.target.value }); setErrors({ ...errors, time: undefined }); }} />
                </div>
                {/* the reason the button is off is said once, here; the button points at it */}
                <div id="mk-blocker">
                {!approved && (
                  <Banner kind="warning" title="התוכן עדיין לא אושר" detail={<>אפשר לתזמן רק גרסה שאושרה. <Link href={R.approval(plan.approvalId)} className="f-link">פתח את האישור</Link></>} />
                )}
                {plan.placeholder && !photoReady && (
                  <div className="f-mk-pub__warn" role="note">
                    <b><span aria-hidden>◆</span> {plan.placeholder.title}</b>
                    <span>{plan.placeholder.detail}{photoTask?.dueDate ? <> הצילום מתוכנן ל־{fmtDayMonth(photoTask.dueDate)}. <Link href={R.task(photoTask.id)} className="f-link">למשימת הצילום</Link></> : null}</span>
                  </div>
                )}
                </div>
                <div className="f-mk-pub__actions">
                  <Button variant="primary" size="lg" id="mk-schedule" disabled={!!blocker} aria-describedby={blocker ? "mk-blocker" : undefined} onClick={proceed}>
                    {js?.state === "failed" ? (js.unknown ? "בדיקה ב־Meta ותזמון מחדש…" : "נסה שוב לתזמן") : "המשך לתזמון"}
                  </Button>
                  <span className="f-meta">התזמון יעבור דרך מסך סיכום לפני ביצוע</span>
                </div>
                <div className="f-mk-pub__demo">
                  {plan.placeholder && (
                    <label className="f-demo-toggle">
                      <input type="checkbox" checked={photoReady} disabled={photoTask?.status === "done"} onChange={(e) => setPhotoMarked(e.target.checked)} />
                      <span>דמו: הצילום האמיתי התקבל והוחלף במקום השמור</span>
                    </label>
                  )}
                  <label className="f-demo-toggle">
                    <input type="checkbox" checked={state.failNext} onChange={(e) => demo.setFailNext(e.target.checked)} />
                    <span>דמו: הדמה כשל של Meta בתזמון הבא</span>
                  </label>
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="f-mk-pub__aside" aria-label="מצב ומקור">
          <section className="f-panel f-mk-pub__card f-mk-pub__card--side" aria-labelledby="st-h">
            <h2 id="st-h" className="f-mk-pub__h f-mk-pub__h--sm">המצב של התוכן</h2>
            <ContentTimeline steps={steps} label="שלבי התוכן" />
          </section>
          <section className="f-panel f-mk-pub__card f-mk-pub__card--side" aria-labelledby="src-h">
            <h2 id="src-h" className="f-mk-pub__h f-mk-pub__h--xs">מקור התוכן</h2>
            <OriginTag origin={design.origin} label={design.originLabel} size="sm" />
            <p className="f-mk-pub__src">{plan.originNote}</p>
            <details className="f-mk-pub__versions">
              <summary>היסטוריית גרסאות</summary>
              <ol>{design.versions.map((v) => <li key={v.n}><b>גרסה {v.n}</b> · {v.note}</li>)}</ol>
            </details>
          </section>
        </aside>
      </div>

      <Dialog open={open && atValid} onClose={() => setOpen(false)} label="סיכום לפני תזמון ב־Meta" className="f-mk-dialog f-mk-pre-dialog">
        {atValid && <PublishConfirmBody
          job={job?.id === JOB_ID ? job : undefined}
          clock={state.clock}
          title={`תזמון ${formatsLabel} "${design.title}"`}
          context={`${design.client} · ${design.campaign} · ${channelLabel}`}
          rows={[
            { label: "ערוץ", value: channelLabel },
            { label: "חשבון", value: <Bdi>{plan.account}</Bdi> },
            { label: "מה יתפרסם", value: `${formatsLabel} · גרסה ${design.version}` },
            { label: "מתי", value: `${whenText(at)}${daysBetween(now, at) === 1 ? " (מחר)" : ""}` },
          ]}
          confirmText={`אני מאשר לתזמן את ה${formatsLabel} ב־${channelLabel} ל־${whenText(at)}, וידוע לי שאחרי שהפוסט עולה אי אפשר לבטל אותו מכאן.`}
          onStart={startPublish}
          targetCheck={needsTargetCheck ? TARGET_CHECK.meta : undefined}
          onClose={() => setOpen(false)}
        />}
      </Dialog>
    </div>
  );
}

/** Mounted only while the dialog is open, so every opening starts from a fresh, unconfirmed summary. */
function PublishConfirmBody({ job, clock, title, context, rows, confirmText, onStart, onClose, targetCheck }: {
  job: Job | undefined; clock: number; title: string; context: string; rows: { label: string; value: ReactNode }[];
  confirmText: string; onStart: (targetChecked: boolean) => boolean; onClose: () => void; targetCheck?: string;
}) {
  const [checkedTarget, setCheckedTarget] = useState(false);
  const [refused, setRefused] = useState(false);
  const [local, dispatch] = useReducer(execReducer, initialExec);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const mine = job && startedAt != null && job.startedAt >= startedAt ? jobStatus(job, clock) : null;
  const view: ExecState = !mine ? local
    : mine.state === "running" ? { step: "sending", startedAt: job!.startedAt }
    : mine.state === "done" ? { step: "sent", at: mine.at }
    : { step: "failed", at: mine.state === "failed" ? mine.at : 0, message: mine.state === "failed" && mine.unknown ? "הבקשה נקטעה לפני ש־Meta ענתה — לא ידוע אם תוזמן. בדקו ב־Meta לפני ניסיון נוסף." : plan.meta.failureDetail };
  const unknownNow = mine?.state === "failed" && !!mine.unknown;
  const submit = (now: number) => {
    // the target check is part of the confirmation while the earlier outcome is unknown
    if (!canExecute(local) || (targetCheck && !checkedTarget)) { setRefused(!!targetCheck && !checkedTarget); if (!canExecute(local)) dispatch({ type: "submit", now }); return; }
    if (!onStart(!!targetCheck && checkedTarget)) { setRefused(true); return; }
    dispatch({ type: "submit", now });
    setStartedAt(now);
  };
  return (
    <MetaPublishConfirm
      meta={plan.meta} title={title} context={context} rows={rows} confirmText={confirmText} state={view}
      onToggle={() => dispatch({ type: "toggleConfirm" })}
      onSubmit={() => submit(Date.now())}
      // a confirmed failure retries as usual; an UNKNOWN outcome has no retry here (close, check at Meta, start over)
      onRetry={unknownNow ? undefined : () => { if (onStart(false)) setStartedAt(Date.now()); else setRefused(true); }}
      targetCheck={targetCheck && local.step === "summary" ? { text: targetCheck, checked: checkedTarget, onToggle: (v) => { setCheckedTarget(v); setRefused(false); }, error: refused } : undefined}
      onClose={onClose}
    />
  );
}
