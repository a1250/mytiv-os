"use client";

import type { ActiveTimer } from "@/lib/focus/contracts/work";
import { fmtDuration } from "@/lib/focus/format";
import { elapsedOf } from "@/lib/focus/state/work";
import { Icon } from "@/components/focus/ui/icon";
import { useToast } from "@/components/focus/ui/toast";
import { cx } from "@/components/focus/ui/cx";
import { useDemo, useTicker } from "./demo-store";

/**
 * TimerBar (Mytiv Work contract): `{ activeTimer, onPause, onResume, onStop }`. Pure view — `TimerBarView`;
 * `TimerBar` connects it to the demo store (localStorage today → POST /work/timers in pkg1).
 * `inline` = the rounded bar inside "היום שלי"; `fixed` = the persistent bar on Mytiv Work screens.
 */
export function TimerBarView({
  activeTimer, elapsedMs, onPause, onResume, onStop, variant = "fixed", note,
}: {
  activeTimer: ActiveTimer | null; elapsedMs: number; onPause: () => void; onResume: () => void; onStop: () => void;
  variant?: "fixed" | "inline"; note?: string;
}) {
  if (!activeTimer) return null;
  const running = activeTimer.running;
  return (
    <section className={cx("f-timerbar", `f-timerbar--${variant}`)} aria-label="טיימר פעיל">
      <button type="button" className={cx("f-timerbar__toggle", !running && "f-timerbar__toggle--paused")} onClick={running ? onPause : onResume} aria-label={running ? "השהה טיימר" : "המשך טיימר"}>
        <Icon name={running ? "pause" : "play"} size={variant === "inline" ? 14 : 16} />
      </button>
      <div className="f-timerbar__text">
        <b className="f-timerbar__title">{variant === "inline" ? `טיימר ${running ? "פעיל" : "מושהה"} · ${activeTimer.title}` : activeTimer.title}</b>
        <span className="f-timerbar__ctx">{activeTimer.context}</span>
      </div>
      <span className="f-timerbar__clock f-mono" dir="ltr" role="timer" aria-label={`זמן שנמדד ${fmtDuration(elapsedMs)}`}>{fmtDuration(elapsedMs)}</span>
      <span className="f-timerbar__spacer" />
      {note && <span className="f-timerbar__note">{note}</span>}
      <button type="button" className="f-timerbar__stop" onClick={onStop}>עצור ושמור</button>
    </section>
  );
}

export function TimerBar({ variant = "fixed", note }: { variant?: "fixed" | "inline"; note?: string }) {
  const { state, hydrated, timerPause, timerResume, timerStop, timerRestore } = useDemo();
  const toast = useToast();
  const t = state.timer;
  const now = useTicker(!!t?.running && hydrated, 1000);
  if (!t) return null;
  const elapsed = hydrated ? elapsedOf(t, now) : t.elapsedMs;
  return (
    <TimerBarView
      activeTimer={t}
      elapsedMs={elapsed}
      variant={variant}
      note={note}
      onPause={timerPause}
      onResume={timerResume}
      onStop={() => {
        const r = timerStop();
        if (r) toast.push({ title: `נרשמו ${r.minutes} דק׳ על "${r.stopped.title}"`, detail: "נוסף לדוח השעות.", undo: { onUndo: () => timerRestore({ ...r.stopped, elapsedMs: elapsedOf(r.stopped, Date.now()), running: false }, r.task) } });
      }}
    />
  );
}
