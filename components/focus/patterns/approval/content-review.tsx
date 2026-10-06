"use client";

import Link from "@/components/focus/ui/link";
import { useEffect, useId, useRef, useState } from "react";
import type { ContentUnderReview, DecisionCheck, DecisionOutcome } from "@/lib/focus/contracts/approvals";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import type { DecisionResult } from "./decision-block";
import { R } from "@/lib/focus/routes";

/**
 * Content review side panel (handoff D7, prototype flow 5). Two modes: decide (approve / request changes / reject) and
 * request-changes, where the reviewer's notes are pinned to parts of the design and a general reason is mandatory.
 */
export function ContentReviewPanel({
  content, hint, onDecide, result, onUndo, nextHref, onCommentOnly, onDirtyChange,
}: {
  content: ContentUnderReview; hint?: string; onDecide: (o: DecisionOutcome, reason: string) => DecisionCheck;
  result: DecisionResult | null; onUndo: () => void; nextHref: string | null;
  /** save the notes without deciding (the item stays in the queue) */
  onCommentOnly: (notes: number) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [mode, setMode] = useState<"decide" | "changes">(content.annotations.length ? "changes" : "decide");
  const [reason, setReason] = useState(content.draftReason);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(content.annotations);
  const field = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  useEffect(() => { onDirtyChange?.(!result && mode === "changes" && (reason !== content.draftReason || notes.length !== content.annotations.length)); }, [reason, notes, mode, result, content, onDirtyChange]);

  const decide = (o: DecisionOutcome) => {
    const r = onDecide(o, o === "approve" ? "" : reason);
    if (!r.ok) { setError(r.error); field.current?.focus(); }
  };

  if (result && result.outcome !== "defer") {
    const done = result.outcome === "approve" ? { g: "✓", t: "אושר", d: "הפריט ממתין לתזמון." } : result.outcome === "request_changes" ? { g: "↺", t: "נשלח לתיקון", d: "הפריט עבר לדנה כ\"נדרש תיקון\" עם ההערות. גרסה 2 נשמרה." } : { g: "✕", t: "נדחה", d: "" };
    return (
      <section className="f-panel f-review f-review--done" role="status" aria-label="תוצאת הבדיקה">
        <b className="f-review__result"><span aria-hidden>{done.g}</span> {done.t} · {result.at}</b>
        {done.d && <span className="f-meta">{done.d}</span>}
        {result.reason && <span className="f-review__reason">נימוק: {result.reason}</span>}
        <div className="f-review__actions">
          {nextHref ? <Link href={nextHref} className="f-btn f-btn--primary">לאישור הבא ←</Link> : <Link href={R.today} className="f-btn f-btn--primary">חזור להיום שלי</Link>}
          {result.undoable && <Button variant="neutral" onClick={onUndo}>בטל</Button>}
        </div>
      </section>
    );
  }

  if (mode === "decide") {
    return (
      <section className="f-panel f-review" aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`} className="f-review__h">ההחלטה שלך</h2>
        <p className="f-meta">סיכון נמוך: אפשר לאשר בלי נימוק. בקשת תיקון או דחייה דורשות נימוק.</p>
        <div className="f-review__actions">
          <Button variant="primary" size="lg" onClick={() => decide("approve")}>אשר</Button>
          <Button variant="secondary" size="lg" onClick={() => setMode("changes")}>בקש תיקון</Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="f-panel f-review f-review--active" aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`} className="f-review__h">בקשת תיקון</h2>
        <ol className="f-review__notes">
          {notes.map((n) => (
            <li key={n.id} className="f-review__note">
              <span className="f-review__pin" aria-hidden>{n.n}</span>
              <span className="f-review__notebody">
                <span className="f-review__target">על: {n.target}</span>
                <span className="f-review__text">{n.text}</span>
              </span>
              <button type="button" className="f-review__rm" aria-label={`הסר הערה ${n.n}`} onClick={() => setNotes((xs) => xs.filter((x) => x.id !== n.id))}>✕</button>
            </li>
          ))}
        </ol>
        <label htmlFor={`${id}-r`} className="f-field__label">נימוק כללי <span className="f-field__label-note">(חובה)</span></label>
        <textarea
          ref={field} id={`${id}-r`} rows={1} className="f-input f-review__input" value={reason} aria-required aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : `${id}-hint`} onChange={(e) => { setReason(e.target.value); setError(null); }}
        />
        {error ? <span id={`${id}-e`} className="f-field__error" role="alert"><span aria-hidden>!</span>{error}</span> : <span id={`${id}-hint`} className="f-field__help">{hint}</span>}
        <div className="f-review__actions">
          <Button variant="primary" size="lg" onClick={() => decide("request_changes")}>שלח לתיקון</Button>
          <Button variant="neutral" className="f-review__cancel" onClick={() => { setMode("decide"); setError(null); }}>ביטול</Button>
        </div>
      </section>
      <div className={cx("f-review__or")}>
        או: <button type="button" className="f-review__alt" onClick={() => decide("approve")}>אשר בכל זאת</button> · <button type="button" className="f-review__alt" onClick={() => decide("reject")}>דחה</button> · <button type="button" className="f-review__alt" onClick={() => onCommentOnly(notes.length)}>הוסף הערה בלבד</button>
      </div>
    </>
  );
}
