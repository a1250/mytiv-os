'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BrainStatusExport } from '@/lib/marketing/contract-rules/c2-c3';
import { brainFileStatus, brainStatusLabel, reconciledLabel } from '@/lib/marketing/view';

type Proposal = { id: string; targetId: string; createdAt: string; exportedAt: string | null; reconciledState: string | null };

function proposalError(code: string): string {
  if (code === 'stale_value_hash') return 'הערך השתנה מאז שנטען. יש לרענן ולבדוק שוב.';
  if (code.includes('reason')) return 'חובה לכתוב סיבה להצעה.';
  if (code.includes('binding_version')) return 'חיבור הפרויקט השתנה. יש לרענן את הדף.';
  if (code.includes('role')) return 'רק בעלים או מנהלים יכולים להציע שינוי.';
  return 'לא ניתן לרשום את ההצעה כרגע. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
}

/** Propose a change to one Brain field → a RED approval in the engine (never a direct write from the app). */
function ProposeForm({ endpoint, bindingVersion, sourceArtifactId, fields }: {
  endpoint: string; bindingVersion: number; sourceArtifactId: string; fields: { file: string; path: string; valueHash: string }[];
}) {
  const router = useRouter();
  const [field, setField] = useState(0);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [verify, setVerify] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const requestId = useRef('');
  const target = fields[field];
  // A new value is sent as JSON when it parses (numbers, lists, objects), otherwise as text.
  const parsed = (() => { try { return JSON.parse(value); } catch { return value; } })();
  function ask() {
    if (!reason.trim()) { setMessage(proposalError('reason')); return; }
    requestId.current = crypto.randomUUID(); setMessage(''); setConfirming(true);
  }
  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        confirmed: true, requestId: requestId.current, bindingVersion, sourceArtifactId, file: target.file, path: target.path, valueHash: target.valueHash,
        // C3a exports value hashes, not values: the app cannot know the current value. The engine records the
        // actual propose-time value itself and refuses a stale proposal by value_hash.
        old: null, new: parsed, reason, verify,
      }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'proposal_failed');
      setConfirming(false); setValue(''); setReason(''); setMessage('ההצעה נרשמה. היא תהפוך לפריט אישור (RED) במנוע.'); router.refresh();
    } catch (e) { setMessage(proposalError(e instanceof Error ? e.message : '')); setConfirming(false); }
    finally { setBusy(false); }
  }
  if (!target) return null;
  return <details className="border-border rounded-xl border p-4"><summary className="cursor-pointer font-medium">הצעת שינוי במוח העסק</summary>
    <div className="mt-3 space-y-3">
      <label htmlFor="brain-field" className="block text-sm">שדה</label>
      <select id="brain-field" dir="ltr" value={field} onChange={(e) => { setField(Number(e.target.value)); setConfirming(false); }} className="bg-muted rounded border p-2 text-sm">
        {fields.map((f, i) => <option key={`${f.file}#${f.path}`} value={i}>{f.file} › {f.path}</option>)}
      </select>
      <label htmlFor="brain-value" className="block text-sm">ערך חדש</label>
      <input id="brain-value" dir="ltr" value={value} onChange={(e) => { setValue(e.target.value); setConfirming(false); }} className="bg-muted w-full rounded border p-2 font-mono text-sm" />
      <label htmlFor="brain-reason" className="block text-sm">סיבה (חובה)</label>
      <textarea id="brain-reason" value={reason} onChange={(e) => { setReason(e.target.value); setConfirming(false); }} rows={2} className="bg-muted w-full rounded border p-2 text-sm" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verify} onChange={(e) => setVerify(e.target.checked)} />לסמן את הקובץ כמאומת ע״י הבעלים לאחר ההחלה</label>
      {!confirming ? <button onClick={ask} disabled={busy} className="bg-muted rounded px-3 py-1.5 text-sm">בדיקת ההצעה</button>
        : <div className="bg-card border-border space-y-2 rounded-lg border p-3">
          <p className="text-sm">להציע את השינוי ב־<span dir="ltr">{target.file} › {target.path}</span>? ההצעה אינה משנה דבר באפליקציה: היא נשלחת למנוע כפריט אישור (RED), ורק אישור מפורש מחיל אותה.</p>
          <div className="flex gap-2"><button onClick={confirm} disabled={busy} className="bg-foreground text-background rounded px-3 py-1.5 text-sm">{busy ? 'רושם…' : 'אישור ההצעה'}</button>
            <button onClick={() => setConfirming(false)} disabled={busy} className="bg-muted rounded px-3 py-1.5 text-sm">ביטול</button></div>
        </div>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  </details>;
}

