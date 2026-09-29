import 'server-only';
import { ClickUpError, updateTask, type RawTask } from './clickup';
import { OpsPolicyError } from './ops-policy';
import { requireScopedTask } from './ops-access';
import type { ClientFolder } from './ops-config';
import { auditedAction, appendActionEvent, getOpsAction, listActionEvents } from './ops-audit';
import { openReconciliationOn } from './ops-reconciliation';
import { assertUnchanged, isTaskSnapshot, reversePatch, snapshotTask, type TaskSnapshot } from './ops-snapshot';

/**
 * Controlled reversal of one governed `update_task`.
 *
 * Human-only: this is not a copilot tool and cannot be proposed by the model. It is itself a
 * claimed, confirmed, audited action (`rollback_task`), so a rollback has the same receipts as
 * the write it undoes. Fail closed, in this order:
 *
 *   1. the action exists for THIS business and project (anything else is 404 — no ClickUp read)
 *   2. it is an update_task with a verified pre_state and post_state (a partial/unknown write has
 *      no verified post_state and is never auto-reversed)
 *   3. it has not been rolled back already
 *   4. the task still exists and is still in this project's folder
 *   5. the task is exactly as the original write left it (`date_updated` == post_state's) —
 *      anything newer, by anyone, means newer work that must not be overwritten
 *   6. the reverse write would not close the task (closing needs evidence, use the normal flow)
 *
 * Only then is the exact reverse patch written, through the same guarded `updateTask`, which
 * re-checks (5) at the instant of the write. There is no delete anywhere in this path.
 */
export type RollbackPlan = { taskId: string; pre: TaskSnapshot; post: TaskSnapshot; patch: NonNullable<ReturnType<typeof reversePatch>>; current: RawTask };

export async function planRollback(scope: { businessId: string }, projectId: string, folder: ClientFolder | null, actionId: string): Promise<RollbackPlan> {
  const action = await getOpsAction(scope.businessId, projectId, actionId);
  if (!action) throw new OpsPolicyError('not_found', 404);
  if (action.action !== 'update_task') throw new OpsPolicyError('rollback_unsupported_for_action');
  const events = await listActionEvents(scope.businessId, actionId);
  if (events.some((e) => e.event === 'rolled_back')) throw new OpsPolicyError('already_rolled_back', 409);
  const success = events.find((e) => e.event === 'succeeded');
  if (!success) throw new OpsPolicyError('outcome_unknown', 409);
  const detail = success.detail as { pre_state?: unknown; post_state?: unknown };
  if (!isTaskSnapshot(detail.pre_state) || !isTaskSnapshot(detail.post_state)) throw new OpsPolicyError('no_verified_states', 409);
  const { pre_state: pre, post_state: post } = detail;
  // MKT-GOV06: a later write to this task with an unknown outcome blocks the reverse write too.
  if (await openReconciliationOn(scope.businessId, { kind: 'task', id: pre.taskId })) throw new OpsPolicyError('reconciliation_pending', 409);
  let current: RawTask, list: Awaited<ReturnType<typeof requireScopedTask>>['list'];
  try { ({ task: current, list } = await requireScopedTask(folder, pre.taskId)); }
  catch (err) {
    if (err instanceof ClickUpError && err.status === 404) throw new OpsPolicyError('target_missing', 409);
    if (err instanceof OpsPolicyError && err.message === 'not_found') throw new OpsPolicyError('target_missing', 409);
    throw err;
  }
  assertUnchanged(post.dateUpdated, current, 'task_changed_since_action');
  const patch = reversePatch(pre, post);
  if (!patch) throw new OpsPolicyError('nothing_to_restore', 409);
  if (patch.status && ['done', 'closed'].includes(list.statusTypes[patch.status] ?? '')) throw new OpsPolicyError('rollback_would_close_task_use_normal_flow', 409);
  return { taskId: pre.taskId, pre, post, patch, current };
}

export async function executeRollback(scope: { businessId: string; userId: string }, projectId: string, folder: ClientFolder | null, actionId: string, requestId: string) {
  // Refusals are receipts too: the request is claimed first so a refused rollback leaves a record
  // and the same requestId can never be replayed into a different answer.
  return auditedAction(scope, projectId, requestId, 'rollback_task', { of: actionId },
    async (capture) => {
      let plan: RollbackPlan;
      try { plan = await planRollback(scope, projectId, folder, actionId); }
      catch (err) {
        if (err instanceof OpsPolicyError) return { ok: false as const, error: err.message, status: err.status, refused: true as const };
        throw err;
      }
      const { post } = await updateTask(plan.taskId, plan.patch, { expectedDateUpdated: plan.post.dateUpdated, onPre: (t) => capture.pre(snapshotTask(t)) });
      const restored = snapshotTask(post);
      capture.post(restored);
      capture.ref({ taskId: plan.taskId, url: post.url, date_updated: post.date_updated ?? null });
      await appendActionEvent(scope.businessId, actionId, 'rolled_back', { by_request_id: requestId, restored_to: plan.pre, restored_state: restored });
      return { ok: true as const, rolled_back: actionId, restored_to: plan.pre, restored_state: restored };
    },
    { target: { kind: 'action', id: actionId } });
}
