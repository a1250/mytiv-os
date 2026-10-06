"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { PublishPlan } from "@/lib/focus/contracts/marketing";
import { canExecute, type ExecState } from "@/lib/focus/state/execution";
import { StepTrail } from "@/components/focus/patterns/approval/pre-exec";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Banner } from "@/components/focus/ui/feedback";
import { Checkbox } from "@/components/focus/ui/field";

/**
 * Export & publish (handoff E7). `ContentTimeline` shows where a piece of content really is (נשמר → אושר → יוצא →
 * תוזמן → פורסם); a step is marked done only from real state. `MetaPublishConfirm` is the pre-execution summary for
 * the external Meta action (pattern of approval/pre-exec): extra checks, a confirmation box that unlocks the red final
 * button, "sending" while Meta answers, success only after Meta confirmed, and a failure that says what was kept.
 */
export type TimelineStep = { key: string; label: string; detail: ReactNode; state: "done" | "current" | "failed" | "todo" };

const STEP_WORD: Record<TimelineStep["state"], { glyph: string; word: string }> = {
  done: { glyph: "✓", word: "הושלם" },
  current: { glyph: "…", word: "בתהליך" },
  failed: { glyph: "!", word: "נכשל" },
  todo: { glyph: "", word: "טרם" },
};

export function ContentTimeline({ steps, label }: { steps: TimelineStep[]; label: string }) {
  return (
    <ol className="f-mk-tl" aria-label={label}>
      {steps.map((s) => (
        <li key={s.key} className={cx("f-mk-tl__step", `f-mk-tl__step--${s.state}`)} aria-current={s.state === "current" ? "step" : undefined}>
          <span className="f-mk-tl__dot" aria-hidden>{STEP_WORD[s.state].glyph}</span>
          <b className="f-mk-tl__label">{s.label}<span className="f-sr"> · {STEP_WORD[s.state].word}</span></b>
          <span className="f-mk-tl__detail">{s.detail}</span>
        </li>
      ))}
    </ol>
  );
}

export function MetaPublishConfirm({
  meta, title, context, rows, confirmText, state, onToggle, onSubmit, onRetry, onClose, targetCheck,
}: {
  meta: PublishPlan["meta"]; title: string; context: string; rows: { label: string; value: ReactNode }[]; confirmText: string;
  state: ExecState; onToggle: () => void; onSubmit: () => void; onClose: () => void;
  /** undefined: no retry here (the outcome is unknown — the next attempt starts over with the target check) */
  onRetry?: () => void;
  /** the earlier attempt's outcome is UNKNOWN: this statement is required before the new schedule */
  targetCheck?: { text: string; checked: boolean; onToggle: (v: boolean) => void; error: boolean };
}) {
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.step === "sent" || state.step === "failed") resultRef.current?.focus(); }, [state.step]);
  const sending = state.step === "sending";
  const locked = state.step !== "summary";
  return (
    <section className="f-mk-pre" aria-labelledby="mk-pre-title">
      <div className="f-mk-pre__trail">
        <StepTrail steps={["בדיקה", "סיכום סופי", "תזמון"]} current={state.step === "sent" ? 3 : state.step === "summary" ? 1 : 2} />
      </div>
      <div className="f-mk-pre__body">
        <span className="f-meta">{context}</span>
        <h2 id="mk-pre-title" className="f-mk-pre__title">{title}</h2>
        <div className="f-mk-pre__risk" role="note">
          <span className="f-mk-pre__risk-glyph" aria-hidden>▲</span>
          <span><b>סיכון גבוה: פעולה חיצונית ב־Meta</b><br />{meta.after}</span>
        </div>
        <dl className="f-mk-pre__table">
          {rows.map((r) => <div key={r.label} className="f-mk-pre__row"><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
        </dl>
        <ul className="f-mk-pre__checks" aria-label="בדיקות לפני תזמון">
          {meta.checks.map((c) => (
            <li key={c.id} className={cx("f-mk-pre__check", `f-mk-pre__check--${c.tone}`)}><span aria-hidden>{c.tone === "ok" ? "✓" : "◆"}</span> {c.text}</li>
          ))}
        </ul>
        <Checkbox checked={state.step !== "summary" || state.confirmed} onChange={onToggle} disabled={locked} aria-describedby={state.step === "summary" && state.attempted ? "mk-pre-err" : undefined}>
          {confirmText}
        </Checkbox>
        {targetCheck && (
          <>
            <p className="f-field__error" id="mk-pre-unknown"><span aria-hidden>!</span>לא ידוע אם התזמון הקודם נקלט ב־Meta. תזמון חדש אפשרי רק אחרי בדיקה שם.</p>
            <Checkbox checked={targetCheck.checked} onChange={targetCheck.onToggle} aria-describedby={targetCheck.error ? "mk-pre-check-err" : "mk-pre-unknown"}>{targetCheck.text}</Checkbox>
            {targetCheck.error && !targetCheck.checked && <span id="mk-pre-check-err" className="f-field__error" role="alert"><span aria-hidden>!</span>יש לבדוק ב־Meta Business Suite ולסמן שהתזמון הקודם לא קיים.</span>}
          </>
        )}
        {state.step === "summary" && state.attempted && !state.confirmed && (
          <span id="mk-pre-err" className="f-field__error" role="alert"><span aria-hidden>!</span>יש לסמן את תיבת האישור לפני התזמון.</span>
        )}
      </div>
      <div className="f-mk-pre__foot" ref={resultRef} tabIndex={-1}>
        {state.step === "sent" ? (
          <>
            <Banner kind="done" title={meta.successTitle} detail={meta.successDetail} />
            <div className="f-mk-pre__actions"><Button variant="primary" onClick={onClose}>סגור</Button></div>
          </>
        ) : state.step === "failed" ? (
          <>
            <Banner kind="error" title={meta.failureTitle} detail={state.message} />
            <div className="f-mk-pre__actions">
              {onRetry && <Button variant="danger" onClick={onRetry}>נסה שוב לתזמן</Button>}
              <Button variant="neutral" onClick={onClose}>סגור · התוכן נשאר טיוטה</Button>
            </div>
          </>
        ) : (
          <div className="f-mk-pre__actions">
            <Button variant="danger" loading={sending} loadingLabel={meta.pendingLabel} aria-disabled={!canExecute(state) && !sending ? true : undefined} onClick={() => { if (!sending) onSubmit(); }}>
              {meta.finalLabel}
            </Button>
            {!sending && <Button variant="neutral" onClick={onClose}>חזור לבדיקה</Button>}
            <span className="f-mk-pre__note" role={sending ? "status" : undefined}>
              {state.step === "summary" && !state.confirmed ? "יש לסמן את תיבת האישור. " : ""}{meta.pendingNote}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
