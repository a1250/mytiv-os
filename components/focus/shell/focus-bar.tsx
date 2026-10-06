import Link from "@/components/focus/ui/link";
import type { ReactNode } from "react";
import { SegmentProgress } from "@/components/focus/ui/misc";

/**
 * Focus-mode bar (handoff D5–D7, E3–E7): replaces the global nav while one thing is being handled.
 * "Exit" is always available; what was decided is kept, what was not stays in the queue.
 */
export function FocusBar({
  exitHref, exitLabel = "צא ממצב פוקוס", exitGlyph = "✕", progress, center, end, skipHref, skipLabel = "דלג לבא ←",
}: {
  exitHref: string; exitLabel?: string; exitGlyph?: string;
  progress?: { index: number; total: number; done: number; label: string };
  center?: ReactNode; end?: ReactNode; skipHref?: string | null; skipLabel?: string;
}) {
  return (
    <div className="f-focusbar" role="banner">
      <Link href={exitHref} className="f-focusbar__exit" aria-label={exitLabel}>
        <span aria-hidden className="f-focusbar__glyph">{exitGlyph}</span><span aria-hidden className="f-focusbar__back">→</span><span className="f-focusbar__exit-text">&nbsp;{exitLabel}</span>
      </Link>
      {center}
      {progress && (
        <>
          <span className="f-focusbar__spacer" />
          <div className="f-focusbar__progress">
            <span>{progress.label} {progress.index + 1} מתוך {progress.total}</span>
            <SegmentProgress small total={progress.total} done={progress.done} current={progress.index} label={`טופלו ${progress.done} מתוך ${progress.total}`} />
          </div>
          <span className="f-focusbar__spacer" />
        </>
      )}
      {end}
      {skipHref && <Link href={skipHref} className="f-focusbar__skip f-hit">{skipLabel}</Link>}
    </div>
  );
}
