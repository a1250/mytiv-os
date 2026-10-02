/**
 * Long-running work ("מצבי מעבד", prototype flows 1, 2, 4, 7): AI generation, syncs, reconnects. A job shows what is
 * happening, the user may leave the screen (a notification arrives when ready), and a failure keeps what was saved.
 * Pure: the store ticks `now`; status is derived, so it survives navigation and reloads.
 */
export type JobKind = "ai_directions" | "sync_clickup" | "schedule_meta" | "reconnect";

export type Job = {
  id: string;
  kind: JobKind;
  label: string;              // "יוצר 3 כיוונים לסטורי"
  detail: string;             // "אפשר לעזוב את המסך. נשלח התראה כשמוכן."
  startedAt: number;
  durationMs: number;
  outcome: "success" | "failure";
  cancelledAt?: number;
  /** step labels shown as a timeline while running */
  steps?: string[];
  href?: string;              // where the result lives
};

export type JobStatus =
  | { state: "running"; progress: number; step: number }
  | { state: "done"; at: number }
  | { state: "failed"; at: number }
  | { state: "cancelled"; at: number };

export function jobStatus(j: Job, now: number): JobStatus {
  if (j.cancelledAt) return { state: "cancelled", at: j.cancelledAt };
  const end = j.startedAt + j.durationMs;
  if (now >= end) return j.outcome === "success" ? { state: "done", at: end } : { state: "failed", at: end };
  const progress = Math.min(0.99, Math.max(0, (now - j.startedAt) / j.durationMs));
  const steps = j.steps?.length ?? 1;
  return { state: "running", progress, step: Math.min(steps - 1, Math.floor(progress * steps)) };
}

export const isSettled = (s: JobStatus) => s.state !== "running";
