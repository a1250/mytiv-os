import type { ApprovalQueueItem } from '@/lib/marketing/contract-rules/c2-c3';
import type { WorkboardTask } from '@/lib/marketing/contract-rules/c5-c8';
import type { CampaignArtifacts } from '@/lib/marketing/contract-rules/c9-c14';
import type { MarketingRecords } from '@/lib/marketing/records';
import { isPublishAction, metricValue, provenanceLabel, receiptActionFor, reconciledLabel } from '@/lib/marketing/view';
import { DecisionForm } from './approvals';
import { EvidenceForm, OutcomeForm, ReceiptForm } from './forms/record-forms';

const BUILD_STATE: Record<string, string> = { draft: 'טיוטה', paused: 'מושהה — ממתין להפעלה', active: 'פעיל', archived: 'בארכיון' };
type Evidence = MarketingRecords['evidence'][number];

function RecordList({ records, base, canWrite, empty }: { records: Evidence[]; base: string; canWrite: boolean; empty: string }) {
  if (!records.length) return <p className="text-muted-foreground text-xs">{empty}</p>;
  return <ul className="space-y-1 text-sm">{records.map((r) => <li key={r.id} data-record-id={r.id}><span dir="ltr">{r.targetId}</span> · {r.createdAt.slice(0, 10)} · {reconciledLabel(r.reconciledState)}{r.exportedAt ? ' · יוצא' : ' · טרם יוצא'}
    {canWrite && <> · <a href={`${base}/${r.id}`} className="underline">הורדת הקובץ</a></>}</li>)}</ul>;
}

/**
 * M5 Campaigns & Content (T-7.2 · F11; T-7.3 · F08, F12; T-7.4 · F13; T-7.5 · F08, F19). Campaign plans stay
 * as the engine built them (activation is a RED approval, decided here like any approval — never activated
 * by the app); content calendar and Manual Publish Packs; every asset with its provenance label; and the
 * three evidence records the app hands to the engine: publication evidence (C6), execution receipts (C16)
 * and measured outcomes (C15). Task status shown is always the engine's.
 */
