"use client";

import Link from "@/components/focus/ui/link";
import { useEffect, useRef } from "react";
import type { ExternalAction } from "@/lib/focus/contracts/approvals";
import type { ExecState } from "@/lib/focus/state/execution";
import { canExecute } from "@/lib/focus/state/execution";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Banner } from "@/components/focus/ui/feedback";
import { Checkbox } from "@/components/focus/ui/field";
import { Bdi } from "@/components/focus/ui/misc";

/**
 * "סיכום לפני ביצוע" (handoff §6.7, prototype flow 6) — the only place a red button exists. Extra checks are listed,
 * the action is locked until the confirmation box is ticked, "sending" waits for the target system, and "sent" is
 * shown only after it confirmed. A failure says what was kept and offers retry. Pure view over ExecState.
 */
export function StepTrail({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="f-steps" aria-label="שלבים">
      {steps.map((s, i) => (
        <li key={s} className={cx("f-steps__item", i < current && "f-steps__item--done", i === current && "f-steps__item--current")} aria-current={i === current ? "step" : undefined}>
          {i > 0 && <span className="f-steps__sep" aria-hidden>—</span>}
          <span className="f-steps__label">{i < current ? "✓ " : ""}<span className="f-steps__n">{i + 1} </span><span className="f-steps__of">שלב {i + 1} מתוך {steps.length} · </span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function PreExecSummary({
  action, title, context, impact, state, onToggle, onSubmit, onRetry, backHref, activityHref, nextHref, mobile, headingLevel = 1,
}: {
  action: ExternalAction; title: string; context: string; impact: string; state: ExecState;
  onToggle: () => void; onSubmit: () => void; onRetry: () => void; backHref: string; activityHref: string; nextHref: string | null; mobile?: boolean;
  headingLevel?: 1 | 2;
}) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.step === "sent" || state.step === "failed") resultRef.current?.focus(); }, [state.step]);
  const step = state.step === "summary" ? 1 : 2;
  const sending = state.step === "sending";
  const locked = state.step !== "summary";
  return (
    <section className={cx("f-pre", mobile && "f-pre--sheet")} aria-labelledby="pre-title">
      <div className="f-pre__trail">
        <StepTrail steps={["בדיקה", "סיכום סופי", action.target.label === "Gmail" ? "שליחה" : "ביצוע"]} current={state.step === "sent" ? 3 : step} />
        <Link href={backHref} className="f-pre__cancel">✕ ביטול</Link>
      </div>
      <div className="f-pre__body">
        <div className="f-pre__head">
          <span className="f-pre__ctx">{context}</span>
          <H id="pre-title" className="f-pre__title">{title}</H>
        </div>
        <div className="f-pre__risk" role="note">
          <span className="f-pre__risk-glyph" aria-hidden>▲</span>
          <div className="f-pre__risk-text">
            <b>סיכון גבוה: פעולה חיצונית שלא ניתן לבטל</b>
            <span>{impact}</span>
          </div>
        </div>
        <dl className="f-pre__table">
          <div className="f-pre__row"><dt>נמענת</dt><dd>{action.recipient.name} · <Bdi>{action.recipient.address}</Bdi></dd></div>
          <div className="f-pre__row f-pre__row--center">
            <dt>מה יישלח</dt>
            <dd className="f-pre__payload">
              {action.payload.attachment === "pdf" && <span className="f-pre__pdf" aria-hidden>PDF</span>}
              <span className="f-pre__ptext"><b>{action.payload.title}</b><span className="f-meta">{action.payload.detail}</span></span>
            </dd>
          </div>
          <div className="f-pre__row f-pre__row--via"><dt>דרך</dt><dd>{action.target.label} · מהחשבון <Bdi>{action.from}</Bdi></dd></div>
          <div className="f-pre__row"><dt>אחרי השליחה</dt><dd>{action.after}</dd></div>
        </dl>
        <ul className="f-pre__checks" aria-label="בדיקות לפני ביצוע">
          {action.checks.map((c) => (
            <li key={c.id} className={cx("f-pre__check", `f-pre__check--${c.tone}`)}>
              <span aria-hidden>{c.tone === "ok" ? "✓" : "◆"}</span> {c.text}{c.link && <> · <Link href={c.link} className="f-pre__checklink">הצג טקסט</Link></>}
            </li>
          ))}
        </ul>
        <Checkbox checked={state.step !== "summary" || state.confirmed} onChange={onToggle} disabled={locked} className="f-pre__confirm" aria-describedby={state.step === "summary" && state.attempted ? "pre-confirm-err" : undefined}>
          {action.confirmText}
        </Checkbox>
        {state.step === "summary" && state.attempted && !state.confirmed && (
          <span id="pre-confirm-err" className="f-field__error" role="alert"><span aria-hidden>!</span>יש לסמן את תיבת האישור לפני השליחה.</span>
        )}
      </div>

      <div className="f-pre__foot" ref={resultRef} tabIndex={-1}>
        {state.step === "sent" ? (
          <div className="f-pre__result" role="status">
            <Banner kind="done" title={`${action.successTitle}`} detail={action.successDetail} />
            <div className="f-pre__actions">
              {nextHref && <Link href={nextHref} className="f-btn f-btn--primary f-btn--lg">לאישור הבא ←</Link>}
              <Link href={activityHref} className="f-btn f-btn--neutral">פתח ביומן הפעולות</Link>
            </div>
          </div>
        ) : state.step === "failed" ? (
          <div className="f-pre__result">
            <Banner kind="error" title={action.failureTitle} detail={state.message} />
            <div className="f-pre__actions">
              <Button variant="danger" onClick={onRetry}>נסה שוב לשלוח</Button>
              <Link href={backHref} className="f-btn f-btn--neutral">חזור לבדיקה</Link>
            </div>
          </div>
        ) : (
          <div className="f-pre__actions">
            <Button
              variant="danger"
              className="f-pre__final"
              loading={sending}
              loadingLabel={action.pendingLabel}
              aria-disabled={!canExecute(state) && !sending ? true : undefined}
              onClick={() => { if (!sending) onSubmit(); }}
            >
              {action.finalLabel}
            </Button>
            {!sending && <Link href={backHref} className="f-btn f-btn--neutral f-pre__back">חזור לבדיקה</Link>}
            <span className="f-grow" />
            <span className="f-pre__note" role={sending ? "status" : undefined}>
              {state.step === "summary" && !state.confirmed ? "יש לסמן את תיבת האישור. " : ""}{sending ? `ממתין לאישור מ־${action.target.label}. דבר עדיין לא סומן כנשלח.` : action.pendingNote}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
