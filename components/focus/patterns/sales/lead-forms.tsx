"use client";

import { useState, type FormEvent } from "react";
import type { Lead, LeadNext } from "@/lib/focus/contracts/sales";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { LEAD_SOURCES } from "@/lib/focus/fixtures/sales";
import { Button } from "@/components/focus/ui/button";
import { Banner } from "@/components/focus/ui/feedback";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { SalesDialog } from "./sales-parts";
import { useNavGuard } from "@/components/focus/shell/nav-guard";

/**
 * Sales forms in dialogs (handoff F1 "+ ליד חדש", "ללא פעולה הבאה · הוסף"): visible labels, help text that an error
 * replaces, required fields validated on submit, and closing with unsaved input asks first.
 */
const OWNERS = Object.values(PEOPLE).filter((p) => p.role !== "viewer").map((p) => ({ value: p.id, label: p.name }));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function DiscardGuard({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  return (
    <Banner kind="warning" title="יש פרטים שלא נשמרו" detail="אם תסגור עכשיו, מה שכתבת לא יישמר."
      action={<span className="f-sl-dlg__inline"><Button variant="neutral" size="sm" onClick={onKeep}>חזור לטופס</Button><Button variant="quiet" size="sm" onClick={onDiscard}>סגור בלי לשמור</Button></span>} />
  );
}

/** Builds the next action from the two fields (the date is optional). */
function NextFields({ text, due, minDate, onText, onDue, error, required }: {
  text: string; due: string; minDate: string; onText: (v: string) => void; onDue: (v: string) => void; error: string | null; required?: boolean;
}) {
  return (
    <div className="f-sl-form__row">
      <TextField label="הפעולה הבאה" note={required ? undefined : "(רשות)"} value={text} onChange={(e) => onText(e.target.value)} error={error}
        help="צעד אחד, בפועל: ״להתקשר״, ״לשלוח הצעה עד…״" maxLength={80} required={required} />
      <TextField label="עד מתי" note="(רשות)" type="date" value={due} min={minDate} onChange={(e) => onDue(e.target.value)} help="בלי תאריך הפעולה תופיע בלי יעד." className="f-sl-form__date" />
    </div>
  );
}

export function NextActionDialog({ lead, today, onClose, onSave }: { lead: Lead | null; today: string; onClose: () => void; onSave: (lead: Lead, next: LeadNext) => void }) {
  return (
    <SalesDialog open={!!lead} onClose={onClose} id="sl-next" title={lead ? `פעולה הבאה · ${lead.name}` : ""}>
      {lead && <NextActionForm key={lead.id} lead={lead} today={today} onClose={onClose} onSave={onSave} />}
    </SalesDialog>
  );
}

function NextActionForm({ lead, today, onClose, onSave }: { lead: Lead; today: string; onClose: () => void; onSave: (lead: Lead, next: LeadNext) => void }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  useNavGuard({ dirty: !!(text.trim() || due), what: "הפעולה הבאה שהתחלת לכתוב עוד לא נשמרה." });
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { setError("כתוב מה הצעד הבא. בלי צעד הבא הליד נשאר מסומן באדום."); return; }
    onSave(lead, { text: text.trim(), due: due || null });
  };
  return (
    <form className="f-sl-form" onSubmit={submit} noValidate>
      <NextFields text={text} due={due} minDate={today} onText={(v) => { setText(v); setError(null); }} onDue={setDue} error={error} required />
      <div className="f-sl-dlg__actions f-sl-dlg__actions--flush">
        <Button type="submit" variant="primary">שמור פעולה הבאה</Button>
        <Button variant="neutral" onClick={onClose}>ביטול</Button>
      </div>
    </form>
  );
}

type Draft = { name: string; company: string; source: string; ownerId: string; value: string; email: string; next: string; due: string };
type Errors = Partial<Record<keyof Draft, string>>;

