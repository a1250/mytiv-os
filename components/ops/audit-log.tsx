import { listOpsAudit, type AuditActionView } from '@/lib/db/queries/ops-audit';
import type { TaskSnapshot } from '@/lib/ops-snapshot';
import { RollbackButton } from './rollback-button';

const day = (ms: number | null) => (ms === null ? 'none' : new Date(ms).toISOString().slice(0, 10));
function describe(s: TaskSnapshot) {
  return `status ${s.status ?? 'none'} · owners ${s.assigneeIds.length ? s.assigneeIds.join(',') : 'none'} · due ${day(s.dueDate)}`;
}
function outcome(a: AuditActionView) {
  const last = [...a.events].reverse().find((e) => e.event !== 'confirmed' && e.event !== 'rolled_back');
  if (!last) return 'claimed — outcome not recorded';
  if (last.event === 'failed_or_unknown') return `failed_or_unknown (${String(last.detail.phase ?? '')})`;
  return last.event;
}
/** Eligible = the write itself said so at claim time, it succeeded with both states, and nobody reversed it yet. */
function canRollBack(a: AuditActionView) {
  const confirmed = a.events.find((e) => e.event === 'confirmed');
  const success = a.events.find((e) => e.event === 'succeeded');
  return confirmed?.detail.rollback_eligibility === 'eligible' && !!success?.detail.pre_state && !!success?.detail.post_state && !a.events.some((e) => e.event === 'rolled_back');
}

export async function AuditLog({ businessSlug, businessId, projectId, canWrite }: { businessSlug: string; businessId: string; projectId: string; canWrite: boolean }) {
  let rows: AuditActionView[];
  try { rows = await listOpsAudit(businessId, projectId); }
  catch { return <p className="text-warning mt-6 text-xs">היסטוריית האישורים אינה זמינה. יש לבדוק את חיבור מסד הנתונים והתקנת העדכון.</p>; }
  return <details className="border-border mt-6 rounded-xl border p-4" dir="rtl"><summary className="cursor-pointer text-sm font-medium">היסטוריית אישורי ביצוע</summary>
    <p className="text-muted-foreground my-3 text-xs">50 הפעולות האחרונות. פעולה ללא תוצאה סופית דורשת בדיקה ב־ClickUp לפני ניסיון נוסף. שחזור מחזיר משימה למצב שלפני הפעולה — רק אם לא השתנתה מאז.</p>
    {rows.length ? <ul className="space-y-2">{rows.map((r) => {
      const success = r.events.find((e) => e.event === 'succeeded');
      const pre = success?.detail.pre_state as TaskSnapshot | undefined, post = success?.detail.post_state as TaskSnapshot | undefined;
      const rolledBack = r.events.find((e) => e.event === 'rolled_back');
      return <li key={r.id} className="border-border border-b pb-2 text-xs">
        <p>{r.action} · {outcome(r)} · {r.confirmedAt.toISOString()}{rolledBack ? ` · rolled back ${rolledBack.at.toISOString()}` : ''}</p>
        {pre && post && <p className="text-muted-foreground" dir="ltr">before: {describe(pre)}<br />after: {describe(post)}</p>}
        <p className="text-muted-foreground break-all">Request: {r.requestId} · Actor: {r.actor}</p>
        {canWrite && canRollBack(r) && <RollbackButton businessSlug={businessSlug} projectId={projectId} actionId={r.id} />}
      </li>;
    })}</ul> : <p className="text-muted-foreground text-sm">טרם נרשמו אישורים בגרסה זו.</p>}
  </details>;
}
