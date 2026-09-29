'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApprovalQueueItem } from '@/lib/marketing/contract-rules/c2-c3';
import { approvalStateLabel, reconciledLabel } from '@/lib/marketing/view';

type Decision = { id: string; approvalId: string; contentHash: string; decision: string; note: string; decidedAt: string; exportedAt: string | null; reconciledState: string | null };
type Queue = { id: string; revision: number; asOf: string; items: ApprovalQueueItem[] };

function decisionError(code: string): string {
  if (code.includes('note')) return 'חובה לכתוב נימוק להחלטה.';
  if (code === 'stale_content_hash') return 'הפריט השתנה מאז שנטען. יש לרענן ולבדוק שוב.';
  if (code === 'approval_not_pending') return 'הפריט כבר אינו ממתין להחלטה.';
  if (code === 'already_recorded') return 'כבר נרשמה החלטה על התוכן הזה.';
  if (code.includes('binding_version')) return 'חיבור הפרויקט השתנה. יש לרענן את הדף.';
  if (code.includes('role')) return 'רק בעלים או מנהלים יכולים להחליט.';
  return 'לא ניתן לרשום את ההחלטה כרגע. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
}

/** One pending item: an explicit decision with a mandatory note and a confirmation step (RED is never auto). */
function DecisionForm({ endpoint, bindingVersion, sourceArtifactId, item }: { endpoint: string; bindingVersion: number; sourceArtifactId: string; item: ApprovalQueueItem }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<null | 'approved' | 'rejected'>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const requestId = useRef('');
  function ask(decision: 'approved' | 'rejected') {
    if (!note.trim()) { setMessage(decisionError('note')); return; }
    requestId.current = crypto.randomUUID(); setMessage(''); setPending(decision);
  }
  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        confirmed: true, requestId: requestId.current, bindingVersion, sourceArtifactId, approvalId: item.approval_id, contentHash: item.content_hash, decision: pending, note,
      }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'decision_failed');
      setPending(null); setNote(''); router.refresh();
    } catch (e) { setMessage(decisionError(e instanceof Error ? e.message : '')); setPending(null); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 space-y-2">
    <label htmlFor={`note-${item.approval_id}`} className="block text-sm">נימוק (חובה)</label>
    <textarea id={`note-${item.approval_id}`} value={note} onChange={(e) => { setNote(e.target.value); setPending(null); }} rows={2} className="bg-muted w-full rounded border p-2 text-sm" />
    {!pending ? <div className="flex gap-2">
      <button onClick={() => ask('approved')} disabled={busy} className="bg-muted rounded px-3 py-1.5 text-sm">אישור</button>
      <button onClick={() => ask('rejected')} disabled={busy} className="bg-muted rounded px-3 py-1.5 text-sm">דחייה</button>
    </div> : <div className="bg-card border-border space-y-2 rounded-lg border p-3">
      <p className="text-sm">{pending === 'approved' ? 'לאשר' : 'לדחות'} את הפריט <span dir="ltr">{item.approval_id}</span>? ההחלטה נרשמת ביומן ומיוצאת למנוע כקובץ. המנוע מחיל אותה — לא האפליקציה.</p>
      <div className="flex gap-2"><button onClick={confirm} disabled={busy} className="bg-foreground text-background rounded px-3 py-1.5 text-sm">{busy ? 'רושם…' : 'אישור ההחלטה'}</button>
        <button onClick={() => setPending(null)} disabled={busy} className="bg-muted rounded px-3 py-1.5 text-sm">ביטול</button></div>
    </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>;
}

/**
 * M2 Approvals (T-4.5 · MKT-F03, F04): the imported C2a queue with each item's engine state, the decision
 * recorded here (with what the engine's next export says about it), an explicit approve/reject with a
 * mandatory note for pending items (writers only), and the decision file to hand to the engine.
 */
export function ApprovalsView({ businessSlug, projectId, bindingVersion, queue, decisions, canWrite }: {
  businessSlug: string; projectId: string; bindingVersion: number; queue: Queue | null; decisions: Decision[]; canWrite: boolean;
}) {
  const base = `/api/${businessSlug}/ops/projects/${projectId}/marketing/decisions`;
  if (!queue) return <p className="bg-card border-border rounded-xl border p-6">טרם יובא תור אישורים. אין פריטים להצגה.</p>;
  return <section className="space-y-4">
    <p className="text-muted-foreground text-xs">תור אישורים · גרסה {queue.revision} · נכון ל־{queue.asOf.slice(0, 16).replace('T', ' ')}</p>
    <p role="note" className="border-warning/40 bg-warning/10 rounded-lg border p-3 text-sm">
      פרטי הכרטיס (מה, למה, סיווג, שינוי, עובדות, QA, הערת חזרה לאחור) אינם כלולים עדיין בחוזה C2a. יש לעיין בפריט ב־Marketing OS לפני החלטה.
    </p>
    {queue.items.length === 0 && <p>אין פריטים בתור.</p>}
    <ul className="space-y-3">{queue.items.map((item) => {
      const recorded = decisions.find((d) => d.approvalId === item.approval_id && d.contentHash === item.content_hash);
      return <li key={item.approval_id} className="bg-card border-border rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium" dir="ltr">{item.approval_id}</span>
          <span className="text-sm">{approvalStateLabel(item.state)}</span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs" dir="ltr">content {item.content_hash.slice(0, 12)}…</p>
        {recorded ? <div className="mt-3 text-sm">
          <p>החלטה שנרשמה: {recorded.decision === 'approved' ? 'אושר' : 'נדחה'} · {recorded.decidedAt.slice(0, 10)} · נימוק: {recorded.note}</p>
          <p className="text-muted-foreground text-xs">מצב במנוע: {reconciledLabel(recorded.reconciledState)}{recorded.exportedAt ? ` · יוצא ${recorded.exportedAt.slice(0, 10)}` : ' · טרם יוצא'}</p>
          {canWrite && <a href={`${base}/${recorded.id}`} className="mt-2 inline-block text-xs underline">הורדת קובץ ההחלטה (ApprovalDecision JSON)</a>}
        </div>
          : item.state === 'pending' && canWrite ? <DecisionForm endpoint={base} bindingVersion={bindingVersion} sourceArtifactId={queue.id} item={item} />
          : item.state === 'pending' ? <p className="text-muted-foreground mt-3 text-xs">ממתין להחלטה של בעלים או מנהל.</p> : null}
      </li>;
    })}</ul>
  </section>;
}