/**
 * M4 Business Brain viewer (T-4.7 · MKT-F09, F10): per-file status and field-level verification from C3a,
 * the engine's open proposals, the proposals recorded here with their engine state, and (writers) a
 * propose-change form. Nothing here writes to the Brain: a proposal becomes a RED approval in the engine.
 */
export function BrainView({ businessSlug, projectId, bindingVersion, status, proposals, canWrite }: {
  businessSlug: string; projectId: string; bindingVersion: number;
  status: { id: string; asOf: string; payload: BrainStatusExport } | null; proposals: Proposal[]; canWrite: boolean;
}) {
  const base = `/api/${businessSlug}/ops/projects/${projectId}/marketing/proposals`;
  if (!status) return <p className="bg-card border-border rounded-xl border p-6">טרם יובא מצב מוח העסק. אין נתונים להצגה.</p>;
  const s = status.payload;
  const fields = Object.entries(s.values).flatMap(([file, paths]) => Object.entries(paths).map(([path, valueHash]) => ({ file, path, valueHash })));
  return <section className="space-y-6">
    <p className="text-muted-foreground text-xs">נכון ל־{status.asOf.slice(0, 16).replace('T', ' ')} · מקור {s.sourceRevision}</p>
    <table className="w-full text-sm"><thead><tr className="text-muted-foreground text-xs"><th className="text-start">קובץ</th><th className="text-start">מצב</th></tr></thead>
      <tbody>{Object.entries(s.files).map(([file, state]) => {
        const st = brainFileStatus(file, state, s.field_verification);
        return <tr key={file} className="border-border border-t"><td className="py-2" dir="ltr">{file}</td>
          <td className={st === 'VERIFIED' ? undefined : 'text-warning'}>{brainStatusLabel(st)}</td></tr>;
      })}</tbody></table>
    <p className="text-muted-foreground text-xs">מצב &quot;פג תוקף&quot; (EXPIRED) אינו מיוצא בחוזה C3a הנוכחי.</p>
    <section><h3 className="mb-2 font-semibold">אימות ברמת שדה</h3>
      {Object.keys(s.field_verification).length === 0 ? <p className="text-sm">לא נרשם אימות לאף שדה.</p> :
        <ul className="space-y-1 text-sm">{Object.entries(s.field_verification).map(([key, v]) => <li key={key}>
          <span dir="ltr">{key}</span> · {v.owner_verified ? 'אומת ע״י הבעלים' : 'לא אומת ע״י הבעלים'} · {v.source_verified ? 'אומת מול המקור' : 'לא אומת מול המקור'}
          {v.source && <> · מקור: <span dir="ltr">{v.source}</span></>}{v.note && <> · {v.note}</>}
        </li>)}</ul>}
    </section>
    <section><h3 className="mb-2 font-semibold">הצעות פתוחות במנוע</h3>
      {s.open_proposals.length === 0 ? <p className="text-sm">אין הצעות פתוחות.</p> :
        <ul className="space-y-1 text-sm">{s.open_proposals.map((p) => <li key={`${p.file}#${p.path}#${p.app_request_id}`}><span dir="ltr">{p.file} › {p.path}</span> · {p.reason}</li>)}</ul>}
    </section>
    {proposals.length > 0 && <section><h3 className="mb-2 font-semibold">הצעות שנרשמו כאן</h3>
      <ul className="space-y-1 text-sm">{proposals.map((p) => <li key={p.id}><span dir="ltr">{p.targetId}</span> · {p.createdAt.slice(0, 10)} · {reconciledLabel(p.reconciledState)}{p.exportedAt ? ' · יוצא' : ' · טרם יוצא'}
        {canWrite && <> · <a href={`${base}/${p.id}`} className="underline">הורדת קובץ ההצעה</a></>}</li>)}</ul>
    </section>}
    {canWrite && fields.length > 0 && <ProposeForm endpoint={base} bindingVersion={bindingVersion} sourceArtifactId={status.id} fields={fields} />}
  </section>;
}
