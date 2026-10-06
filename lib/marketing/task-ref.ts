import type { PlanItem } from './contract';
import type { WorkRef } from '../work-source/types';

/**
 * The execution item a marketing plan item points at, as a provider-neutral ref. Today's C1 artifacts
 * carry only `clickupTaskId`; they are append-only and stay valid as they are. A future contract version
 * adds a neutral `taskRef` beside it (Mytiv Work PR 14) — this is the single place that will read both.
 */
export function planItemTaskRef(item: Pick<PlanItem, 'clickupTaskId'>): WorkRef | null {
  return item.clickupTaskId ? { provider: 'clickup', id: item.clickupTaskId } : null;
}
