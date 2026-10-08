"use client";

import type { Readiness, ReadinessDimension, ReadinessState } from "@/lib/focus/contracts/plan";
import { READINESS_DIM_WORD, READINESS_OVERALL_WORD, READINESS_STATE_WORD } from "@/lib/focus/state/plan";
import { cx } from "@/components/focus/ui/cx";

/**
 * Campaign Readiness (spec §8): eight dimensions, each READY / WAITING / MISSING / BLOCKED / UNKNOWN with the reason in
 * words, one overall status, exactly one next action and at most two blockers. Derived — it never changes the move's
 * lifecycle. The state is always a word next to its glyph (never colour only). UNKNOWN tracking reads as a risk.
 */
const DIMS: ReadinessDimension[] = ["strategy", "targeting", "budget", "copy", "creative", "landing", "tracking", "approval"];
const GLYPH: Record<ReadinessState, string> = { ready: "✓", waiting: "◔", missing: "○", blocked: "■", unknown: "?" };

export function ReadinessPanel({ r, id }: { r: Readiness; id?: string }) {
  return (
    <section id={id} className="f-pl-ready" aria-labelledby={`${id ?? "ready"}-h`}>
      <div className="f-pl-ready__head">
        <h2 id={`${id ?? "ready"}-h`} className="f-pl-h3">מוכנות המהלך</h2>
        <span className={cx("f-pl-chip", `f-pl-chip--ready-${r.overall}`)}>{READINESS_OVERALL_WORD[r.overall]}{r.overall === "waiting_approval" && r.approver ? ` — ${r.approver}` : ""}</span>
      </div>
      <ul className="f-pl-ready__dims">
        {DIMS.map((k) => {
          const d = r.dims[k];
          return (
            <li key={k} className={cx("f-pl-ready__dim", `f-pl-ready__dim--${d.state}`)}>
              <span className="f-pl-ready__glyph" aria-hidden>{GLYPH[d.state]}</span>
              <span className="f-pl-ready__name">{READINESS_DIM_WORD[k]}</span>
              <span className="f-pl-ready__state">{READINESS_STATE_WORD[d.state]}{d.state === "waiting" && d.actor ? ` · ${d.actor}` : ""}{k === "tracking" && d.state === "unknown" ? " · סיכון" : ""}</span>
              <span className="f-pl-ready__text">{d.text}</span>
            </li>
          );
        })}
      </ul>
      {r.blockers.length > 0 && (
        <div className="f-pl-note f-pl-note--red f-pl-ready__block" role="status">
          <b>חוסם{r.blockers.length > 1 ? "ים" : ""}:</b> {r.blockers.join(" · ")}
        </div>
      )}
      <div className="f-pl-ready__next">
        <span className="f-pl-label">הפעולה הבאה</span>
        <span><b>{r.next.label}</b> <span className="f-pl-meta">· {r.next.actor}</span></span>
      </div>
      {r.trackingRisk && <p className="f-pl-meta f-pl-ready__risk">המעקב לא נבדק ב־V1 (אין חיבור). זה לא חוסם בדיקה, אבל האישור דורש הכרה בסיכון.</p>}
    </section>
  );
}

/** The one-line form for a row (Moves, Overview): the overall status and the next action. */
export function ReadinessLine({ r }: { r: Readiness }) {
  return (
    <span className="f-pl-ready__line">
      <span className={cx("f-pl-chip", "f-pl-chip--sm", `f-pl-chip--ready-${r.overall}`)}>{READINESS_OVERALL_WORD[r.overall]}{r.overall === "waiting_approval" && r.approver ? ` — ${r.approver}` : ""}</span>
      <span className="f-pl-meta">{r.next.label}</span>
    </span>
  );
}
