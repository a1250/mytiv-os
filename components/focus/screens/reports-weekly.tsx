"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type MouseEvent } from "react";
import type { ReviewItem, ReviewItemKind, ReviewSection } from "@/lib/focus/contracts/reports";
import { WEEKLY_REVIEW } from "@/lib/focus/fixtures/reports";
import { personName } from "@/lib/focus/fixtures/people";
import { fmtDayMonth } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { PlannedAction, StateTag, fmtWhen } from "@/components/focus/patterns/reports/report-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { TextAreaField } from "@/components/focus/ui/field";
import { ApprovalPill, OriginTag, SYSTEM, VerificationTag, WORK } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * סקירה שבועית (handoff G3) — focus mode. Every data line links to its source item; AI sections are marked and stay
 * "לא אומת" until someone checks them. Copy is local; PDF export and sharing are external → planned.
 * The executive summary can be edited (required, validated); unsaved edits are guarded before leaving.
 */
const KIND: Record<ReviewItemKind, { glyph: string; word: string } | null> = {
  done: WORK.done, blocked: WORK.blocked, unavailable: SYSTEM.unavailable, estimated: { glyph: "≈", word: "מוערך" }, info: null,
};

function Item({ it, numbered }: { it: ReviewItem; numbered?: number }) {
  const k = KIND[it.kind];
  return (
    <li className={cx("f-rp-wk__item", `f-rp-wk__item--${it.kind}`)}>
      {numbered != null ? <span className="f-rp-wk__num f-num" aria-hidden>{numbered}.</span> : k && <span className="f-rp-wk__glyph" aria-hidden>{k.glyph}</span>}
      {k && <span className="f-sr">{k.word}: </span>}
      <span className="f-rp-wk__text">{it.text}</span>
      {it.source && <Link href={it.source.href} className="f-rp-wk__src">{it.source.label}<span className="f-sr"> · {it.text}</span></Link>}
    </li>
  );
}

