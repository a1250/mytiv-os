"use client";

import { useState } from "react";
import type { MarketingPlan, PlanField, PlanItem } from "@/lib/focus/contracts/clients";
import type { Fact } from "@/lib/focus/contracts/common";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Banner } from "@/components/focus/ui/feedback";
import { Checkbox, TextAreaField } from "@/components/focus/ui/field";
import { Bdi } from "@/components/focus/ui/misc";
import { ApprovalPill, PlannedTag, VerificationTag } from "@/components/focus/ui/status";

/**
 * Marketing plan parts (handoff H4): summary tiles and plan rows that edit in place (save / cancel, required text),
 * the assumptions that must be verified before production, and the review step before the plan goes to the client.
 * Sending to the client is an external action with no backend yet: the dialog records "ready to send" and says so.
 */
export function PlanFieldTile({ f, onSave }: { f: PlanField; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    if (draft == null) return;
    if (!draft.trim()) { setError("השדה לא יכול להיות ריק."); return; }
    onSave(draft.trim()); setDraft(null); setError(null);
  };
  if (draft != null) {
    return (
      <div className="f-cl-tile f-cl-tile--edit">
        <TextAreaField label={f.label} value={draft} onChange={(e) => { setDraft(e.target.value); setError(null); }} error={error} help="Enter שומר · Esc מבטל" rows={2} autoFocus
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") { e.preventDefault(); setDraft(null); setError(null); } }} />
        <div className="f-cl-tile__actions">
          <Button size="sm" onClick={save}>שמור</Button>
          <Button size="sm" variant="quiet" onClick={() => { setDraft(null); setError(null); }}>ביטול</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="f-cl-tile">
      <div className="f-cl-tile__head">
        <span className="f-cl-tile__label">{f.label}</span>
        <button type="button" className="f-cl-edit f-hit" onClick={() => setDraft(f.value)} aria-label={`ערוך: ${f.label}`}>ערוך</button>
      </div>
      <b className="f-cl-tile__value">{f.value}</b>
    </div>
  );
}

type RowDraft = Pick<PlanItem, "title" | "channels" | "metric">;

export function PlanTable({ items, onSave, onAdd, onRemoveNew }: {
  items: PlanItem[]; onSave: (id: string, v: RowDraft) => void; onAdd: () => string; onRemoveNew: (id: string) => void;
}) {
  const [pending, setEditing] = useState<{ id: string; v: RowDraft; isNew?: boolean; error?: string } | null>(null);
  const open = (it: PlanItem) => setEditing({ id: it.id, v: { title: it.title, channels: it.channels, metric: it.metric } });
  const add = () => setEditing({ id: onAdd(), v: { title: "", channels: "", metric: "" }, isNew: true });
  const save = () => {
    if (!pending) return;
    if (!pending.v.title.trim()) { setEditing({ ...pending, error: "כתוב מה המהלך." }); return; }
    onSave(pending.id, { title: pending.v.title.trim(), channels: pending.v.channels.trim(), metric: pending.v.metric.trim() });
    setEditing(null);
  };
  const cancel = () => {
    if (pending?.isNew) onRemoveNew(pending.id);
    setEditing(null);
  };
  const field = (k: keyof RowDraft, label: string) => pending && (
    <input
      value={pending.v[k]} aria-label={label} aria-invalid={k === "title" && pending.error ? true : undefined}
      onChange={(e) => setEditing({ ...pending, v: { ...pending.v, [k]: e.target.value }, error: undefined })}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } if (e.key === "Escape") { e.preventDefault(); cancel(); } }}
      autoFocus={k === "title"} className="f-input f-input--sm"
    />
  );
  return (
    <table className="f-cl-table f-cl-plan f-cl-rtable">
      <caption className="f-sr">מהלכי התוכנית</caption>
      <thead><tr><th scope="col">מהלך</th><th scope="col">ערוץ</th><th scope="col">מדד הצלחה</th><th scope="col">אישור</th><th scope="col"><span className="f-sr">עריכה</span></th></tr></thead>
      <tbody>
        {items.map((it) => pending?.id === it.id ? (
          <tr key={it.id} className="f-cl-plan__edit">
            <th scope="row" data-label="מהלך">{field("title", "מהלך")}{pending.error && <span className="f-field__error" role="alert"><span aria-hidden>!</span>{pending.error}</span>}</th>
            <td data-label="ערוץ">{field("channels", "ערוץ")}</td>
            <td data-label="מדד הצלחה">{field("metric", "מדד הצלחה")}</td>
            <td data-label="אישור"><ApprovalPill status={it.approval} size="sm" /></td>
            <td><span className="f-cl-plan__btns"><Button size="sm" onClick={save}>שמור</Button><Button size="sm" variant="quiet" onClick={cancel}>ביטול</Button></span></td>
          </tr>
        ) : (
          <tr key={it.id}>
            <th scope="row" data-label="מהלך">{it.title}</th>
            <td data-label="ערוץ">{it.channels || "—"}</td>
            <td data-label="מדד הצלחה">{it.metric || "—"}</td>
            <td data-label="אישור"><ApprovalPill status={it.approval} size="sm" label={it.approval === "pending" ? "ממתין" : undefined} /></td>
            <td>{!pending && <button type="button" className="f-cl-edit f-hit" onClick={() => open(it)} aria-label={`ערוך: ${it.title}`}>ערוך</button>}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td colSpan={5}>{pending ? <span className="f-meta-sm">Enter שומר · Esc מבטל</span> : <button type="button" className="f-cl-addlink f-hit" onClick={add}>+ מהלך</button>}</td></tr>
      </tfoot>
    </table>
  );
}

export function AssumptionsPanel({ facts, onVerify }: { facts: Fact[]; onVerify: (id: string) => void }) {
  const open = facts.filter((f) => f.verification !== "verified");
  return (
    <section className={cx("f-cl-assume", open.length === 0 && "f-cl-assume--done")} aria-labelledby="f-cl-assume-h">
      <h2 id="f-cl-assume-h" className="f-cl-assume__title">
        {open.length ? <><span aria-hidden>○</span> הנחות שדורשות אימות · {open.length}</> : <><span aria-hidden>✓</span> כל ההנחות אומתו</>}
      </h2>
      <ul className="f-cl-assume__list">
        {facts.map((f) => (
          <li key={f.id} className="f-cl-assume__item">
            <span className="f-cl-assume__text">{f.text} <span className="f-cl-assume__basis">· {f.basis}</span></span>
            <span className="f-cl-assume__row">
              <VerificationTag state={f.verification} />
              {f.verification !== "verified" && <button type="button" className="f-cl-edit f-hit" onClick={() => onVerify(f.id)} aria-label={`סמן כאומת: ${f.text}`}>סמן כאומת</button>}
            </span>
          </li>
        ))}
      </ul>
      {open.length > 0 && <p className="f-cl-assume__ask">בקשת אימות מהלקוחה <PlannedTag /></p>}
    </section>
  );
}

/** Review before the plan goes to the client — explicit confirmation; the sending itself is planned (no backend). */
export function SendPlanBody({ plan, unverified, onConfirm, onCancel }: { plan: MarketingPlan; unverified: number; onConfirm: () => void; onCancel: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="f-cl-send">
      <h2 id="f-cl-send-title" className="f-cl-send__title">שליחת התוכנית לאישור הלקוחה</h2>
      <dl className="f-cl-send__dl">
        <div><dt>נמענת</dt><dd>{plan.recipient.name} · <Bdi>{plan.recipient.email}</Bdi></dd></div>
        <div><dt>מה נשלח</dt><dd>{plan.title} · {plan.client.name} · {plan.items.length} מהלכים</dd></div>
        <div><dt>אחרי השליחה</dt><dd>הלקוחה מאשרת או מבקשת שינוי; ההחלטה תופיע כאן.</dd></div>
      </dl>
      {unverified > 0 && <Banner kind="warning" title={`${unverified === 1 ? "הנחה אחת עוד לא אומתה" : `${unverified} הנחות עוד לא אומתו`}`} detail={'הן יופיעו בתוכנית מסומנות "לא אומת".'} />}
      <Banner kind="unavailable" title="השליחה עצמה עוד לא מחוברת בדמו." detail="אישור כאן מסמן את התוכנית כמוכנה לשליחה. שום דבר לא יוצא ללקוחה." />
      <Checkbox checked={ok} onChange={setOk}>בדקתי את התוכנית ואת הנמענת</Checkbox>
      <div className="f-cl-send__actions">
        <Button onClick={onConfirm} disabled={!ok} disabledReason={!ok ? "סמן קודם את תיבת האישור." : undefined} id="f-cl-send-confirm">סמן כמוכנה לשליחה</Button>
        <Button variant="neutral" onClick={onCancel}>ביטול</Button>
      </div>
    </div>
  );
}
