/**
 * What an audit record keeps of a ClickUp task before and after a governed write.
 *
 * Identifiers only. A snapshot lives in the append-only audit log for as long as the
 * business does, so it carries nothing a person wrote — no names, emails, descriptions or
 * comments. Enough to show "what was there before" and to compute the exact reverse write.
 */
import type { RawTask } from "./clickup";
import { OpsPolicyError } from "./ops-policy";

export type TaskSnapshot = {
  taskId: string;
  listId: string | null;
  status: string | null;
  assigneeIds: number[];
  /** Milliseconds since epoch, or null when the task has no due date. */
  dueDate: number | null;
  /** ClickUp's own change marker. Two reads with the same value saw the same task. */
  dateUpdated: string | null;
};

export type UpdatePatch = { status?: string; assignees?: { add?: number[]; rem?: number[] }; due_date?: number | null };

export function snapshotTask(raw: RawTask): TaskSnapshot {
  const due = raw.due_date == null || raw.due_date === "" ? null : Number(raw.due_date);
  return {
    taskId: raw.id,
    listId: raw.list?.id ?? null,
    status: raw.status?.status ?? null,
    assigneeIds: (raw.assignees ?? []).map((a) => a.id).filter((id) => Number.isSafeInteger(id)).sort((a, b) => a - b),
    dueDate: due !== null && Number.isFinite(due) ? due : null,
    dateUpdated: raw.date_updated == null ? null : String(raw.date_updated),
  };
}

/** True when the snapshot has the shape the audit log promises — guards data read back from jsonb. */
export function isTaskSnapshot(value: unknown): value is TaskSnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return typeof s.taskId === "string" && (s.status === null || typeof s.status === "string")
    && Array.isArray(s.assigneeIds) && s.assigneeIds.every((id) => Number.isSafeInteger(id))
    && (s.dueDate === null || typeof s.dueDate === "number") && (s.dateUpdated === null || typeof s.dateUpdated === "string");
}

/**
 * The write that takes a task from `post` back to `pre`. Only fields that actually differ are
 * included, so a rollback never touches what the original write did not. Returns null when
 * there is nothing to undo.
 */
export function reversePatch(pre: TaskSnapshot, post: TaskSnapshot): UpdatePatch | null {
  const patch: UpdatePatch = {};
  if (pre.status !== post.status && pre.status !== null) patch.status = pre.status;
  const add = pre.assigneeIds.filter((id) => !post.assigneeIds.includes(id));
  const rem = post.assigneeIds.filter((id) => !pre.assigneeIds.includes(id));
  if (add.length || rem.length) patch.assignees = { ...(add.length ? { add } : {}), ...(rem.length ? { rem } : {}) };
  if (pre.dueDate !== post.dueDate) patch.due_date = pre.dueDate;
  return Object.keys(patch).length ? patch : null;
}

/**
 * Refuses to proceed when the task is not the one the caller looked at. `expected` is the
 * `date_updated` the caller saw (from the board row, or from the audit post_state); the task
 * as it stands now must carry the same marker, or somebody's newer work would be overwritten.
 */
export function assertUnchanged(expected: string | null, current: RawTask, code = "task_changed_since_read"): void {
  const now = current.date_updated == null ? null : String(current.date_updated);
  if (expected !== now) throw new OpsPolicyError(code, 409);
}

/**
 * Which governed actions this system can reverse. Deterministic, recorded on every claim so
 * the audit log states the answer at write time rather than leaving it to be inferred later.
 * Creations are not reversible: there is no delete capability in this codebase, on purpose.
 */
export type RollbackEligibility = "eligible" | { not: "no_delete_capability" | "not_a_task_update" };
export function rollbackEligibility(action: string): RollbackEligibility {
  if (action === "update_task") return "eligible";
  if (["create_task", "add_comment", "add_decision"].includes(action)) return { not: "no_delete_capability" };
  return { not: "not_a_task_update" };
}
