"use client";

import Link from "@/components/focus/ui/link";
import { useState, type FormEvent } from "react";
import type { ContactSuggestion, LeadStage, TimelineEvent } from "@/lib/focus/contracts/sales";
import { ready } from "@/lib/focus/contracts/loadable";
import { personName } from "@/lib/focus/fixtures/people";
import { LEAD_NOA, LEADS, PROPOSALS } from "@/lib/focus/fixtures/sales";
import { fmtDayMonth, fmtMoney, fmtRelativeDay, fmtTime, fmtWeekday } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { NextActionHero } from "@/components/focus/patterns/project/project-parts";
import { ContactCard, ExtraContactsCard, LeadHeader, LeadPhoneActions, LeadTimeline, NeedCard, StagePicker, WorkCard } from "@/components/focus/patterns/sales/lead-page";
import { liveProposal } from "@/components/focus/patterns/sales/proposal-list";
import { PlannedDialog, ProposalStatusPill, SalesDialog, STAGE } from "@/components/focus/patterns/sales/sales-parts";
import { addEvent, patchLead, removeEvent, restoreLead, setContacts, useSales } from "@/components/focus/patterns/sales/sales-store";
import { useDemo, useTicker } from "@/components/focus/shell/demo-store";
import { useCreateUndo } from "@/components/focus/shell/task-actions";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { TextField } from "@/components/focus/ui/field";
import { Bdi } from "@/components/focus/ui/misc";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Lead page — נועה כהן (handoff F2, mobile M7 phone 2). The next action leads to the proposal editor; the timeline
 * takes notes; contacting her (mail, meeting) is external and still planned, so those open what will happen and a real
 * alternative instead of pretending to send. The contact search is a background job; nothing is added without approval.
 */
type Open = null | "stage" | "outreach" | "meeting" | "call" | "task";

