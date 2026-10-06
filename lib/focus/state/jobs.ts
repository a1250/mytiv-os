/**
 * Long-running work ("מצבי מעבד", prototype flows 1, 2, 4, 7): AI generation, syncs, reconnects. A job shows what is
 * happening, the user may leave the screen (a notification arrives when ready), and a failure keeps what was saved.
 * Pure: the store ticks `now`; status is derived, so it survives navigation and reloads.
 */
export type JobKind = "ai_directions" | "ai_improve" | "ai_check" | "sync_clickup" | "schedule_meta" | "send_mail" | "reminder" | "reconnect" | "refresh_sources";

export type Job = {
  id: string;
  kind: JobKind;
  label: string;              // "יוצר 3 כיוונים לסטורי"
  detail: string;             // "אפשר לעזוב את המסך. נשלח התראה כשמוכן."
  startedAt: number;
  durationMs: number;
  outcome: "success" | "failure";
  cancelledAt?: number;
  /**
   * The page closed while this job talked to an external system (send / schedule): whether the action happened there
   * is unknown. Set on reload for EXTERNAL_JOB_KINDS only; the status is then failed + unknown, never done.
   */
  interruptedAt?: number;
  /** step labels shown as a timeline while running */
  steps?: string[];
  href?: string;              // where the result lives
};

export type JobStatus =
  | { state: "running"; progress: number; step: number }
  | { state: "done"; at: number }
  /** `unknown`: interrupted before the target answered — check there before trying again */
  | { state: "failed"; at: number; unknown?: true }
  | { state: "cancelled"; at: number };

/** Jobs whose effect happens outside Mytiv (a mail sent, a post scheduled at Meta, a ClickUp sync) — an interruption leaves them unknown. */
export const EXTERNAL_JOB_KINDS: readonly JobKind[] = ["send_mail", "schedule_meta", "sync_clickup"];

/**
 * A sync job belongs to one write: `sync-<taskId>@<the version that write produced>`. A task shows a sync state only
 * for its current version — a later write that started no sync never inherits an earlier "synced".
 */
export const syncJobId = (taskId: string, version: string) => `sync-${taskId}@${version}`;

export function jobStatus(j: Job, now: number): JobStatus {
  if (j.cancelledAt) return { state: "cancelled", at: j.cancelledAt };
  if (j.interruptedAt) return { state: "failed", at: j.interruptedAt, unknown: true };
  const end = j.startedAt + j.durationMs;
  if (now >= end) return j.outcome === "success" ? { state: "done", at: end } : { state: "failed", at: end };
  const progress = Math.min(0.99, Math.max(0, (now - j.startedAt) / j.durationMs));
  const steps = j.steps?.length ?? 1;
  return { state: "running", progress, step: Math.min(steps - 1, Math.floor(progress * steps)) };
}


/**
 * On reload: an external job still running has an unknown outcome (the page that waited for the answer is gone).
 * Internal jobs keep running on the clock as before.
 */
export function interruptExternal(jobs: Job[], now: number): Job[] {
  return jobs.map((j) => (!j.cancelledAt && !j.interruptedAt && EXTERNAL_JOB_KINDS.includes(j.kind) && jobStatus(j, now).state === "running" ? { ...j, interruptedAt: now } : j));
}
