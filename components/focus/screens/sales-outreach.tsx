"use client";

import Link from "@/components/focus/ui/link";
import { useEffect, useRef, useState } from "react";
import type { OutreachPurpose, OutreachTone } from "@/lib/focus/contracts/sales";
import { OUTREACH } from "@/lib/focus/fixtures/sales";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { claimIssues, dateIssues, FactCheckList, HighlightEditor, type Issue } from "@/components/focus/patterns/sales/outreach-parts";
import { SalesDialog } from "@/components/focus/patterns/sales/sales-parts";
import { saveOutreach, useSales, type SalesState } from "@/components/focus/patterns/sales/sales-store";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Banner, SkeletonCard } from "@/components/focus/ui/feedback";
import { ReadOnlyValue, TextField } from "@/components/focus/ui/field";
import { Bdi } from "@/components/focus/ui/misc";
import { OriginTag, PlannedTag, SystemLine, VerificationTag } from "@/components/focus/ui/status";
import { Chips } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Outreach with fact check (handoff F4). The draft is fully editable; claims without a source and a weekday that does
 * not match its date are marked in the text and listed with fixes. Purpose and tone rebuild an untouched draft at once;
 * "נסח מחדש" is a background job with undo. Nothing is sent from here: creating the Gmail draft is planned, so the
 * review dialog offers copying the text and saving it here instead.
 */
const o = OUTREACH;
const compose = (p: OutreachPurpose, t: OutreachTone) => `${o.greetings[t]}\n\n${o.bodies[p]}\n\n${o.closings[t]}`;

export default function SalesOutreachScreen() {
  const { hydrated } = useDemo();
  const sales = useSales();
  if (!hydrated) {
    return (
      <div className="f-sl-out" role="status" aria-busy="true">
        <span className="f-sr">טוען את הטיוטה…</span>
        <SkeletonCard lines={6} /><SkeletonCard lines={10} /><SkeletonCard lines={5} />
      </div>
    );
  }
  return <Outreach saved={sales.outreach} />;
}