export function CampaignsView({ businessSlug, projectId, bindingVersion, canWrite, campaigns, queue, board, records }: {
  businessSlug: string; projectId: string; bindingVersion: number; canWrite: boolean;
  campaigns: CampaignArtifacts | null; queue: { id: string; items: ApprovalQueueItem[] } | null;
  board: { id: string; tasks: WorkboardTask[] } | null; records: MarketingRecords;
}) {
  const api = `/api/${businessSlug}/ops/projects/${projectId}/marketing`;
  const items = queue?.items ?? [];
  const activations = items.filter((i) => i.action_type === 'campaign_activate' && i.state === 'pending');
  const recorded = (kind: string) => records.evidence.filter((e) => e.kind === kind);
  const receiptDone = new Set(recorded('execution_receipt').map((r) => r.approvalId));
  const executable = items.filter((i) => i.state === 'approved' && receiptActionFor(i.action_type) && !receiptDone.has(i.approval_id));
  const tasks = board?.tasks ?? [];
  return <div className="space-y-8">
    <section aria-labelledby="cmp-plans"><h2 id="cmp-plans" className="text-lg font-semibold">קמפיינים</h2>
      {!campaigns ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובאו תוצרי קמפיינים.</p> : (campaigns.campaigns ?? []).length === 0 ? <p className="mt-2 text-sm">אין קמפיינים.</p> :
        <ul className="mt-3 space-y-3">{(campaigns.campaigns ?? []).map((c) => <li key={c.id} data-campaign-id={c.id} className="bg-card border-border rounded-xl border p-4">
          <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{c.objective}</span><span className="text-sm">{BUILD_STATE[c.build_state]}</span></div>
          <p className="text-muted-foreground mt-1 text-xs">קהלים: {c.audiences.join(' · ')} · תקציב: {metricValue(c.budget_envelope, 'KNOWN')} · מעקב: <span dir="ltr">{c.tracking_spec}</span></p>
          {(c.kpis ?? []).length > 0 && <p className="text-muted-foreground text-xs">מדדים: {(c.kpis ?? []).join(' · ')}</p>}
          {(c.creative_matrix ?? []).length > 0 && <p className="text-muted-foreground text-xs">קריאייטיב: {(c.creative_matrix ?? []).join(' · ')}</p>}
        </li>)}</ul>}
      <p className="text-muted-foreground mt-2 text-xs">הפעלת קמפיין היא פעולת RED: היא מתבצעת רק לאחר אישור מפורש, ולעולם לא ישירות מכאן.</p>
      {activations.length > 0 && <div className="mt-3 space-y-3">{activations.map((a) => <div key={a.approval_id} data-activation={a.approval_id} className="border-danger/40 rounded-xl border p-4">
        <p className="font-medium">אישור הפעלה ממתין: {a.title}</p><p className="text-sm">{a.why}</p>
        {canWrite && queue ? <DecisionForm endpoint={`${api}/decisions`} bindingVersion={bindingVersion} sourceArtifactId={queue.id} item={a} /> : <p className="text-muted-foreground text-xs">ממתין להחלטה של בעלים או מנהל.</p>}
      </div>)}</div>}
    </section>

    <section aria-labelledby="cmp-calendar"><h2 id="cmp-calendar" className="text-lg font-semibold">לוח תוכן</h2>
      {!(campaigns?.content_calendar ?? []).length ? <p className="text-muted-foreground mt-2 text-sm">אין פריטים בלוח התוכן.</p> :
        <ul className="mt-2 space-y-1 text-sm">{(campaigns?.content_calendar ?? []).map((e) => <li key={e.id}>{e.date.slice(0, 10)} · <span dir="ltr">{e.channel}</span> · {e.status}</li>)}</ul>}
    </section>

    <section aria-labelledby="cmp-packs"><h2 id="cmp-packs" className="text-lg font-semibold">חבילות פרסום ידני</h2>
      {!(campaigns?.manual_publish_packs ?? []).length ? <p className="text-muted-foreground mt-2 text-sm">אין חבילות פרסום.</p> :
        <ul className="mt-2 space-y-2 text-sm">{(campaigns?.manual_publish_packs ?? []).map((p) => <li key={p.id} className="bg-card border-border rounded-lg border p-3"><span dir="ltr">{p.id}</span>{p.campaign_id ? <> · קמפיין <span dir="ltr">{p.campaign_id}</span></> : null}<p className="mt-1 whitespace-pre-wrap">{p.instructions}</p></li>)}</ul>}
    </section>

    <section aria-labelledby="cmp-assets"><h2 id="cmp-assets" className="text-lg font-semibold">נכסים</h2>
      {!(campaigns?.asset_refs ?? []).length ? <p className="text-muted-foreground mt-2 text-sm">אין נכסים.</p> :
        <ul className="mt-2 space-y-1 text-sm">{(campaigns?.asset_refs ?? []).map((a) => <li key={a.ref} data-asset={a.ref}><span dir="ltr">{a.ref}</span> · <span className={a.provenance === 'ai_concept' ? 'border-warning/40 bg-warning/10 rounded border px-1 text-xs' : 'text-xs'}>{provenanceLabel(a.provenance)}</span>
          {a.disclosure && <> · {a.disclosure}</>}</li>)}</ul>}
    </section>

    <section aria-labelledby="cmp-evidence"><h2 id="cmp-evidence" className="text-lg font-semibold">ראיות פרסום</h2>
      {canWrite && board && <EvidenceForm endpoint={`${api}/evidence`} bindingVersion={bindingVersion} sourceArtifactId={board.id}
        taskIds={tasks.filter((t) => t.status === 'scheduled').map((t) => t.task_id)}
        publishApprovals={items.filter((i) => i.state === 'approved' && isPublishAction(i.action_type)).map((i) => ({ approval_id: i.approval_id, title: i.title }))} />}
      {!board && <p className="text-muted-foreground text-sm">טרם יובא לוח עבודה — אין משימות לרישום ראיה.</p>}
      <RecordList records={recorded('publish_evidence')} base={`${api}/evidence`} canWrite={canWrite} empty="לא נרשמו ראיות פרסום." />
    </section>

    <section aria-labelledby="cmp-receipts"><h2 id="cmp-receipts" className="text-lg font-semibold">קבלות ביצוע</h2>
      {executable.length === 0 ? <p className="text-muted-foreground text-sm">אין אישורי הפעלה/שליחה מאושרים שממתינים לרישום ביצוע. פריט שנדחה לעולם אינו מקבל טופס ביצוע.</p>
        : <ul className="space-y-3">{executable.map((i) => <li key={i.approval_id} data-receipt-for={i.approval_id} className="bg-card border-border rounded-xl border p-4"><p className="font-medium">{i.title}</p>
          {canWrite && queue ? <ReceiptForm endpoint={`${api}/receipts`} bindingVersion={bindingVersion} sourceArtifactId={queue.id} item={{ approval_id: i.approval_id, content_hash: i.content_hash, title: i.title, actionType: receiptActionFor(i.action_type)! }} />
            : <p className="text-muted-foreground text-xs">רישום ביצוע — בעלים או מנהל בלבד.</p>}</li>)}</ul>}
      <RecordList records={recorded('execution_receipt')} base={`${api}/receipts`} canWrite={canWrite} empty="לא נרשמו קבלות ביצוע." />
    </section>

    <section aria-labelledby="cmp-outcomes"><h2 id="cmp-outcomes" className="text-lg font-semibold">תוצאות מדודות</h2>
      {tasks.filter((t) => t.status === 'published').length === 0 ? <p className="text-muted-foreground text-sm">אין משימות שפורסמו וממתינות לתוצאה.</p>
        : <ul className="space-y-3">{tasks.filter((t) => t.status === 'published').map((t) => <li key={t.task_id} data-outcome-for={t.task_id} className="bg-card border-border rounded-xl border p-4"><p className="font-medium" dir="ltr">{t.task_id}</p>
          {canWrite && board ? <OutcomeForm endpoint={`${api}/outcomes`} bindingVersion={bindingVersion} sourceArtifactId={board.id} task={{ task_id: t.task_id, dod: t.dod }} />
            : <p className="text-muted-foreground text-xs">רישום תוצאה — בעלים או מנהל בלבד.</p>}</li>)}</ul>}
      <RecordList records={recorded('outcome_evidence')} base={`${api}/outcomes`} canWrite={canWrite} empty="לא נרשמו תוצאות." />
    </section>
  </div>;
}
