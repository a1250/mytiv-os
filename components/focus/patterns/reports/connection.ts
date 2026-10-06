"use client";

import { jobStatus, type Job, type JobStatus } from "@/lib/focus/state/jobs";
import { useDemo, useTicker } from "@/components/focus/shell/demo-store";

/**
 * Connection jobs (G6, G4): the Instagram reconnect is a demo-store job, so its result survives navigation and is read
 * by every screen that depends on the connection (the activity log's "נסה שוב" succeeds only after a reconnect).
 */
export const RECONNECT_ID = "reconnect-instagram";

/** Status of a job by id, re-rendering while it runs; null when it never ran or was cancelled. */
export function useJob(id: string): { job: Job; status: JobStatus } | null {
  const { state } = useDemo();
  const job = state.jobs.find((j) => j.id === id && !j.cancelledAt) ?? null;
  const first = job ? jobStatus(job, state.clock) : null;
  const tick = useTicker(first?.state === "running", 200);
  if (!job) return null;
  return { job, status: jobStatus(job, Math.max(state.clock, tick)) };
}

/** True once a reconnect job has settled successfully. */
export function useInstagramConnected() {
  const r = useJob(RECONNECT_ID);
  return r?.status.state === "done";
}
