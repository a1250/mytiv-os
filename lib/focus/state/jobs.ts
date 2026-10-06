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
  /** the external thing this job acts on (`gmail:<thread>`, `meta:<approval>`): every attempt on it is gated together */
  target?: string;
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


/** Is the job still running right now (for callbacks outside render, e.g. a click handler). */
export const runningNow = (j: Job | undefined): boolean => !!j && !j.cancelledAt && jobStatus(j, Date.now()).state === "running";

/**
 * On reload: an external job still running has an unknown outcome (the page that waited for the answer is gone).
 * Internal jobs keep running on the clock as before.
 */
export function interruptExternal(jobs: Job[], now: number): Job[] {
  return jobs.map((j) => (!j.cancelledAt && !j.interruptedAt && EXTERNAL_JOB_KINDS.includes(j.kind) && jobStatus(j, now).state === "running" ? { ...j, interruptedAt: now } : j));
}

/* ---------- external attempts: one invariant for every entry point ---------- */

export const gmailTarget = (threadId: string) => `gmail:${threadId}`;
export const metaTarget = (approvalId: string) => `meta:${approvalId}`;

/** What the user must state before a new attempt after an UNKNOWN outcome — that the target shows no earlier attempt. */
export const TARGET_CHECK = {
  gmail: "בדקתי בתיקיית נשלח ב־Gmail וההודעה הקודמת לא נשלחה",
  meta: "בדקתי ב־Meta Business Suite והתזמון הקודם לא קיים",
} as const;

export type ExternalGate =
  | { ok: true }
  | { ok: false; reason: "in_flight" | "already_done" }
  | { ok: false; reason: "needs_target_check"; unknownJobId: string };

/**
 * May a new external attempt on `target` start now? Decided from the jobs themselves (persisted), not from UI state:
 * - an attempt still running, or one the target confirmed (sent / scheduled), blocks every new attempt;
 * - if the latest attempt's outcome is UNKNOWN (interrupted before the target answered), a new attempt needs the
 *   user's explicit statement that they checked the target and the earlier attempt did not happen — given for THAT
 *   attempt (`attestedUnknownJobId`). The statement is consumed by the attempt it unlocks: once that attempt exists
 *   it is the latest, so an older statement unlocks nothing;
 * - after a confirmed failure the ordinary retry applies.
 * Cancelled attempts (an undone schedule) do not count.
 */
export function externalGate(jobs: Job[], target: string, now: number, attestedUnknownJobId?: string): ExternalGate {
  const mine = jobs.filter((j) => j.target === target && !j.cancelledAt).sort((a, b) => a.startedAt - b.startedAt);
  const states = mine.map((j) => jobStatus(j, now));
  if (states.some((s) => s.state === "done")) return { ok: false, reason: "already_done" };
  const latest = mine.at(-1), st = states.at(-1);
  if (!latest || !st) return { ok: true };
  if (st.state === "running") return { ok: false, reason: "in_flight" };
  if (st.state === "failed" && st.unknown && attestedUnknownJobId !== latest.id) return { ok: false, reason: "needs_target_check", unknownJobId: latest.id };
  return { ok: true };
}

/**
 * The store's admission of a new external attempt (what `startExternal` runs): the gate decides; an admitted job
 * replaces any earlier job with the same id and becomes the latest attempt on its target.
 */
export function admitExternal(jobs: Job[], job: Job & { target: string }, attestedUnknownJobId?: string):
  { ok: true; jobs: Job[] } | { ok: false; gate: Exclude<ExternalGate, { ok: true }> } {
  const gate = externalGate(jobs, job.target, job.startedAt, attestedUnknownJobId);
  if (!gate.ok) return { ok: false, gate };
  return { ok: true, jobs: [...jobs.filter((x) => x.id !== job.id), job] };
}