export default function ReportsWeeklyScreen() {
  const demo = useDemo();
  const toast = useToast();
  const router = useRouter();
  const rv = WEEKLY_REVIEW;
  const titleId = useId();
  const leaveId = useId();
  const [summary, setSummary] = useState(rv.summary.text);
  const [editedBy, setEditedBy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rv.summary.text);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const dirty = editing && draft.trim() !== summary;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const guard = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!dirty) return;
    e.preventDefault();
    setLeaveTo(href);
  };

  const validate = (text: string) => {
    const t = text.trim();
    if (!t) return "התקציר לא יכול להיות ריק.";
    if (t.length < 40) return "התקציר קצר מדי — לפחות 40 תווים, כדי שיספר מה קרה השבוע.";
    if (t.length > 700) return `התקציר ארוך מדי (${t.length} תווים). עד 700.`;
    return null;
  };

  const applyEdit = () => {
    const err = validate(draft);
    setError(err);
    if (err) return false;
    const prev = { summary, editedBy };
    setSummary(draft.trim());
    setEditedBy(demo.viewer.name);
    setEditing(false);
    toast.push({ title: "התקציר עודכן", detail: "הסימון \"נוסח ב־AI\" הוחלף ב\"נערך\".", undo: { onUndo: () => { setSummary(prev.summary); setEditedBy(prev.editedBy); setDraft(prev.summary); } } });
    return true;
  };

  const save = () => {
    if (editing && dirty && !applyEdit()) return;
    if (editing && !dirty) setEditing(false);
    setSaved(true);
    toast.push({ title: `סקירה שבועית ${rv.week} נשמרה`, detail: "נשמרה כאן בלבד. שום דבר לא נשלח ללקוח.", undo: { onUndo: () => setSaved(false) } });
  };

  const copy = async () => {
    const text = [
      `סקירה שבועית · שבוע ${rv.week} · ${fmtDayMonth(rv.range.from)}–${fmtDayMonth(rv.range.to)}`, "", summary, "",
      ...rv.sections.flatMap((s) => [s.title, ...s.items.map((i) => `• ${i.text}`), ""]),
      "יעדים לשבוע הבא", ...rv.goals.map((g, i) => `${i + 1}. ${g.text}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.push({ title: "הסקירה הועתקה", detail: "אפשר להדביק במייל או במסמך." });
    } catch {
      toast.push({ kind: "error", title: "ההעתקה נכשלה", detail: "הדפדפן לא אפשר גישה ללוח. אפשר לסמן את הטקסט ולהעתיק ידנית." });
    }
  };

  const verify = (s: ReviewSection) => {
    setChecked((c) => ({ ...c, [s.id]: true }));
    toast.push({ title: `${s.title}: סומן כנבדק`, detail: `נבדק ע״י ${demo.viewer.name}.`, undo: { onUndo: () => setChecked((c) => ({ ...c, [s.id]: false })) } });
  };

  const section = (s: ReviewSection) => {
    const isChecked = s.basis === "ai" && checked[s.id];
    return (
      <section key={s.id} className="f-rp-wk__sec" aria-labelledby={`wk-${s.id}`}>
        <div className="f-rp-wk__sechead">
          <h3 id={`wk-${s.id}`} className="f-rp-wk__h3">{s.title}</h3>
          {s.basis === "ai" ? <OriginTag origin="ai_suggested" size="sm" /> : <VerificationTag state="verified" label="מקושר למקור" className="f-rp-wk__tag" />}
          {s.basis === "ai" && (isChecked
            ? <VerificationTag state="verified" label={`נבדק ע״י ${demo.viewer.name}`} className="f-rp-wk__tag" />
            : <><VerificationTag state={s.verification} className="f-rp-wk__tag" /><Button variant="link" className="f-rp-wk__verify" onClick={() => verify(s)}>סמן כנבדק</Button></>)}
        </div>
        <ul className="f-rp-wk__list">{s.items.map((it) => <Item key={it.id} it={it} />)}</ul>
      </section>
    );
  };

  return (
    <div className="f-focusmode f-rp-wk">
      <header className="f-rp-wkbar">
        <Link href={R.reports} onClick={guard(R.reports)} className="f-btn f-btn--neutral f-rp-wkbar__back"><span aria-hidden>→</span> דוחות</Link>
        <h1 id={titleId} className="f-rp-wkbar__title">סקירה שבועית · שבוע {rv.week} · <span className="f-num">{fmtDayMonth(rv.range.from)}–{fmtDayMonth(rv.range.to)}</span></h1>
        {saved
          ? <StateTag status="done">נשמרה ע״י {demo.viewer.name}</StateTag>
          : <ApprovalPill status="draft" size="sm" label={`טיוטה · נוצרה ${fmtWhen(rv.createdAt, demo.now)}`} />}
        <span className="f-grow" />
        <div className="f-rp-wkbar__actions">
          <Button variant="neutral" onClick={copy}>העתק</Button>
          <PlannedAction label="ייצא PDF" />
          <PlannedAction label="שתף" />
          <Button variant="primary" onClick={save}>שמור</Button>
        </div>
      </header>

      <div className="f-rp-wk__grid">
        <article className="f-panel f-rp-wk__doc" aria-labelledby={titleId}>
          <section className="f-rp-wk__sec" aria-labelledby="wk-summary">
            <div className="f-rp-wk__sechead">
              <h2 id="wk-summary" className="f-rp-wk__h2">תקציר מנהלים</h2>
              {editedBy ? <span className="f-rp-wk__edited">✎ נערך ע״י {editedBy}</span> : <OriginTag origin="ai_suggested" label={rv.summary.basis} />}
              {!editing && <Button variant="link" className="f-rp-wk__edit" onClick={() => { setDraft(summary); setError(null); setEditing(true); }}>ערוך</Button>}
            </div>
            {editing ? (
              <div className="f-rp-wk__editor">
                <TextAreaField
                  label="תקציר מנהלים" labelClassName="f-sr" value={draft} rows={5} required
                  onChange={(e) => { setDraft(e.target.value); if (error) setError(validate(e.target.value)); }}
                  help="בלי מספרים שלא מופיעים בנתונים למטה. 40–700 תווים."
                  error={error}
                />
                <div className="f-rp-wk__editbar">
                  <Button variant="secondary" size="sm" onClick={applyEdit}>עדכן תקציר</Button>
                  <Button variant="neutral" size="sm" onClick={() => { setEditing(false); setDraft(summary); setError(null); }}>ביטול</Button>
                </div>
              </div>
            ) : <p className="f-rp-wk__summary">{summary}</p>}
          </section>
          <div className="f-rp-wk__cols">{rv.sections.map(section)}</div>
          <section className="f-rp-wk__sec f-rp-wk__goals" aria-labelledby="wk-goals">
            <h2 id="wk-goals" className="f-rp-wk__h3">יעדים לשבוע הבא</h2>
            <ol className="f-rp-wk__list">{rv.goals.map((g, i) => <Item key={g.id} it={g} numbered={i + 1} />)}</ol>
          </section>
        </article>

        <aside className="f-rp-wk__aside" aria-label="על הסקירה">
          <section className="f-panel f-rp-wk__card" aria-labelledby="wk-how">
            <h2 id="wk-how" className="f-rp-wk__h3">איך הסקירה נבנתה</h2>
            {rv.method.map((m) => (
              <p key={m.badge} className="f-rp-wk__method">
                {m.badge === "data" ? <span className="f-rp-wk__databadge"><span aria-hidden>= </span>נתונים</span> : <OriginTag origin="ai_suggested" label="AI" size="sm" />}
                <span>{m.text}</span>
              </p>
            ))}
          </section>
          <section className="f-panel f-rp-wk__card" aria-labelledby="wk-missing">
            <h2 id="wk-missing" className="f-rp-wk__h3">חסר בסקירה</h2>
            <ul className="f-rp-wk__list f-rp-wk__list--sm">{rv.missing.map((m) => <Item key={m.id} it={m} />)}</ul>
          </section>
          <section className="f-panel f-rp-wk__card" aria-labelledby="wk-prev">
            <h2 id="wk-prev" className="f-rp-wk__h3">סקירות קודמות</h2>
            <ul className="f-rp-wk__list f-rp-wk__list--sm">
              {saved && <li className="f-rp-wk__item">שבוע {rv.week} · נשמרה ע״י {demo.viewer.name} · עכשיו</li>}
              {rv.previous.map((p) => <li key={p.week} className="f-rp-wk__item">שבוע {p.week} · נשמרה ע״י {personName(p.savedBy)} · <span className="f-num">{fmtDayMonth(p.savedAt)}</span></li>)}
            </ul>
          </section>
        </aside>
      </div>

      <Dialog open={leaveTo != null} onClose={() => setLeaveTo(null)} labelledBy={leaveId} className="f-rp-confirm">
        <div className="f-rp-confirm__body">
          <h2 id={leaveId} className="f-rp-confirm__title">לצאת בלי לשמור את התקציר?</h2>
          <p>השינויים בתקציר המנהלים עוד לא נשמרו. אם תצא עכשיו, הם יימחקו.</p>
        </div>
        <div className="f-rp-confirm__foot">
          <Button variant="primary" onClick={() => setLeaveTo(null)}>המשך לערוך</Button>
          <Button variant="neutral" onClick={() => { const to = leaveTo; setEditing(false); setLeaveTo(null); if (to) router.push(to); }}>צא בלי לשמור</Button>
        </div>
      </Dialog>
    </div>
  );
}
