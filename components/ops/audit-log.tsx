import { listOpsAudit } from '@/lib/db/queries/ops-audit';
export async function AuditLog({ businessId, projectId }: { businessId: string; projectId: string }) {
  let rows: Awaited<ReturnType<typeof listOpsAudit>>;
  try { rows = await listOpsAudit(businessId, projectId); }
  catch { return <p className="text-warning mt-6 text-xs">היסטוריית האישורים אינה זמינה. יש לבדוק את חיבור מסד הנתונים והתקנת העדכון.</p>; }
  return <details className="border-border mt-6 rounded-xl border p-4" dir="rtl"><summary className="cursor-pointer text-sm font-medium">היסטוריית אישורי ביצוע</summary>
    <p className="text-muted-foreground my-3 text-xs">50 האירועים האחרונים. אישור ללא תוצאה סופית דורש בדיקה ב־ClickUp לפני ניסיון נוסף.</p>
    {rows.length ? <ul className="space-y-2">{rows.map((r, index) => <li key={`${r.id}-${index}`} className="border-border border-b pb-2 text-xs">
      <p>{r.action} · {r.event || 'claimed — outcome not recorded'} · {(r.eventAt || r.confirmedAt).toISOString()}</p>
      <p className="text-muted-foreground break-all">Request: {r.requestId} · Actor: {r.actor}</p>
    </li>)}</ul> : <p className="text-muted-foreground text-sm">טרם נרשמו אישורים בגרסה זו.</p>}
  </details>;
}