export function NewLeadDialog({ open, today, viewerId, onClose, onCreate }: {
  open: boolean; today: string; viewerId: string; onClose: () => void;
  onCreate: (draft: { name: string; company: string; source: string; ownerId: string; value: number | null; email: string; next: LeadNext | null }) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [dirty, setDirty] = useState(false);
  useNavGuard({ dirty: open && dirty, what: "הליד החדש עוד לא נשמר. אם תצא עכשיו, מה שהוקלד יימחק." });
  const close = () => { setConfirm(false); setDirty(false); onClose(); };
  const requestClose = () => (dirty ? setConfirm(true) : close());
  return (
    <SalesDialog open={open} onClose={requestClose} id="sl-new" title="ליד חדש">
      {confirm && <DiscardGuard onKeep={() => setConfirm(false)} onDiscard={close} />}
      {open && <NewLeadForm today={today} viewerId={viewerId} onDirty={setDirty} onCancel={requestClose} onCreate={(d) => { setDirty(false); onCreate(d); }} />}
    </SalesDialog>
  );
}

function NewLeadForm({ today, viewerId, onDirty, onCancel, onCreate }: {
  today: string; viewerId: string; onDirty: (d: boolean) => void; onCancel: () => void;
  onCreate: (draft: { name: string; company: string; source: string; ownerId: string; value: number | null; email: string; next: LeadNext | null }) => void;
}) {
  const [d, setD] = useState<Draft>({ name: "", company: "", source: LEAD_SOURCES[0], ownerId: viewerId, value: "", email: "", next: "", due: "" });
  const [errors, setErrors] = useState<Errors>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); onDirty(true); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!d.name.trim()) errs.name = "חסר שם. בלי שם אי אפשר לשמור ליד.";
    const value = d.value.trim() === "" ? null : Number(d.value.replace(/,/g, ""));
    if (value != null && (!Number.isFinite(value) || value < 0)) errs.value = "כתוב מספר בשקלים, או השאר ריק אם לא ידוע.";
    if (d.email.trim() && !EMAIL.test(d.email.trim())) errs.email = "כתובת המייל לא תקינה.";
    if (d.due && !d.next.trim()) errs.next = "יש תאריך בלי פעולה. כתוב מה הצעד, או מחק את התאריך.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = (e.currentTarget as HTMLFormElement).querySelector<HTMLElement>("[aria-invalid='true']");
      requestAnimationFrame(() => first?.focus());
      return;
    }
    onCreate({ name: d.name.trim(), company: d.company.trim(), source: d.source, ownerId: d.ownerId, value, email: d.email.trim(), next: d.next.trim() ? { text: d.next.trim(), due: d.due || null } : null });
  };
  return (
    <form className="f-sl-form" onSubmit={submit} noValidate>
      <div className="f-sl-form__row">
        <TextField label="שם איש הקשר" value={d.name} onChange={(e) => set("name", e.target.value)} error={errors.name} required autoComplete="off" maxLength={60} />
        <TextField label="עסק או צורך" note="(רשות)" value={d.company} onChange={(e) => set("company", e.target.value)} help="למשל ״מאפייה בשכונה״ או ״אירוע חברה ל־40״" maxLength={60} />
      </div>
      <div className="f-sl-form__row">
        <SelectField label="מקור" value={d.source} onChange={(e) => set("source", e.target.value)} options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))} />
        <SelectField label="אחראי" value={d.ownerId} onChange={(e) => set("ownerId", e.target.value)} options={OWNERS} />
      </div>
      <div className="f-sl-form__row">
        <TextField label="שווי משוער (₪)" note="(רשות)" inputMode="numeric" dir="ltr" value={d.value} onChange={(e) => set("value", e.target.value)} error={errors.value}
          help="הערכה שלך. ריק = לא ידוע, ויוצג ״—״ (לא 0)." />
        <TextField label="מייל" note="(רשות)" type="email" dir="ltr" value={d.email} onChange={(e) => set("email", e.target.value)} error={errors.email} help="יסומן ״לא מאומת״ עד שיאומת." />
      </div>
      <NextFields text={d.next} due={d.due} minDate={today} onText={(v) => set("next", v)} onDue={(v) => set("due", v)} error={errors.next ?? null} />
      <div className="f-sl-dlg__actions f-sl-dlg__actions--flush">
        <Button type="submit" variant="primary">הוסף ליד</Button>
        <Button variant="neutral" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
}
