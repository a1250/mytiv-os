import { listOpsAudit, type AuditActionView } from '@/lib/db/queries/ops-audit';
import type { TaskSnapshot } from '@/lib/ops-snapshot';
import { canRollBack, describeSnapshot as describe, outcome } from '@/lib/ops-audit-view';
import { RollbackButton } from './rollback-button';

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
      return <li key={r.id} data-action-id={r.id} className="border-border border-b pb-2 text-xs">
        <p>{r.action} · {outcome(r)} · {r.confirmedAt.toISOString()}{rolledBack ? ` · rolled back ${rolledBack.at.toISOString()}` : ''}</p>
        {pre && post && <p className="text-muted-foreground" dir="ltr">before: {describe(pre)}<br />after: {describe(post)}</p>}
        <p className="text-muted-foreground break-all">Request: {r.requestId} · Actor: {r.actor}</p>
        {canWrite && canRollBack(r) && <RollbackButton businessSlug={businessSlug} projectId={projectId} actionId={r.id} />}
      </li>;
    })}</ul> : <p className="text-muted-foreground text-sm">טרם נרשמו אישורים בגרסה זו.</p>}
  </details>;
}
