import type { AuditActionView } from '@/lib/db/queries/ops-audit';
import type { TaskSnapshot } from '@/lib/ops-snapshot';
import { actionLabel, canRollBack, describeSnapshot, isOpenReconciliation, outcome, refusalReason, resultSummary } from '@/lib/ops-audit-view';
import { ReconcileButton } from './reconcile-button';
import { RollbackButton } from './rollback-button';

export type BusinessAuditRow = AuditActionView & { projectId: string; projectName: string };

/**
 * M9 unified audit (T-11.1 · MKT-GOV02..04, GOV07): every governed write of the business — Ops (ClickUp) and
 * marketing — with actor, request, target project, outcome, before→after where the write captured it, the
 * refusal reason when it did not happen, and the rollback control where the write is eligible (writers only).
 * History is append-only; members can read it.
 */
export function UnifiedAudit({ businessSlug, rows, canWrite }: { businessSlug: string; rows: BusinessAuditRow[]; canWrite: boolean }) {
  if (!rows.length) return <p className="text-muted-foreground text-sm">טרם נרשמו פעולות מבוקרות בעסק.</p>;
  const open = rows.filter((r) => isOpenReconciliation(r.events));
  return <div className="space-y-4">
  {open.length > 0 && <section aria-labelledby="audit-open" className="border-warning/50 rounded-xl border p-3">
    <h2 id="audit-open" className="text-sm font-semibold">פריטי יישוב פתוחים ({open.length})</h2>
    <p className="text-muted-foreground text-xs">תוצאת הכתיבה לא אומתה. עד שתירשם קריאה חוזרת, כל כתיבה חדשה ליעד הזה נחסמת.</p>
    <ul className="mt-2 space-y-1 text-sm">{open.map((r) => <li key={r.id} data-open-item={r.id}>{actionLabel(r.action)} · {r.projectName} · <span dir="ltr">{r.requestId}</span>
      {canWrite && <> · <ReconcileButton businessSlug={businessSlug} projectId={r.projectId} actionId={r.id} /></>}</li>)}</ul>
  </section>}
  <ul className="space-y-3">{rows.map((r) => {
    const success = r.events.find((e) => e.event === 'succeeded');
    const pre = success?.detail.pre_state as TaskSnapshot | undefined, post = success?.detail.post_state as TaskSnapshot | undefined;
    const rolledBack = r.events.find((e) => e.event === 'rolled_back');
    const refusal = refusalReason(r);
    const summary = resultSummary(r);
    return <li key={r.id} data-action-id={r.id} className="bg-card border-border rounded-xl border p-3 text-sm">
      <p className="font-medium">{actionLabel(r.action)} · {r.projectName}</p>
      <p className="text-muted-foreground text-xs">{outcome(r)} · {r.confirmedAt.toISOString().slice(0, 16).replace('T', ' ')}{rolledBack ? ` · שוחזר ${rolledBack.at.toISOString().slice(0, 10)}` : ''}</p>
      {pre && post && <p className="text-muted-foreground mt-1 text-xs" dir="ltr">before: {describeSnapshot(pre)}<br />after: {describeSnapshot(post)}</p>}
      {summary && <p className="text-muted-foreground mt-1 text-xs" dir="ltr">{summary}</p>}
      {refusal && <p className="text-warning mt-1 text-xs">סיבה: <span dir="ltr">{refusal}</span></p>}
      <p className="text-muted-foreground mt-1 text-xs break-all" dir="ltr">request {r.requestId} · actor {r.actor}</p>
      {canWrite && canRollBack(r) && <RollbackButton businessSlug={businessSlug} projectId={r.projectId} actionId={r.id} />}
    </li>;
  })}</ul>
  </div>;
}
