"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlanField, PlanItem } from "@/lib/focus/contracts/clients";
import type { Fact } from "@/lib/focus/contracts/common";
import { PLAN_OCTOBER } from "@/lib/focus/fixtures/clients";
import { fmtDayMonth, fmtWaiting } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { AssumptionsPanel, PlanFieldTile, PlanTable, SendPlanBody } from "@/components/focus/patterns/clients/plan-parts";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { APPROVAL, ApprovalPill, OriginTag, PlannedTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Marketing plan (handoff H4): what the plan says (editable in place), its moves with their approval state, the
 * assumptions to verify before production, and what it is based on. "שלח לאישור הלקוחה" is external: it opens a review
 * with an explicit confirmation and records "ready to send" only — the sending itself is planned and never claimed.
 */
export default function ClientsPlanScreen() {
  const { now, viewer } = useDemo();
  const toast = useToast();
  const plan = PLAN_OCTOBER;
  const [fields, setFields] = useState<PlanField[]>(plan.fields);
  const [items, setItems] = useState<PlanItem[]>(plan.items);
  const [facts, setFacts] = useState<Fact[]>(plan.assumptions);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [seq, setSeq] = useState(0);

  const pendingItems = items.filter((i) => i.approval === "pending").length;
  const unverified = facts.filter((f) => f.verification !== "verified").length;
  const waited = fmtWaiting(plan.requestedAt, now);

  const saveField = (key: PlanField["key"], value: string) => {
    const prev = fields;
    const f = fields.find((x) => x.key === key);
    if (!f || f.value === value) return;
    setFields(fields.map((x) => (x.key === key ? { ...x, value } : x)));
    toast.push({ title: `${f.label} עודכן`, detail: value, undo: { onUndo: () => setFields(prev) } });
  };
  const saveItem = (id: string, v: Pick<PlanItem, "title" | "channels" | "metric">) => {
    const prev = items;
    const before = items.find((x) => x.id === id);
    setItems(items.map((x) => (x.id === id ? { ...x, ...v } : x)));
    toast.push({ title: before?.title ? "המהלך עודכן" : "מהלך נוסף לתוכנית", detail: v.title, undo: { onUndo: () => setItems(before?.title ? prev : prev.filter((x) => x.id !== id)) } });
  };
  const addItem = () => {
    const id = `pi-new-${seq + 1}`;
    setSeq(seq + 1);
    setItems((xs) => [...xs, { id, title: "", channels: "", metric: "", approval: "draft" }]);
    return id;
  };
  const verify = (id: string) => {
    const prev = facts;
    const f = facts.find((x) => x.id === id);
    setFacts(facts.map((x) => (x.id === id ? { ...x, verification: "verified", basis: `אומת ע״י ${viewer.name}` } : x)));
    toast.push({ title: "סומן כאומת", detail: f?.text, undo: { onUndo: () => setFacts(prev) } });
  };
  const confirmReady = () => {
    setSending(false);
    setReady(true);
    toast.push({ title: "התוכנית סומנה כמוכנה לשליחה", detail: "לא נשלחה ללקוחה — השליחה עוד לא מחוברת בדמו.", undo: { onUndo: () => setReady(false) } });
  };

  const status = `${pendingItems === 1 ? "מהלך אחד ממתין" : `${pendingItems} מהלכים ממתינים`} לאישור. ${unverified === 0 ? "כל ההנחות אומתו." : `${unverified === 1 ? "הנחה אחת דורשת" : `${unverified} הנחות דורשות`} אימות לפני הפקה.`}`;

  return (
    <Page className="f-cl-plan-page">
      <PageHeader
        eyebrow={<nav aria-label="נתיב" className="f-crumbs">שיווק ותוכן <span aria-hidden>›</span> תוכניות <span aria-hidden>›</span> {plan.client.name}</nav>}
        title={plan.title}
        size="entity"
        status={status}
        aside={ready
          ? <span className="f-cl-plan__ready"><ApprovalPill status="draft" label="מוכנה לשליחה · טרם נשלחה" /><PlannedTag /></span>
          : <ApprovalPill status={plan.status} label={`${APPROVAL[plan.status].word} · ${waited}`} className="f-cl-plan__pill" />}
        actions={<>
          <ButtonLink href={R.marketingBoard} variant="neutral">לוח עבודה</ButtonLink>
          {ready
            ? <Button variant="secondary" onClick={() => setReady(false)}>בטל סימון</Button>
            : <Button variant="primary" onClick={() => setSending(true)}>שלח לאישור הלקוחה</Button>}
        </>}
      />

      <section className="f-cl-tiles" aria-label="עיקרי התוכנית">
        {fields.map((f) => <PlanFieldTile key={f.key} f={f} onSave={(v) => saveField(f.key, v)} />)}
      </section>

      <div className="f-cl-plan__grid">
        <section aria-label="מהלכים" className="f-cl-plan__main">
          <PlanTable items={items} onSave={saveItem} onAdd={addItem} onRemoveNew={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />
        </section>
        <div className="f-cl-plan__side">
          <AssumptionsPanel facts={facts} onVerify={verify} />
          <section className="f-cl-side f-cl-basis" aria-labelledby="f-cl-basis-h">
            <h2 id="f-cl-basis-h" className="f-cl-side__title">על מה התוכנית מבוססת</h2>
            <p className="f-cl-basis__text">
              <Link href={R.briefs} className="f-link">בריף מ־{fmtDayMonth(plan.basis.briefAt)}</Link> · מוח העסק של {plan.basis.brainOf} · <OriginTag origin={plan.basis.origin} label={plan.basis.originLabel} size="sm" />
            </p>
            <p className="f-cl-basis__text">האישור הפנימי: <Link href={R.approval(plan.approvalId)} className="f-link">פתח בתור האישורים</Link></p>
          </section>
        </div>
      </div>

      <Dialog open={sending} onClose={() => setSending(false)} labelledBy="f-cl-send-title" initialFocus=".f-check__box">
        <SendPlanBody plan={{ ...plan, items }} unverified={unverified} onConfirm={confirmReady} onCancel={() => setSending(false)} />
      </Dialog>
    </Page>
  );
}
