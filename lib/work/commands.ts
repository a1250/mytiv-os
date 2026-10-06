import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { canonicalize } from "@/lib/marketing/artifacts";

/**
 * Mytiv Work writes (plan PR 6). Every write runs in one DB function (migrations 0013, 0015): authorization re-checked in the
 * DB, the request id recorded in `work_requests` (an exact replay returns the recorded result; a different payload or
 * actor reusing it is refused), the version checked under a row lock — a stale version changes nothing and comes
 * back as a conflict — and every Work rule enforced there. Nothing here writes a table directly.
 */
export type WorkScope = { businessId: string; userId: string };
export type WriteOutcome = { ok: true; taskId: string; version: number; replayed?: boolean } | { ok: false; conflict: true; version: number };

/** A refusal raised by a work_* function: `work:<code>` with an optional JSON detail. */
export class WorkRefusal extends Error {
  constructor(public code: string, public detail: unknown, public status: number) { super(code); }
}

const STATUS: Record<string, number> = {
  not_member: 404, not_found: 404, project_not_found: 404, parent_not_found: 404, dependency_not_found: 404,
  forbidden: 403, request_conflict: 409, blocked_by_dependency: 409, open_children: 409, parent_done: 409,
  dependency_cycle: 409, cross_project_dependency_not_supported: 422, cross_project_parent_not_supported: 422,
};

/** Finds `work:<code>` in an error from the driver (drizzle wraps it as `cause`), or returns null. */
export function workRefusalOf(e: unknown): WorkRefusal | null {
  for (let cur: unknown = e, i = 0; cur && i < 5; cur = (cur as { cause?: unknown }).cause, i++) {
    const msg = (cur as { message?: unknown }).message;
    const m = typeof msg === "string" ? /^work:([a-z_]+)/.exec(msg) : null;
    if (m) {
      const raw = (cur as { detail?: unknown }).detail;
      let detail: unknown = undefined;
      if (typeof raw === "string" && raw) { try { detail = JSON.parse(raw); } catch { detail = undefined; } }
      return new WorkRefusal(m[1], detail, STATUS[m[1]] ?? 400);
    }
  }
  return null;
}

/** The ledger key of a request: what was asked, canonically (key order never matters). */
export function payloadHash(operation: string, payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize({ operation, payload }))).digest("hex");
}

async function call(query: ReturnType<typeof sql>): Promise<Record<string, unknown>> {
  try {
    const res = await db.execute(query);
    const row = (res as unknown as { rows: Record<string, unknown>[] }).rows[0];
    const value = Object.values(row ?? {})[0];
    return (typeof value === "string" ? JSON.parse(value) : value) as Record<string, unknown>;
  } catch (e) {
    throw workRefusalOf(e) ?? e;
  }
}

const outcome = (r: Record<string, unknown>): WriteOutcome =>
  r.ok === true
    ? { ok: true, taskId: String(r.taskId), version: Number(r.version), ...(r.replayed ? { replayed: true } : {}) }
    : { ok: false, conflict: true, version: Number(r.version) };

export type CreateFields = {
  title: string; notes?: string; statusKey?: string; priority?: string; ownerUserId?: string | null; projectId?: string | null;
  parentId?: string | null; startOn?: string | null; dueOn?: string | null; estimateMinutes?: number | null; nextAction?: string | null;
};

export async function createWorkTask(scope: WorkScope, requestId: string, fields: CreateFields): Promise<WriteOutcome> {
  const hash = payloadHash("create", fields);
  return outcome(await call(sql`select work_create_task(${scope.businessId}::uuid, ${scope.userId}::uuid, ${requestId}::uuid, ${hash}, ${JSON.stringify(fields)}::jsonb) as r`));
}

export type UpdatePatch = Partial<{
  title: string; notes: string; priority: string; ownerUserId: string | null; startOn: string | null; dueOn: string | null;
  estimateMinutes: number | null; nextAction: string | null; followUpOn: string | null; statusKey: string;
  block: { reason: string }; unblock: true; addDependency: string; removeDependency: string; addParticipant: string; removeParticipant: string;
}>;

export async function updateWorkTask(scope: WorkScope, requestId: string, taskId: string, expectedVersion: number, patch: UpdatePatch): Promise<WriteOutcome> {
  const hash = payloadHash("update", { taskId, expectedVersion, patch });
  return outcome(await call(sql`select work_update_task(${scope.businessId}::uuid, ${scope.userId}::uuid, ${requestId}::uuid, ${hash}, ${taskId}::uuid, ${expectedVersion}::int, ${JSON.stringify(patch)}::jsonb) as r`));
}

/** A comment on a task (work_add_comment, 0015): any active member; ledgered; the task's version is unchanged. */
export async function addWorkComment(scope: WorkScope, requestId: string, taskId: string, body: string): Promise<WriteOutcome> {
  const hash = payloadHash("comment", { taskId, body });
  return outcome(await call(sql`select work_add_comment(${scope.businessId}::uuid, ${scope.userId}::uuid, ${requestId}::uuid, ${hash}, ${taskId}::uuid, ${JSON.stringify(body)}::jsonb) as r`));
}

/** The actor's own time on a task (work_log_time, 0015): 1..1440 minutes per entry; ledgered; version unchanged. */
export async function logWorkTime(scope: WorkScope, requestId: string, taskId: string, minutes: number, startedAt: string, source: "timer" | "manual"): Promise<WriteOutcome> {
  const hash = payloadHash("log_time", { taskId, minutes, startedAt, source });
  return outcome(await call(sql`select work_log_time(${scope.businessId}::uuid, ${scope.userId}::uuid, ${requestId}::uuid, ${hash}, ${taskId}::uuid, ${minutes}::int, ${startedAt}::timestamptz, ${source}) as r`));
}
