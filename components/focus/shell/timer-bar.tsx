"use client";

import type { ActiveTimer } from "@/lib/focus/contracts/work";
import { fmtDuration } from "@/lib/focus/format";
import { canDo, elapsedOf } from "@/lib/focus/state/work";
import { CAPABILITIES } from "@/lib/focus/fixtures/work";
import { Icon } from "@/components/focus/ui/icon";
import { useToast } from "@/components/focus/ui/toast";
import { cx } from "@/components/focus/ui/cx";
import { useDemo, useTicker } from "./demo-store";
import { useTimerStopUndo } from "./task-actions";
import { useIsDemo } from "./scope";

/**
 * TimerBar (Mytiv Work contract): `{ activeTimer, onPause, onResume, onStop }`. Pure view — `TimerBarView`;
 * `TimerBar` connects it to the demo store (localStorage today → POST /work/timers in pkg1).
 * `inline` = the rounded bar inside "היום שלי"; `fixed` = the persistent bar on Mytiv Work screens.
 */
export function TimerBarView({
  activeTimer, elapsedMs, onPause, onResume, onStop, variant = "fixed", note,
}: {
  /** without the handlers the bar is read-only (a role that may not track time sees the timer, not its controls) */
  activeTimer: ActiveTimer | null; elapsedMs: number; onPause?: () => void; onResume?: () => void; onStop?: () => void;
  variant?: "fixed" | "inline"; note?: string;
}) {
  if (!activeTimer) return null;
  const running = activeTimer.running;
  return (
    <section className={cx("f-timerbar", `f-timerbar--${variant}`)} aria-label="טיימר פעיל">
      {onPause && onResume && (
        <button type="button" className={cx("f-timerbar__toggle", !running && "f-timerbar__toggle--paused")} onClick={running ? onPause : onResume} aria-label={running ? "השהה טיימר" : "המשך טיימר"}>
          <Icon name={running ? "pause" : "play"} size={variant === "inline" ? 14 : 16} />
        </button>
      )}
      <div className="f-timerbar__text">
        <b className="f-timerbar__title">{variant === "inline" ? `טיימר ${running ? "פעיל" : "מושהה"} · ${activeTimer.title}` : activeTimer.title}</b>
        <span className="f-timerbar__ctx">{activeTimer.context}</span>
      </div>
      <span className="f-timerbar__clock f-mono" dir="ltr" role="timer" aria-label={`זמן שנמדד ${fmtDuration(elapsedMs)}`}>{fmtDuration(elapsedMs)}</span>
      <span className="f-timerbar__spacer" />
      {note && <span className="f-timerbar__note">{note}</span>}
      {onStop && <button type="button" className="f-timerbar__stop" onClick={onStop}>עצור ושמור</button>}
    </section>
  );
}

export function TimerBar({ variant = "fixed", note }: { variant?: "fixed" | "inline"; note?: string }) {
  const { state, hydrated, timerPause, timerResume, timerStop } = useDemo();
  const toast = useToast();
  const stopUndo = useTimerStopUndo();
  const isDemo = useIsDemo();
  const t = state.timer;
  // stopping logs time on the timer's task: role + that task's source capability (planned = demo only)
  const timerTask = t ? state.tasks.find((x) => x.id === t.taskId) : undefined;
  const allowed = canDo(state.role, "trackTime", timerTask ? CAPABILITIES[timerTask.source] : undefined, isDemo);
  const now = useTicker(!!t?.running && hydrated, 1000);
  if (!t) return null;
  const elapsed = hydrated ? elapsedOf(t, now) : t.elapsedMs;
  return (
    <TimerBarView
      activeTimer={t}
      elapsedMs={elapsed}
      variant={variant}
      note={note}
      onPause={allowed ? timerPause : undefined}
      onResume={allowed ? timerResume : undefined}
      onStop={allowed ? () => {
        const r = timerStop();
        if (!r) return;
        if (r.orphan) { toast.push({ kind: "error", title: "הטיימר נעצר בלי לרשום זמן", detail: "המשימה שלו כבר לא קיימת." }); return; }
        if (r.minutes > 0 && !r.write?.ok) { toast.push({ kind: "error", title: "הטיימר נעצר, אבל הזמן לא נרשם", detail: r.write && "refused" in r.write ? r.write.refused : "המשימה עודכנה בינתיים." }); return; }
        // undo: the logged minutes come off through the versioned undo; the timer resumes paused at its stop time
        const planned = timerTask && CAPABILITIES[timerTask.source].trackTime === "planned" ? " · יכולת מתוכננת — בהדגמה בלבד" : "";
        toast.push({ title: r.minutes > 0 ? `נרשמו ${r.minutes} דק׳ על "${r.stopped.title}"` : "הטיימר נעצר", detail: r.minutes > 0 ? `נוסף לדוח השעות${planned}.` : "פחות מחצי דקה — לא נרשם זמן.", undo: { onUndo: stopUndo(r) } });
      } : undefined}
    />
  );
}
