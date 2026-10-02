"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { DecisionCheck, DecisionOutcome } from "@/lib/focus/contracts/approvals";
import type { RiskLevel } from "@/lib/focus/contracts/status";
import { reasonRequired } from "@/lib/focus/state/approvals";
import { plainShortcut } from "@/lib/focus/state/keyboard";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";

/**
 * Decision block (handoff §6.7, prototype flow 3). The reason is mandatory from medium risk up — trying to approve
 * without it shows the error in place of the help text, moves focus to the field and records nothing. After a decision
 * the block shows what was recorded, its undo (while reversible) and the way to the next item.
 */
export type DecisionResult = { outcome: DecisionOutcome; reason: string; at: string; undoable: boolean };

const OUTCOME_TEXT: Record<Exclude<DecisionOutcome, "defer">, { glyph: string; text: string; tone: "ok" | "changes" | "no" }> = {
  approve: { glyph: "✓", text: "אושר", tone: "ok" },
  request_changes: { glyph: "↺", text: "נשלח לתיקון", tone: "changes" },
  reject: { glyph: "✕", text: "נדחה", tone: "no" },
};

export function DecisionBlock({
  risk, hint, onDecide, result, onUndo, nextHref, deferHref, labels, managerNote, compactActions, onDirtyChange,
}: {
  risk: RiskLevel; hint?: string; onDecide: (o: DecisionOutcome, reason: string) => DecisionCheck;
  result: DecisionResult | null; onUndo: () => void; nextHref: string | null; deferHref: string;
  labels?: Partial<Record<DecisionOutcome, string>>; managerNote?: string; compactActions?: boolean;
  /** a typed reason that was not recorded yet counts as unsaved */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const nextRef = useRef<HTMLAnchorElement>(null);
  const id = useId();
  const required = reasonRequired(risk, "approve");

  useEffect(() => { if (result) nextRef.current?.focus(); }, [result]);
  useEffect(() => { onDirtyChange?.(!result && reason.trim().length > 0); }, [reason, result, onDirtyChange]);

  // keyboard: A = approve, R = request changes (never while typing). A on medium+ still demands the reason.
  const decideRef = useRef<(o: DecisionOutcome) => void>(() => {});
  useEffect(() => {
    if (result) return;
    const onKey = (e: KeyboardEvent) => {
      if (plainShortcut(e, ["a", "A"])) { e.preventDefault(); decideRef.current("approve"); }
      if (plainShortcut(e, ["r", "R"])) { e.preventDefault(); decideRef.current("request_changes"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result]);

  const decide = (o: DecisionOutcome) => {
    const r = onDecide(o, reason);
    if (!r.ok) { setError(r.error); field.current?.focus(); return; }
    setError(null);
  };
  useEffect(() => { decideRef.current = decide; });

  if (result && result.outcome !== "defer") {
    const t = OUTCOME_TEXT[result.outcome];
    return (
      <div className="f-decision f-decision--done" role="status">
        <b className={cx("f-decision__result", `f-decision__result--${t.tone}`)}><span aria-hidden>{t.glyph}</span> {t.text} · נשמר {result.at}</b>
        {result.reason && <span className="f-decision__reason">נימוק: {result.reason}</span>}
        <div className="f-decision__actions">
          {nextHref ? <Link ref={nextRef} href={nextHref} className="f-btn f-btn--primary f-btn--lg">לאישור הבא ←</Link> : <Link ref={nextRef} href="/focus" className="f-btn f-btn--primary f-btn--lg">סיימת את התור · חזור להיום שלי</Link>}
          {result.undoable && <Button variant="neutral" onClick={onUndo}>בטל החלטה</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="f-decision">
      <label htmlFor={`${id}-r`} className="f-decision__label">
        נימוק <span className="f-decision__note">{required ? "(חובה בסיכון בינוני ומעלה)" : "(רשות · חובה בבקשת תיקון או דחייה)"}</span>
      </label>
      <textarea
        ref={field}
        id={`${id}-r`}
        rows={1}
        className="f-input f-decision__input"
        value={reason}
        aria-invalid={error ? true : undefined}
        aria-required={required}
        aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
        placeholder={required ? "למשל: בתוקף עד 31.10" : undefined}
        onChange={(e) => { setReason(e.target.value); if (error) setError(null); }}
      />
      {error ? <span id={`${id}-e`} className="f-field__error" role="alert"><span aria-hidden>!</span>{error}</span>
        : hint ? <span id={`${id}-h`} className="f-field__help">{hint}</span> : null}
      {managerNote && <span className="f-field__help">למנהל: {managerNote}</span>}
      <div className={cx("f-decision__actions", compactActions && "f-decision__actions--grid")}>
        <Button variant="primary" className="f-decision__approve" onClick={() => decide("approve")} aria-keyshortcuts="A">{labels?.approve ?? "אשר"}</Button>
        <Button variant="secondary" className="f-decision__btn" onClick={() => decide("request_changes")} aria-keyshortcuts="R">{labels?.request_changes ?? "בקש שינוי"}</Button>
        <Button variant="neutral" className="f-decision__btn" onClick={() => decide("reject")}>{labels?.reject ?? "דחה"}</Button>
        <span className="f-grow" />
        <Link href={deferHref} className="f-decision__defer">{labels?.defer ?? "שמור להמשך"}</Link>
      </div>
    </div>
  );
}
