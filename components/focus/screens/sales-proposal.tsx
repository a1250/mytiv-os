"use client";

import { useEffect, useRef, useState } from "react";
import { PROPOSAL_CORPORATE, PROPOSAL_TEMPLATES, VALIDITY_OPTIONS } from "@/lib/focus/fixtures/sales";
import { fmtAgo, fmtDate, fmtMoney, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { computeTotals, fromDraft, lineValid, LineItems, PdfPreview, toDraft, TotalsBox, VersionsCard, type LineDraft } from "@/components/focus/patterns/sales/proposal-editor";
import { fmtAmount, PlannedDialog, ProposalStatusPill } from "@/components/focus/patterns/sales/sales-parts";
import { getSales, saveProposal, useSales, type SalesState } from "@/components/focus/patterns/sales/sales-store";
import { useDemo } from "@/components/focus/shell/demo-store";
import { FocusBar } from "@/components/focus/shell/focus-bar";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { Banner, SkeletonCard } from "@/components/focus/ui/feedback";
import { ReadOnlyValue, SelectField, TextAreaField } from "@/components/focus/ui/field";
import { PlannedTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";
import { useNavGuard } from "@/components/focus/shell/nav-guard";

/**
 * Proposal editor with PDF preview (handoff F3). Quantity × unit price recompute subtotal / VAT 18% / total live; every
 * valid change is saved to the draft at once, an invalid field is flagged and blocks leaving without a word. "המשך
 * לשליחה" opens the existing pre-execution summary (approval "proposal-noa") — only while the amount still matches the
 * version that waits there. PDF export and the AI e-mail are planned.
 */
type Form = { lines: LineDraft[]; notes: string; templateId: string; validityDays: number };

const d = PROPOSAL_CORPORATE;
const DAY = 86_400_000;
const fixtureForm = (): Form => ({ lines: toDraft(d.lines), notes: d.notes, templateId: d.templateId, validityDays: d.validityDays });

export default function SalesProposalScreen() {
  const { hydrated } = useDemo();
  const sales = useSales();
  // the saved draft lives in sessionStorage — mount the editor once it can be read, so the form starts from it
  if (!hydrated) {
    return (
      <div className="f-focusmode f-sl-prop">
        <FocusBar exitHref={R.lead(d.leadId)} exitLabel="לליד" exitGlyph="→" center={<b className="f-sl-pbar__title">הצעה · {d.clientName}</b>} />
        <div className="f-sl-prop__body" role="status" aria-busy="true"><span className="f-sr">טוען את ההצעה…</span><SkeletonCard lines={6} /><SkeletonCard lines={8} /></div>
      </div>
    );
  }
  return <Editor saved={sales.proposal} />;
}

function Editor({ saved }: { saved: SalesState["proposal"] }) {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const [form, setForm] = useState<Form>(() => (saved ? { ...saved, lines: toDraft(saved.lines) } : fixtureForm()));
  // undo toasts run later: they read the form that is current then, not the render that made them
  const formNow = useRef(form);
  useEffect(() => { formNow.current = form; }, [form]);
  // the stored proposal changed outside this editor (an undo from a toast of an earlier visit): show what is stored —
  // derived during render ("storing information from previous renders"), so the page never edits a stale copy
  const [seen, setSeen] = useState(saved);
  if (saved !== seen) { setSeen(saved); setForm(saved ? { ...saved, lines: toDraft(saved.lines) } : fixtureForm()); }
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [planned, setPlanned] = useState<null | "pdf" | "ai">(null);

  const approval = demo.approval(d.approvalId);
  const approvedAmount = approval?.execution?.payload.amount?.amount ?? null;
  const exec = state.executions[d.approvalId];
  const sentAt = exec?.step === "sent" ? exec.at : null;
  // the proposal cannot change while it is being sent or after it was sent (the send carries the approved amount)
  const sending = exec?.step === "sending";
  const locked = sentAt != null || sending;
  const allValid = form.lines.every(lineValid);
  const totals = computeTotals(form.lines, d.vatRate);
  const template = PROPOSAL_TEMPLATES.find((t) => t.id === form.templateId) ?? PROPOSAL_TEMPLATES[0];
  const validUntil = new Date(new Date(d.createdAt).getTime() + form.validityDays * DAY).toISOString();
  const amountMatches = !!totals && approvedAmount != null && totals.total === approvedAmount;
  const blocked = locked ? null
    : !allValid ? "יש שדות לא תקינים בהצעה. תקן אותם כדי להמשיך."
    : form.lines.length === 0 ? "אין שירותים בהצעה."
    : !amountMatches ? `סיכום השליחה ממתין על ${fmtMoney(approvedAmount ?? 0)} (גרסה 1). ההצעה עכשיו ${totals ? fmtAmount(totals.total) : "—"}. שליחת סכום אחר דורשת גרסה חדשה לאישור.`
    : null;

  /** every valid state is saved at once (the draft never holds a number that does not parse) */
  const commit = (next: Form) => {
    setForm(next);
    if (next.lines.every(lineValid)) {
      const p = { lines: fromDraft(next.lines), notes: next.notes, templateId: next.templateId, validityDays: next.validityDays };
      setSeen(p); // our own save is not an outside change
      saveProposal(p);
    }
  };

  useEffect(() => {
    if (focusId) document.querySelector<HTMLInputElement>(`[data-line="${focusId}"] input`)?.focus();
  }, [focusId]);
  // unsaved changes: every way out asks first (links, search, Back, closing the tab) — see NavGuardProvider
  useNavGuard({ dirty: !allValid, what: "יש שדה לא תקין, ולכן השינויים האחרונים לא נשמרו. אם תצא עכשיו, ההצעה תישאר כפי שנשמרה לאחרונה." });


  /**
   * Undo of a whole-form change: only while that change is still the latest (a later edit is never thrown away) and
   * never once the proposal is being sent or was sent (what was sent must stay what the page shows).
   */
  const undoTo = (prev: Form, made: Form) => {
    // what this change stored: the undo applies only while the stored proposal is still exactly that (the editor may
    // have been left and reopened since — a ref inside one editor instance would not see edits made in the next one)
    const madeStored = JSON.stringify(getSales().proposal);
    return (): boolean => {
    const ex = demo.getLatest().executions[d.approvalId];
    if (ex?.step === "sending" || ex?.step === "sent") { toast.push({ kind: "error", title: "הביטול לא בוצע", detail: "ההצעה כבר בשליחה או נשלחה, ולכן היא לא משתנה." }); return false; }
    if (JSON.stringify(getSales().proposal) !== madeStored || formNow.current !== made) { toast.push({ kind: "error", title: "הביטול לא בוצע", detail: "ההצעה נערכה מאז, והביטול היה מוחק את העריכות האחרונות." }); return false; }
    commit(prev);
    return true;
    };
  };

  const changeTemplate = (id: string) => {
    const t = PROPOSAL_TEMPLATES.find((x) => x.id === id);
    if (!t || id === form.templateId) return;
    const prev = form, made = { ...form, templateId: id, lines: toDraft(t.lines), notes: t.notes };
    commit(made);
    toast.push({ title: `התבנית הוחלפה: ${t.label}`, detail: "השירותים והתנאים הוחלפו לפי התבנית.", undo: { onUndo: undoTo(prev, made) } });
  };
  const removeLine = (id: string) => {
    const prev = form, made = { ...form, lines: form.lines.filter((l) => l.id !== id) };
    const line = form.lines.find((l) => l.id === id);
    commit(made);
    toast.push({ title: `הוסר: ${line?.name.trim() || "שירות"}`, detail: "הסכומים חושבו מחדש.", undo: { onUndo: undoTo(prev, made) } });
  };
  const addLine = () => {
    const id = `ln-new-${Date.now()}`;
    commit({ ...form, lines: [...form.lines, { id, name: "", note: "נוסף ידנית", qty: "1", unit: "0" }] });
    setFocusId(id);
  };
  const revert = () => {
    const prev = form, made = fixtureForm();
    commit(made);
    setTouched(new Set());
    toast.push({ title: "חזרה לגרסה 1", detail: `הסכום חזר ל־${fmtMoney(approvedAmount ?? 0)}.`, undo: { onUndo: undoTo(prev, made) } });
  };

  const primary = locked
    ? <ButtonLink variant="primary" href={R.approval(d.approvalId)}>לסיכום השליחה</ButtonLink>
    : blocked
      ? <Button variant="primary" disabled aria-describedby="sl-send-why">המשך לשליחה</Button>
      : <ButtonLink variant="primary" href={R.approval(d.approvalId)}>המשך לשליחה</ButtonLink>;
  const plannedButtons = (
    <>
      <Button variant="neutral" onClick={() => setPlanned("pdf")} aria-haspopup="dialog">הפק PDF <PlannedTag /></Button>
      <Button variant="neutral" onClick={() => setPlanned("ai")} aria-haspopup="dialog"><span aria-hidden>✦</span> כתוב מייל בעזרת AI <PlannedTag /></Button>
    </>
  );

  return (
    <div className="f-focusmode f-sl-prop">
      <FocusBar exitHref={R.lead(d.leadId)} exitLabel="לליד" exitGlyph="→"
        center={<span className="f-sl-pbar__center">
          <b className="f-sl-pbar__title">הצעה · {template.label} · {d.clientName}</b>
          <ProposalStatusPill status={sentAt != null ? "sent" : "draft"} label={`${sentAt != null ? "נשלחה" : sending ? "בשליחה" : "טיוטה"} · גרסה ${d.versions.length}`} />
        </span>}
        end={<span className="f-sl-pbar__end">
          <span className="f-sl-pbar__saved" role="status">{allValid ? `נשמר ${fmtAgo(d.savedAt, now)}` : <b className="f-sl-pbar__unsaved"><span aria-hidden>!</span> לא נשמר · יש שדה לא תקין</b>}</span>
          <span className="f-sl-pbar__planned">{plannedButtons}</span>
          {primary}
        </span>}
      />
      <div className="f-sl-prop__body">
        {sentAt != null && <Banner kind="done" title={`גרסה ${d.versions.length} נשלחה ב־${fmtTime(new Date(sentAt).toISOString())} ונעולה לעריכה.`} detail="Gmail אישר את השליחה. שינוי ייצור גרסה חדשה, והקודמת נשמרת." />}
        {blocked && (
          <div id="sl-send-why">
            <Banner kind={allValid ? "warning" : "error"} title="המשך לשליחה חסום כרגע" detail={blocked}
              action={allValid && form.lines.length > 0 ? <Button variant="neutral" size="sm" onClick={revert}>חזור לגרסה 1</Button> : undefined} />
          </div>
        )}
        <div className="f-sl-prop__grid">
          <div className="f-sl-prop__form">
            <section className="f-sl-panel f-sl-prop__meta" aria-label="פרטי ההצעה">
              <ReadOnlyValue label="לקוחה" why="מולא מהליד">{d.clientName}</ReadOnlyValue>
              <SelectField label="תבנית" value={form.templateId} disabled={locked} onChange={(e) => changeTemplate(e.target.value)}
                options={PROPOSAL_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} help="החלפה מחליפה שירותים ותנאים (אפשר לבטל)." />
              <SelectField label="תוקף" value={String(form.validityDays)} disabled={locked} onChange={(e) => commit({ ...form, validityDays: Number(e.target.value) })}
                options={VALIDITY_OPTIONS.map((n) => ({ value: String(n), label: `${n} יום · עד ${fmtDate(new Date(new Date(d.createdAt).getTime() + n * DAY).toISOString())}` }))} />
            </section>
            <LineItems lines={form.lines} touched={touched} locked={locked}
              onChange={(id, patch) => commit({ ...form, lines: form.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) })}
              onBlur={(k) => setTouched((t) => new Set(t).add(k))} onRemove={removeLine} onAdd={addLine}
              footer={<div className="f-sl-lines__foot">
                <TextAreaField label="תנאי תשלום והערות" value={form.notes} readOnly={locked} maxLength={400} rows={3}
                  onChange={(e) => commit({ ...form, notes: e.target.value })} help="מופיע בתחתית ה־PDF." />
                <TotalsBox totals={totals} vatRate={d.vatRate} />
              </div>} />
          </div>
          <div className="f-sl-prop__preview">
            <div className="f-sl-prop__phead">
              <h2 className="f-sl-panel__h f-sl-panel__h--sm">תצוגה מקדימה</h2>
              <span className="f-meta">כך תיראה ההצעה ב־PDF</span>
            </div>
            <div className="f-sl-prop__narrow-actions">{plannedButtons}</div>
            <PdfPreview draft={d} lines={form.lines} notes={form.notes} validUntil={validUntil} totals={totals} />
            <VersionsCard draft={d} now={now} locked={sentAt != null} />
          </div>
        </div>
      </div>

      <PlannedDialog open={planned === "pdf"} onClose={() => setPlanned(null)} id="sl-pdf" title="הפקת PDF"
        what="הפקת קובץ PDF מההצעה, בדיוק כפי שהיא בתצוגה המקדימה, לשמירה או לצירוף."
        meanwhile="התצוגה המקדימה כאן היא מה שיופק. בשליחה דרך סיכום השליחה ה־PDF מצורף להצעה." />
      <PlannedDialog open={planned === "ai"} onClose={() => setPlanned(null)} id="sl-ai" title="מייל בעזרת AI"
        what="טיוטת מייל ללקוחה על בסיס ההצעה והשיחה איתה, עם בדיקת עובדות לפני שליחה."
        meanwhile="גוף המייל בסיכום השליחה נכתב ונערך ע״י דנה. אפשר לנסח פנייה עם בדיקת עובדות במסך הפניות היזומות.">
        <ButtonLink variant="secondary" href={R.outreach}>לפניות יזומות</ButtonLink>
      </PlannedDialog>
    </div>
  );
}