function Outreach({ saved }: { saved: SalesState["outreach"] }) {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const [purpose, setPurpose] = useState<OutreachPurpose>((saved?.purpose as OutreachPurpose) ?? o.defaults.purpose);
  const [tone, setTone] = useState<OutreachTone>((saved?.tone as OutreachTone) ?? o.defaults.tone);
  const [subject, setSubject] = useState(saved?.subject ?? o.subjects[o.defaults.purpose]);
  const [text, setText] = useState(saved?.body ?? compose(o.defaults.purpose, o.defaults.tone));
  const [generated, setGenerated] = useState(() => compose(o.defaults.purpose, o.defaults.tone));
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [review, setReview] = useState(false);

  const issues: Issue[] = [...claimIssues(text, o.claims), ...dateIssues(text, now)];
  const verified = o.verified.filter((v) => text.includes(v.quote));
  const edited = text !== generated;
  const isSaved = !!saved && saved.body === text && saved.subject === subject;
  const step = issues.length > 0 ? 2 : isSaved ? o.steps.length : 4;

  // redraft = background job; the new text replaces the draft only when the job settled (undo restores it)
  const jobId = "outreach-redraft";
  const job = state.jobs.find((j) => j.id === jobId);
  const redrafting = !!job && jobStatus(job, state.clock).state === "running";
  const jobsRef = useRef(state.jobs);
  useEffect(() => { jobsRef.current = state.jobs; }, [state.jobs]);

  /** leaving asks first only when there is text that is neither saved here nor the untouched generated draft */
  const dirty = !isSaved && (text !== generated || subject !== o.subjects[purpose]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const pick = (p: OutreachPurpose, t: OutreachTone) => {
    setPurpose(p); setTone(t);
    if (!edited) { const next = compose(p, t); setText(next); setGenerated(next); setSubject(o.subjects[p]); }
  };

  const redraft = () => {
    const prev = { text, subject, generated };
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    const j = demo.startJob({ id: jobId, kind: "ai_directions", label: "בודק ומנסח מחדש את הפנייה", detail: "לפי המטרה והטון שבחרת.", durationMs: o.redraftMs, outcome: fail ? "failure" : "success", href: R.outreach });
    window.setTimeout(() => {
      const cur = jobsRef.current.find((x) => x.id === j.id && x.startedAt === j.startedAt);
      if (!cur || cur.cancelledAt) return;
      if (cur.outcome === "failure") { toast.push({ kind: "error", title: "הניסוח מחדש נכשל", detail: "הטיוטה שלך לא השתנתה. אפשר לנסות שוב." }); return; }
      const next = compose(purpose, tone);
      setText(next); setGenerated(next); setSubject(o.subjects[purpose]);
      toast.push({ title: "הטיוטה נוסחה מחדש", detail: "הבדיקה רצה שוב על הטקסט החדש.", undo: { onUndo: () => { setText(prev.text); setSubject(prev.subject); setGenerated(prev.generated); } } });
    }, o.redraftMs + 80);
  };

  const fix = (issue: Issue, apply: (t: string) => string, label: string) => {
    const prev = text;
    setText(apply(text));
    toast.push({ title: `תוקן: ${label}`, detail: issue.title, undo: { onUndo: () => setText(prev) } });
  };

  const save = () => {
    if (!subject.trim()) { setSubjectError("חסר נושא למייל."); return; }
    const prev = saved;
    saveOutreach({ subject: subject.trim(), body: text, purpose, tone });
    toast.push({ title: "נשמר כטיוטה כאן", detail: "לא נשלח דבר. אפשר לחזור ולערוך.", undo: { onUndo: () => saveOutreach(prev) } });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${text}`);
      toast.push({ title: "הטקסט הועתק", detail: "הדבק אותו בטיוטה חדשה ב־Gmail. לא נשלח דבר." });
    } catch {
      toast.push({ kind: "error", title: "ההעתקה לא הצליחה", detail: "הדפדפן חסם גישה ללוח. סמן את הטקסט והעתק ידנית." });
    }
  };

  return (
    <div className="f-sl-out">
      <div className="f-sl-out__setup">
        <span className="f-sl-crumb"><Link href={R.sales} className="f-sl-crumb__a">מכירות</Link> <span aria-hidden>›</span> פניות יזומות <span aria-hidden>›</span> חדשה</span>
        <h1 className="f-sl-out__h">פנייה חדשה</h1>
        <section className="f-sl-panel f-sl-out__card" aria-label="הגדרות הפנייה">
          <ReadOnlyValue label="למי" why="מתוך הליד">{o.to.name} · {o.to.company}</ReadOnlyValue>
          <div className="f-field">
            <span className="f-field__label">מטרת הפנייה</span>
            <Chips label="מטרת הפנייה" soft value={purpose} onChange={(p) => pick(p, tone)} items={o.purposes} className="f-sl-out__purpose" />
          </div>
          <div className="f-field">
            <span className="f-field__label">טון</span>
            <Chips label="טון" value={tone} onChange={(t) => pick(purpose, t)} items={o.tones} className="f-sl-segchips" />
          </div>
          {edited && <span className="f-field__help">ערכת את הטיוטה, ולכן שינוי מטרה או טון לא מחליף אותה. ״נסח מחדש״ יחיל אותם (אפשר לבטל).</span>}
        </section>
        <ol className="f-sl-steps" aria-label="שלבים">
          {o.steps.map((s, i) => (
            <li key={s} className={cx("f-sl-steps__i", i < step && "f-sl-steps__i--done", i === step && "f-sl-steps__i--current")} aria-current={i === step ? "step" : undefined}>
              {i + 1} · {s}{i < step && <> <span aria-hidden>✓</span><span className="f-sr"> הושלם</span></>}
            </li>
          ))}
        </ol>
      </div>

      <section className="f-sl-panel f-sl-out__draft" aria-labelledby="sl-draft-h" aria-busy={redrafting || undefined}>
        <div className="f-sl-out__dhead">
          <h2 id="sl-draft-h" className="f-sl-panel__h">טיוטה</h2>
          <OriginTag origin="ai_edited" label="נוסח בעזרת AI · ניתן לעריכה מלאה" size="sm" />
          <Button variant="neutral" size="sm" onClick={redraft} loading={redrafting} loadingLabel="מנסח…">נסח מחדש</Button>
        </div>
        <div className="f-sl-out__dbody">
          {redrafting && <SystemLine status="processing">מנסח מחדש לפי &quot;{o.purposes.find((p) => p.key === purpose)?.label}&quot; בטון {o.tones.find((t) => t.key === tone)?.label}. הטיוטה הנוכחית נשמרת עד שיסתיים.</SystemLine>}
          <div className="f-sl-out__to"><span className="f-meta">אל</span><Bdi>{o.to.email}</Bdi></div>
          <TextField label="נושא" className="f-sl-out__subject" labelClassName="f-sl-out__lbl" value={subject} error={subjectError} maxLength={120}
            onChange={(e) => { setSubject(e.target.value); setSubjectError(null); }} readOnly={redrafting} />
          <label htmlFor="sl-body" className="f-sr">גוף המייל</label>
          <HighlightEditor id="sl-body" value={text} onChange={setText} issues={issues} verified={verified.map((v) => v.quote)} readOnly={redrafting} describedBy="sl-facts-h" />
        </div>
        <div className="f-sl-out__foot">
          <Button variant="primary" onClick={() => setReview(true)} aria-haspopup="dialog">צור טיוטה ב־Gmail</Button>
          <Button variant="neutral" onClick={save} disabled={isSaved}>{isSaved ? "נשמר כאן ✓" : "שמור כטיוטה כאן"}</Button>
          <span className="f-grow" />
          <span className="f-meta-sm">שום דבר לא נשלח. השליחה נעשית מ־Gmail.</span>
        </div>
      </section>

      <div className="f-sl-out__side">
        <FactCheckList issues={issues} onFix={fix} />
        <section className="f-sl-panel f-sl-side" aria-labelledby="sl-basis-h">
          <h2 id="sl-basis-h" className="f-sl-panel__h f-sl-panel__h--sm">על מה הטיוטה הסתמכה</h2>
          <ul className="f-sl-basis">
            {o.basis.map((b) => <li key={b.text}><VerificationTag state={b.verification} /> {b.text}</li>)}
          </ul>
          <span className="f-meta">{o.noUse}</span>
        </section>
      </div>

      <SalesDialog open={review} onClose={() => setReview(false)} id="sl-gmail" title={<>טיוטה ב־Gmail <PlannedTag /></>}
        actions={<>
          <Button variant="primary" onClick={copy}>העתק את הטקסט</Button>
          <Button variant="neutral" onClick={() => { save(); setReview(false); }} disabled={isSaved}>שמור כטיוטה כאן</Button>
          <Button variant="quiet" onClick={() => setReview(false)}>חזור לעריכה</Button>
        </>}>
        {issues.length > 0 && <Banner kind="warning" title={`${issues.length === 1 ? "פרט אחד" : `${issues.length} פרטים`} עדיין לא נבדקו`} detail="מומלץ לתקן לפני שהטקסט יוצא מכאן." />}
        <dl className="f-sl-dlg__dl">
          <dt>אל</dt><dd><Bdi>{o.to.email}</Bdi></dd>
          <dt>נושא</dt><dd>{subject || "—"}</dd>
        </dl>
        <p className="f-sl-out__preview">{text}</p>
        <p className="f-sl-dlg__note"><b>מתוכנן:</b> יצירת הטיוטה ישירות בתיבת ה־Gmail שלך. עד שהחיבור יהיה זמין לא נוצר דבר ב־Gmail ולא נשלח דבר. בינתיים: העתק את הטקסט או שמור אותו כאן.</p>
      </SalesDialog>
    </div>
  );
}