export default function SalesLeadScreen() {
  const demo = useDemo();
  const undoCreate = useCreateUndo();
  const toast = useToast();
  const { now, viewer, state } = demo;
  const sales = useSales();
  const detail = LEAD_NOA;
  const lead = sales.leads.find((l) => l.id === detail.leadId) ?? LEADS.find((l) => l.id === detail.leadId)!;
  const [open, setOpen] = useState<Open>(null);
  const [stage, setStage] = useState<LeadStage>(lead.stage);
  const [composer, setComposer] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const added = sales.events[lead.id] ?? [];
  const events = detail.timeline.state === "ready" ? ready([...added, ...detail.timeline.data]) : detail.timeline;

  const due = detail.next.due;
  const hero = {
    label: "הפעולה הבאה",
    title: `${detail.next.title} יום ${fmtWeekday(due)}, ${fmtDayMonth(due)}`,
    detail: `ביקשה במייל מ־${fmtDayMonth(detail.next.requestedAt)}. השיחה איתה ${fmtRelativeDay(detail.next.meetingAt, now)} ב־${fmtTime(detail.next.meetingAt)}.`,
    action: { label: "צור הצעת מחיר", href: R.proposal(detail.proposalId ?? "corporate-hosting") },
  };

  // proposal + tasks (tasks are the shared Mytiv Work tasks linked to this lead)
  const base = PROPOSALS.find((p) => p.id === detail.proposalId);
  const proposal = base ? liveProposal(base, demo.approval(base.approvalId ?? "")?.status, base.approvalId ? state.executions[base.approvalId] : undefined) : null;
  const tasks = state.tasks
    .filter((t) => t.links.leadId === lead.id && t.status !== "done" && t.status !== "cancelled")
    .map((t) => ({ id: t.id, title: t.title, meta: `${personName(t.assigneeId)}${t.dueDate ? ` · ${fmtDayMonth(t.dueDate)}` : ""}`, href: R.task(t.id) }));

  // background contact search
  const jobId = `contacts-${lead.id}`;
  const job = state.jobs.find((j) => j.id === jobId);
  const running = !!job && jobStatus(job, state.clock).state === "running";
  const tick = useTicker(running, 500);
  const status = job ? jobStatus(job, Math.max(state.clock, running ? tick : 0)) : null;
  const approved = sales.contacts[lead.id] ?? [];
  const suggestions = detail.suggestions.filter((s) => !approved.some((a) => a.id === s.id) && !dismissed.includes(s.id));

  const addNote = (text: string) => {
    const ev: TimelineEvent = { id: `ev-${Date.now()}`, kind: "note", at: now, title: `הערה של ${viewer.name}`, authorId: viewer.id, text };
    addEvent(lead.id, ev);
    toast.push({ title: "ההערה נשמרה", detail: text.length > 60 ? `${text.slice(0, 60)}…` : text, undo: { onUndo: () => removeEvent(lead.id, ev.id) } });
    return true;
  };

  const saveStage = () => {
    setOpen(null);
    if (stage === lead.stage) return;
    const prev = patchLead(lead.id, { stage });
    if (prev) toast.push({ title: `השלב עודכן: ${STAGE[stage]}`, detail: `היה: ${STAGE[prev.stage]}`, undo: { onUndo: () => restoreLead(prev) } });
  };

  const createTask = (title: string, dueDate: string | null) => {
    const t = demo.createTask({ title, dueDate, priority: "medium", links: { leadId: lead.id }, context: { client: "מכירות", project: lead.name } });
    setOpen(null);
    toast.push({ title: "המשימה נוצרה", detail: `${title} · מופיעה גם בעבודה שלי`, undo: { onUndo: undoCreate(t) } });
  };

  const search = () => demo.startJob({
    id: jobId, kind: "ai_directions", label: "בודק אנשי קשר נוספים", detail: "מקורות ציבוריים בלבד. שום דבר לא נוסף בלי אישור.",
    durationMs: detail.searchMs, outcome: state.failNext ? "failure" : "success", href: R.lead(lead.id),
  });
  const approve = (s: ContactSuggestion) => {
    const prev = approved;
    setContacts(lead.id, [...approved, s]);
    toast.push({ title: `${s.name} נוסף כאיש קשר`, detail: "פרטי הקשר מסומנים ״משוער״ עד שיאומתו.", undo: { onUndo: () => setContacts(lead.id, prev) } });
  };

  const cta = <ButtonLink variant="primary" size="lg" href={hero.action.href}>צור הצעת מחיר</ButtonLink>;

  return (
    <div className="f-sl-lead f-own-mhead">
      <LeadHeader lead={lead} detail={detail} cta={cta}
        onStage={() => { setStage(lead.stage); setOpen("stage"); }} onOutreach={() => setOpen("outreach")} onMeeting={() => setOpen("meeting")} onCall={() => setOpen("call")} />
      <div className="f-sl-lead__body">
        <div className="f-sl-lead__main">
          <NextActionHero next={hero} />
          <LeadTimeline events={events} now={now} composerOpen={composer > 0} focusSignal={composer} onAddNote={addNote} />
          <LeadPhoneActions onNote={() => setComposer((n) => n + 1)} onStage={() => { setStage(lead.stage); setOpen("stage"); }} />
        </div>
        <aside className="f-sl-lead__side" aria-label="פרטי הליד">
          <ContactCard detail={detail} />
          <NeedCard detail={detail} />
          <WorkCard tasks={tasks} onAddTask={() => setOpen("task")}
            proposal={proposal && (
              <Link href={proposal.href ?? R.proposals} className="f-sl-side__prop">
                <span><b>הצעה <bdi dir="ltr">{proposal.number}</bdi></b> · {fmtMoney(proposal.amount.amount)}</span>
                <ProposalStatusPill status={proposal.status} size="sm" />
              </Link>
            )} />
          <ExtraContactsCard status={status} approved={approved} suggestions={suggestions} onSearch={search} onCancel={() => demo.cancelJob(jobId)}
            onApprove={approve} onDismiss={(s) => setDismissed((d) => [...d, s.id])} />
        </aside>
      </div>

      <SalesDialog open={open === "stage"} onClose={() => setOpen(null)} id="sl-stage" title={`שלב · ${lead.name}`}
        actions={<><Button variant="primary" onClick={saveStage}>שמור שלב</Button><Button variant="neutral" onClick={() => setOpen(null)}>ביטול</Button></>}>
        <StagePicker value={stage} onChange={setStage} />
      </SalesDialog>

      <PlannedDialog open={open === "outreach"} onClose={() => setOpen(null)} id="sl-outreach" title={`פנייה ל${lead.name}`}
        what={<>Mytiv תנסח טיוטת מייל אל <Bdi>{detail.contact.email}</Bdi>, תבדוק את העובדות שבה, ותעביר אותה ל־Gmail לשליחה שלך. שום דבר לא יישלח בלי אישור.</>}
        meanwhile="אפשר לנסח פנייה עם בדיקת עובדות במסך הפניות היזומות, או ליצור משימת מעקב.">
        <ButtonLink variant="secondary" href={R.outreach}>לפניות יזומות</ButtonLink>
        <Button variant="neutral" onClick={() => createTask(`לשלוח פנייה ל${lead.name}`, null)}>צור משימת מעקב</Button>
      </PlannedDialog>

      <PlannedDialog open={open === "meeting"} onClose={() => setOpen(null)} id="sl-meeting" title={`פגישה עם ${lead.name}`}
        what="קביעת מועד מול Google Calendar ושליחת הזמנה ללקוחה, אחרי שתאשר את המועד."
        meanwhile={`השיחה הקרובה כבר ביומן: ${fmtRelativeDay(detail.next.meetingAt, now)} ${fmtTime(detail.next.meetingAt)}.`}>
        <ButtonLink variant="secondary" href={R.calendar}>פתח את היומן</ButtonLink>
      </PlannedDialog>

      <SalesDialog open={open === "call"} onClose={() => setOpen(null)} id="sl-call" title={`התקשרות ל${lead.name}`}
        actions={<><a className="f-btn f-btn--primary" href={`tel:${detail.contact.phone.replace(/[^\d+]/g, "")}`}>התקשר <Bdi>{detail.contact.phone}</Bdi></a><Button variant="neutral" onClick={() => setOpen(null)}>ביטול</Button></>}>
        <p className="f-sl-dlg__text">השיחה תיפתח באפליקציית הטלפון שלך. סיכום השיחה לא נשמר אוטומטית: הוסף הערה בציר הזמן אחרי השיחה.</p>
      </SalesDialog>

      <SalesDialog open={open === "task"} onClose={() => setOpen(null)} id="sl-task" title={`משימה · ${lead.name}`}>
        {open === "task" && <TaskForm today={now.slice(0, 10)} onCancel={() => setOpen(null)} onSave={createTask} />}
      </SalesDialog>
    </div>
  );
}

function TaskForm({ today, onCancel, onSave }: { today: string; onCancel: () => void; onSave: (title: string, due: string | null) => void }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("כתוב מה צריך לעשות."); return; }
    onSave(title.trim(), due || null);
  };
  return (
    <form className="f-sl-form" onSubmit={submit} noValidate>
      <div className="f-sl-form__row">
        <TextField label="מה צריך לעשות" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} error={error} required maxLength={80} help="המשימה תקושר לליד ותופיע בעבודה שלי." />
        <TextField label="עד מתי" note="(רשות)" type="date" min={today} value={due} onChange={(e) => setDue(e.target.value)} className="f-sl-form__date" />
      </div>
      <div className="f-sl-dlg__actions f-sl-dlg__actions--flush">
        <Button type="submit" variant="primary">צור משימה</Button>
        <Button variant="neutral" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
}
