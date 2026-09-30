'use client';
import { useState } from 'react';
import { useGovernedPost } from './use-governed-post';

const input = 'bg-muted w-full rounded border p-2 text-sm';
function Confirm({ text, busy, onConfirm, onCancel }: { text: string; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <div className="bg-card border-border space-y-2 rounded-lg border p-3">
    <p className="text-sm">{text}</p>
    <div className="flex gap-2"><button onClick={onConfirm} disabled={busy} className="bg-foreground text-background rounded px-3 py-1.5 text-sm">{busy ? 'רושם…' : 'אישור'}</button>
      <button onClick={onCancel} disabled={busy} className="bg-muted rounded px-3 py-1.5 text-sm">ביטול</button></div>
  </div>;
}
function Reviewed({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label htmlFor={id} className="flex items-center gap-2 text-sm"><input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />בדקתי את הראיה הזו (נרשם בשמי)</label>;
}
const isoOk = (v: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/.test(v);

/** T-7.3 · C6 publication evidence for a scheduled task (the engine decides whether it becomes published). */
export function EvidenceForm({ endpoint, bindingVersion, sourceArtifactId, taskIds, publishApprovals }: {
  endpoint: string; bindingVersion: number; sourceArtifactId: string; taskIds: string[]; publishApprovals: { approval_id: string; title: string }[];
}) {
  const g = useGovernedPost(endpoint, bindingVersion);
  const [taskId, setTaskId] = useState(taskIds[0] ?? '');
  const [channel, setChannel] = useState('');
  const [kind, setKind] = useState<'url' | 'screenshot_ref' | 'measurement_ref'>('url');
  const [ref, setRef] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [by, setBy] = useState('');
  const [approvalId, setApprovalId] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const problem = () => !reviewed ? 'יש לאשר במפורש שהראיה נבדקה.' : !taskId || !channel.trim() || !ref.trim() || !by.trim() ? 'יש למלא את כל השדות.' : !isoOk(publishedAt) ? 'מועד הפרסום חייב להיות תאריך ושעה מלאים (למשל 2026-01-02T10:00:00Z).' : null;
  if (!taskIds.length) return <p className="text-muted-foreground text-sm">אין משימות מתוזמנות שממתינות לראיית פרסום.</p>;
  return <div className="space-y-2">
    <select aria-label="משימה" value={taskId} onChange={(e) => setTaskId(e.target.value)} className={input} dir="ltr">{taskIds.map((t) => <option key={t}>{t}</option>)}</select>
    <input aria-label="ערוץ" placeholder="ערוץ (instagram…)" value={channel} onChange={(e) => setChannel(e.target.value)} className={input} />
    <div className="flex gap-2"><select aria-label="סוג ראיה" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="bg-muted rounded border p-2 text-sm">
      <option value="url">קישור לפרסום</option><option value="screenshot_ref">צילום מסך</option><option value="measurement_ref">רשומת מדידה</option></select>
      <input aria-label="הפניה לראיה" dir="ltr" placeholder="https://… או נתיב יחסי" value={ref} onChange={(e) => setRef(e.target.value)} className={input} /></div>
    <input aria-label="מועד פרסום" dir="ltr" placeholder="2026-01-02T10:00:00Z" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={input} />
    <input aria-label="פורסם ע״י" placeholder="מי פרסם" value={by} onChange={(e) => setBy(e.target.value)} className={input} />
    {publishApprovals.length > 0 && <select aria-label="אישור פרסום מקושר" value={approvalId} onChange={(e) => setApprovalId(e.target.value)} className={input}>
      <option value="">ללא אישור פרסום מקושר</option>{publishApprovals.map((a) => <option key={a.approval_id} value={a.approval_id}>{a.title}</option>)}</select>}
    <Reviewed id="ev-reviewed" checked={reviewed} onChange={setReviewed} />
    {!g.confirming ? <button onClick={() => g.ask(problem())} disabled={g.busy} className="bg-muted rounded px-3 py-1.5 text-sm">בדיקה</button>
      : <Confirm busy={g.busy} onCancel={() => g.setConfirming(false)} text={`לרשום ראיית פרסום למשימה ${taskId}? הרשומה נשלחת למנוע; המשימה תסומן כפורסמה רק אם המנוע יחיל אותה.`}
        onConfirm={() => g.submit({ sourceArtifactId, taskId, channel, evidence: { [kind]: ref }, publishedAt, by, reviewed, ...(approvalId ? { approvalId } : {}) }, 'ראיית הפרסום נרשמה וממתינה למנוע.')} />}
    {g.message && <p role="status" className="text-sm">{g.message}</p>}
  </div>;
}

/** T-7.5 · C16 execution receipt for an APPROVED campaign/message approval (never for a rejected one). */
export function ReceiptForm({ endpoint, bindingVersion, sourceArtifactId, item }: {
  endpoint: string; bindingVersion: number; sourceArtifactId: string;
  item: { approval_id: string; content_hash: string; title: string; actionType: 'campaign_activation' | 'message_batch' };
}) {
  const g = useGovernedPost(endpoint, bindingVersion);
  const [packRef, setPackRef] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const [executedBy, setExecutedBy] = useState('');
  const [executedAt, setExecutedAt] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const problem = () => !reviewed ? 'יש לאשר במפורש שהראיה נבדקה.' : !packRef.trim() || !executedBy.trim() ? 'יש למלא את חבילת הביצוע ואת מבצע הפעולה.' : !isoOk(executedAt) ? 'מועד הביצוע חייב להיות תאריך ושעה מלאים.' : null;
  return <div className="space-y-2">
    <input aria-label="חבילת הביצוע" dir="ltr" placeholder="packs/…" value={packRef} onChange={(e) => setPackRef(e.target.value)} className={input} />
    <input aria-label="מזהה חיצוני (לא חובה)" dir="ltr" placeholder="מזהה אצל הספק (לא חובה)" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} className={input} />
    <input aria-label="בוצע ע״י" placeholder="מי ביצע" value={executedBy} onChange={(e) => setExecutedBy(e.target.value)} className={input} />
    <input aria-label="מועד ביצוע" dir="ltr" placeholder="2026-01-02T10:00:00Z" value={executedAt} onChange={(e) => setExecutedAt(e.target.value)} className={input} />
    <Reviewed id={`rc-reviewed-${item.approval_id}`} checked={reviewed} onChange={setReviewed} />
    {!g.confirming ? <button onClick={() => g.ask(problem())} disabled={g.busy} className="bg-muted rounded px-3 py-1.5 text-sm">רישום ביצוע</button>
      : <Confirm busy={g.busy} onCancel={() => g.setConfirming(false)} text={`לרשום שבוצע "${item.title}"? הקבלה נשלחת למנוע ומקושרת לאישור ולתוכן שאושר.`}
        onConfirm={() => g.submit({ sourceArtifactId, approvalId: item.approval_id, contentHash: item.content_hash, actionType: item.actionType, executedBy, executedAt,
          evidence: { pack_ref: packRef, ...(externalRef.trim() ? { external_ref: externalRef } : {}) }, reviewed }, 'הביצוע נרשם וממתין למנוע.')} />}
    {g.message && <p role="status" className="text-sm">{g.message}</p>}
  </div>;
}

/** T-7.5 · C15 outcome for a PUBLISHED task: every DoD criterion must be met (D10) + one measurement form. */
export function OutcomeForm({ endpoint, bindingVersion, sourceArtifactId, task }: {
  endpoint: string; bindingVersion: number; sourceArtifactId: string; task: { task_id: string; dod: string[] };
}) {
  const g = useGovernedPost(endpoint, bindingVersion);
  const [met, setMet] = useState<string[]>([]);
  const [kind, setKind] = useState<'kpi_snapshot_ref' | 'ingest_manifest_ref'>('kpi_snapshot_ref');
  const [ref, setRef] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const allMet = task.dod.every((d) => met.includes(d));
  const problem = () => !reviewed ? 'יש לאשר במפורש שהראיה נבדקה.' : !allMet ? 'יש לסמן את כל תנאי הסיום של המשימה.' : !ref.trim() ? 'יש לציין את מקור המדידה.' : null;
  return <div className="space-y-2">
    <fieldset className="space-y-1"><legend className="text-sm">תנאי הסיום שהתקיימו (כולם נדרשים)</legend>
      {task.dod.map((d) => <label key={d} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={met.includes(d)} onChange={(e) => setMet(e.target.checked ? [...met, d] : met.filter((x) => x !== d))} />{d}</label>)}</fieldset>
    <div className="flex gap-2"><select aria-label="סוג מדידה" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="bg-muted rounded border p-2 text-sm">
      <option value="kpi_snapshot_ref">תמונת מדדים</option><option value="ingest_manifest_ref">מניפסט קליטה</option></select>
      <input aria-label="הפניה למדידה" dir="ltr" placeholder="exports/…" value={ref} onChange={(e) => setRef(e.target.value)} className={input} /></div>
    <Reviewed id={`oc-reviewed-${task.task_id}`} checked={reviewed} onChange={setReviewed} />
    {!g.confirming ? <button onClick={() => g.ask(problem())} disabled={g.busy} className="bg-muted rounded px-3 py-1.5 text-sm">רישום תוצאה</button>
      : <Confirm busy={g.busy} onCancel={() => g.setConfirming(false)} text={`לרשום תוצאה מדודה למשימה ${task.task_id}? המשימה תסומן כנמדדת רק אם המנוע יחיל את הרשומה.`}
        onConfirm={() => g.submit({ sourceArtifactId, taskId: task.task_id, dodCriteriaMet: met, measurement: { [kind]: ref }, reviewed }, 'התוצאה נרשמה וממתינה למנוע.')} />}
    {g.message && <p role="status" className="text-sm">{g.message}</p>}
  </div>;
}
