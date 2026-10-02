"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { BriefField } from "@/lib/focus/contracts/marketing";
import { BRIEF_GAL } from "@/lib/focus/fixtures/marketing";
import { fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { PlannedAction } from "@/components/focus/patterns/marketing/marketing-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { TextField } from "@/components/focus/ui/field";
import { OriginTag, VerificationTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Brief analysis (handoff H11): the original brief with what was extracted highlighted, the stated facts (confirmed by
 * a person — "אשר מידע" — or edited, which re-opens confirmation), the AI's conclusions marked as such, missing
 * information, a conflict with its reason, and follow-up questions. Contacting the client is planned (never faked).
 */
const b = BRIEF_GAL;

export default function MarketingBriefScreen() {
  const { viewer } = useDemo();
  const toast = useToast();
  const [stated, setStated] = useState<BriefField[]>(b.stated);
  const [confirmed, setConfirmed] = useState<{ at: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [inBrain, setInBrain] = useState(false);

  const confirm = () => {
    setConfirmed({ at: new Date().toISOString() });
    toast.push({ title: "המידע אושר", detail: `${stated.length} פרטים מהבריף סומנו כמאומתים.`, undo: { onUndo: () => { setConfirmed(null); setInBrain(false); } } });
  };
  const save = (next: BriefField[]) => {
    const prev = { stated, confirmed };
    setStated(next);
    setConfirmed(null);
    setEditing(false);
    toast.push({ title: "המידע עודכן", detail: "השינוי דורש אישור מחדש לפני שימוש.", undo: { onUndo: () => { setStated(prev.stated); setConfirmed(prev.confirmed); } } });
  };
  const toBrain = () => {
    setInBrain(true);
    toast.push({ title: `נוסף למוח העסק של ${b.client.name}`, detail: "רק המידע שאושר. מסקנות ה־AI לא נשמרו כעובדות.", undo: { onUndo: () => setInBrain(false) } });
  };

  return (
    <div className="f-mk-briefpg">
      <header className="f-mk-briefpg__head">
        <h1 className="f-mk-briefpg__title">ניתוח · {b.title}</h1>
        {inBrain
          ? <span className="f-mk-briefpg__done" role="status"><span aria-hidden>✓</span> נשמר במוח העסק</span>
          : <Button variant="neutral" id="to-brain" disabled={!confirmed} disabledReason={!confirmed ? "אשרו קודם את המידע מהבריף" : undefined} onClick={toBrain}>הוסף למוח העסק</Button>}
        <PlannedAction className="f-mk-planned--pill">הפוך למשימות</PlannedAction>
        <ButtonLink href={`${R.marketingPlan}?from=brief:${b.id}`}>צור קמפיין</ButtonLink>
      </header>

      <section className="f-panel f-mk-orig" aria-labelledby="orig-h">
        <div className="f-mk-orig__head">
          <h2 id="orig-h" className="f-mk-orig__h">הבריף המקורי</h2>
          <span className="f-meta">{b.source.label} · {fmtDayMonth(b.source.at)}</span>
        </div>
        <p className="f-mk-orig__text">
          {b.segments.map((s, i) => s.extracted ? <mark key={i} className="f-mk-orig__mark">{s.text}</mark> : <span key={i}>{s.text}</span>)}
        </p>
        <span className="f-meta"><span className="f-mk-orig__key" aria-hidden /> מסומן: מידע שחולץ מהבריף</span>
      </section>

      <div className="f-mk-briefpg__body">
        <div className="f-mk-briefpg__pair">
          <section className="f-panel f-mk-facts" aria-labelledby="stated-h">
            <h2 id="stated-h" className="f-mk-facts__tag"><span aria-hidden>=</span> מופיע בבריף</h2>
            {editing ? (
              <StatedForm fields={stated} onSave={save} onCancel={() => setEditing(false)} />
            ) : (
              <>
                <dl className="f-mk-facts__list">
                  {stated.map((f) => <div key={f.id}><dt>{f.label}:</dt> <dd>{f.value}</dd></div>)}
                </dl>
                {confirmed && <VerificationTag state="verified" label={`אומת ע״י ${viewer.name} · ${fmtTime(confirmed.at)}`} />}
                <div className="f-mk-facts__actions">
                  {!confirmed && <Button variant="secondary" size="sm" className="f-mk-facts__ok" onClick={confirm}>אשר מידע</Button>}
                  <Button variant="neutral" size="sm" onClick={() => setEditing(true)}>ערוך</Button>
                </div>
              </>
            )}
          </section>
          <section className="f-panel f-mk-facts" aria-labelledby="ai-h">
            <h2 id="ai-h" className="f-mk-facts__ai"><OriginTag origin="ai_suggested" label="מסקנה של AI" size="sm" /></h2>
            <dl className="f-mk-facts__list">
              {b.inferred.map((f) => <div key={f.id}><dt>{f.label}:</dt> <dd>{f.value}</dd></div>)}
            </dl>
            <VerificationTag state="unverified" label="לא אומת · לא מופיע בבריף" />
          </section>
        </div>
        <div className="f-mk-briefpg__trio">
          <section className="f-mk-flag f-mk-flag--missing" aria-labelledby="missing-h">
            <h2 id="missing-h" className="f-mk-flag__h"><span aria-hidden>○</span> מידע חסר</h2>
            <p>{b.missing.join(" · ")}</p>
          </section>
          {b.conflicts.map((c) => (
            <section key={c.id} className="f-mk-flag f-mk-flag--conflict" aria-labelledby={`conf-${c.id}`}>
              <h2 id={`conf-${c.id}`} className="f-mk-flag__h"><span aria-hidden>▲</span> סתירה</h2>
              <p>{c.text}</p>
              <p className="f-mk-flag__why">{c.reason}</p>
            </section>
          ))}
          <section className="f-panel f-mk-flag f-mk-flag--questions" aria-labelledby="q-h">
            <h2 id="q-h" className="f-mk-flag__h">שאלות להמשך</h2>
            <ol className="f-mk-flag__qs">{b.questions.map((q) => <li key={q}>{q}</li>)}</ol>
            <PlannedAction className="f-mk-flag__send">שלח שאלות ל{b.client.name.split(" ")[0]}</PlannedAction>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatedForm({ fields, onSave, onCancel }: { fields: BriefField[]; onSave: (f: BriefField[]) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(fields);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = draft.some((f, i) => f.value !== fields[i].value);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const f of draft) if (!f.value.trim()) next[f.id] = `יש למלא ${f.label}.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(draft.map((f) => ({ ...f, value: f.value.trim() })));
  };
  return (
    <form className="f-mk-facts__form" onSubmit={submit} noValidate>
      {draft.map((f, i) => (
        <TextField key={f.id} label={f.label} required value={f.value} error={errors[f.id]}
          onChange={(e) => { setDraft(draft.map((x, j) => (j === i ? { ...x, value: e.target.value } : x))); setErrors({ ...errors, [f.id]: "" }); }} />
      ))}
      <p className="f-meta">{dirty ? "יש שינויים שלא נשמרו. אחרי שמירה המידע יחזור לאישור." : "שינוי במידע יחזיר אותו לאישור."}</p>
      <div className="f-mk-facts__actions">
        <Button type="submit" size="sm">שמור</Button>
        <Button variant="neutral" size="sm" onClick={onCancel}>{dirty ? "בטל שינויים" : "סגור"}</Button>
      </div>
    </form>
  );
}
