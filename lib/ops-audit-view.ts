// Pure derivations over the append-only Ops audit events (shared by the per-project log and the unified
// business audit page). No data access — unit-testable.
import type { AuditActionView } from './db/queries/ops-audit';
import type { TaskSnapshot } from './ops-snapshot';

const day = (ms: number | null) => (ms === null ? 'none' : new Date(ms).toISOString().slice(0, 10));
export function describeSnapshot(s: TaskSnapshot) {
  return `status ${s.status ?? 'none'} · owners ${s.assigneeIds.length ? s.assigneeIds.join(',') : 'none'} · due ${day(s.dueDate)}`;
}

/** The final outcome of an action: the last event that is neither the claim nor a later rollback. */
export function outcome(a: AuditActionView) {
  const last = [...a.events].reverse().find((e) => e.event !== 'confirmed' && e.event !== 'rolled_back' && e.event !== 'reconciled');
  if (!last) return 'claimed — outcome not recorded';
  if (last.event === 'failed_or_unknown') return `failed_or_unknown (${String(last.detail.phase ?? '')})`;
  const result = last.detail.result as { error?: unknown } | undefined;
  if (last.event === 'refused_before_write' || last.event === 'rejected_or_unknown') return `${last.event}${result?.error ? ` (${String(result.error)})` : ''}`;
  return last.event;
}

/** Eligible = the write itself said so at claim time, it succeeded with both states, and nobody reversed it yet. */
export function canRollBack(a: AuditActionView) {
  const confirmed = a.events.find((e) => e.event === 'confirmed');
  const success = a.events.find((e) => e.event === 'succeeded');
  return confirmed?.detail.rollback_eligibility === 'eligible' && !!success?.detail.pre_state && !!success?.detail.post_state && !a.events.some((e) => e.event === 'rolled_back');
}

/** Why an action did not happen, when it did not (refusal or failure), for the audit page. */
export function refusalReason(a: AuditActionView): string | null {
  const last = [...a.events].reverse().find((e) => e.event === 'refused_before_write' || e.event === 'rejected_or_unknown' || e.event === 'failed_or_unknown');
  if (!last) return null;
  const result = last.detail.result as { error?: unknown } | undefined;
  return String(result?.error ?? last.detail.error ?? last.detail.phase ?? last.event);
}

/** A short, secret-free summary of what a marketing write recorded (its result shape is known). */
export function resultSummary(a: AuditActionView): string | null {
  const success = a.events.find((e) => e.event === 'succeeded');
  const r = success?.detail.result as Record<string, unknown> | undefined;
  if (!r || typeof r !== 'object') return null;
  const parts = [r.kind, r.revision !== undefined ? `revision ${String(r.revision)}` : null, r.marketingBusiness, r.bindingVersion !== undefined ? `binding v${String(r.bindingVersion)}` : null,
    r.revoked === true ? 'revoked' : null, typeof r.id === 'string' ? `record ${r.id.slice(0, 8)}` : null].filter((x) => x !== null && x !== undefined && x !== '');
  return parts.length ? parts.map(String).join(' · ') : null;
}

const ACTION_LABELS: Record<string, string> = {
  update_task: 'עדכון משימה ב־ClickUp', create_task: 'יצירת משימה ב־ClickUp', add_comment: 'הוספת הערה ב־ClickUp', add_decision: 'הוספת החלטה ב־ClickUp',
  rollback_task: 'שחזור משימה', marketing_import: 'ייבוא תוכנית שיווק', marketing_bind: 'חיבור ל־Marketing OS', marketing_revoke: 'ניתוק מ־Marketing OS',
  marketing_artifact_import: 'ייבוא תוצר מהמנוע', marketing_record_decision: 'החלטת אישור', marketing_record_proposal: 'הצעת שינוי במוח העסק',
  marketing_record_evidence: 'ראיית פרסום', marketing_record_outcome: 'תוצאה מדודה', marketing_record_receipt: 'קבלת ביצוע',
};
export function actionLabel(action: string): string { return ACTION_LABELS[action] ?? action; }
