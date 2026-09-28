import 'server-only';
import { getFolderLists, getTask, getTaskEvidence } from './clickup';
import { OpsPolicyError, assertClosure } from './ops-policy';
import type { ClientFolder } from './ops-config';

/** Fresh list membership, never a browser task id or cached board as authority. */
export async function requireScopedTask(folder: ClientFolder | null, taskId: string) {
  if (!folder || !/^[a-zA-Z0-9_-]{1,100}$/.test(taskId)) throw new OpsPolicyError('not_found', 404);
  const lists = await getFolderLists(folder);
  const task = await getTask(taskId);
  const list = lists.find((l) => l.id === task.list?.id);
  if (!list) throw new OpsPolicyError('not_found', 404);
  return { task, list };
}
/** `scoped` lets a caller that already did the fresh scoped read pass it in instead of fetching twice. */
export async function requireStatusEvidence(folder: ClientFolder | null, taskId: string, status: string, input: Record<string, unknown>, scoped?: Awaited<ReturnType<typeof requireScopedTask>>) {
  const { list } = scoped ?? await requireScopedTask(folder, taskId);
  const type = list.statusTypes[status];
  if (!type || type === 'unknown') throw new OpsPolicyError('invalid_or_unknown_status');
  if (['done', 'closed'].includes(type)) {
    const evidence = await getTaskEvidence(taskId);
    assertClosure(type, input.evidence_url, input.evidence_reviewed, evidence.recordings);
  }
}
