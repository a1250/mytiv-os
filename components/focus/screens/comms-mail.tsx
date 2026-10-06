"use client";

import Link, { useFocusRouter } from "@/components/focus/ui/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { MailFilter, MailLink, MailThread, ReplyDraft } from "@/lib/focus/contracts/comms";
import { dataOf } from "@/lib/focus/contracts/loadable";
import { MAILBOX } from "@/lib/focus/fixtures/comms";
import { CLIENTS } from "@/lib/focus/fixtures/people";
import { fmtAgo, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus, type JobStatus } from "@/lib/focus/state/jobs";
import { useLeaveGuard, LeaveDialog } from "@/components/focus/patterns/comms/leave-guard";
import { ClaimList, DraftEditor, DraftLegend, MessageBody, MessageHeader, SendReviewDialog, ThreadList } from "@/components/focus/patterns/comms/mail";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { Banner, EmptyState, LoadableView } from "@/components/focus/ui/feedback";
import { SelectField } from "@/components/focus/ui/field";
import { Icon } from "@/components/focus/ui/icon";
import { Bdi } from "@/components/focus/ui/misc";
import { OriginTag, SystemLine } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Mail inbox with an AI reply draft (handoff F6). Search and filters work on the fixtures, the draft is a real
 * editable text whose claims stay highlighted, "שמור טיוטה" keeps it locally, "נסח מחדש" runs an AI job, and sending
 * goes through a review dialog with explicit confirmation — "נשלח" appears only after the simulated Gmail confirms.
 */
const SEND_MS = 1800;
const AI_MS = 1500;

type DraftLocal = {
  base: ReplyDraft | null;
  text: string;
  savedText: string | null;
  savedAt?: string;
  /** index of the next alternate the AI job will return */
  alt: number;
  ai?: { jobId: string; draft: ReplyDraft };
  send?: { jobId: string; text: string };
};

const initialDraft = (t: MailThread): DraftLocal => ({ base: t.draft, text: t.draft?.text ?? "", savedText: t.draft?.text ?? null, alt: 0 });

function Inner() {
  const demo = useDemo();
  const toast = useToast();
  const router = useFocusRouter();
  const params = useSearchParams();
  const { now, state } = demo;
  const threads = dataOf(MAILBOX.threads) ?? [];

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MailFilter | null>(null);
  const [read, setRead] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<string, MailLink>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftLocal>>({});
  const [sendOpen, setSendOpen] = useState(false);
  const [linkFor, setLinkFor] = useState<string | null>(null);
  const [linkChoice, setLinkChoice] = useState<string>(CLIENTS.umino.id);
  const [mobileThread, setMobileThread] = useState(() => !!params.get("thread"));

  const live = threads.map((t) => ({ ...t, unread: t.unread && !read.includes(t.id), link: links[t.id] ?? t.link }));
  const selectedId = live.some((t) => t.id === params.get("thread")) ? params.get("thread")! : live[0]?.id ?? null;
  const thread = live.find((t) => t.id === selectedId) ?? null;

  const q = query.trim();
  const shown = live.filter((t) => {
    if (filter === "unread" && !t.unread) return false;
    if (filter === "client" && t.link.kind !== "client") return false;
    if (filter === "lead" && t.link.kind !== "lead") return false;
    if (!q) return true;
    return [t.from.name, t.from.address, t.subject, ...t.body, t.link.kind === "none" ? "" : t.link.label].some((s) => s.includes(q));
  });
  const counts: Record<MailFilter, number> = {
    unread: live.filter((t) => t.unread).length,
    client: live.filter((t) => t.link.kind === "client").length,
    lead: live.filter((t) => t.link.kind === "lead").length,
  };

  // ---- draft state for the selected thread (derived; AI/send results come from the demo store's jobs) ----
  const d = thread ? drafts[thread.id] ?? initialDraft(thread) : null;
  const status = (id?: string): JobStatus | null => {
    const j = id ? state.jobs.find((x) => x.id === id) : undefined;
    return j && !j.cancelledAt ? jobStatus(j, state.clock) : null;
  };
  const ai = status(d?.ai?.jobId);
  const send = status(d?.send?.jobId);
  const aiApplied = !!d?.ai && ai?.state === "done";
  const base = aiApplied ? d!.ai!.draft : d?.base ?? null;
  const text = aiApplied ? d!.ai!.draft.text : d?.text ?? "";
  const claims = base?.claims ?? [];
  const sending = send?.state === "running";
  const sent = send?.state === "done";
  const sendFailed = send?.state === "failed";
  const aiRunning = ai?.state === "running";
  const baseline = d ? d.savedText ?? d.base?.text ?? "" : "";
  const dirty = !!thread && !sent && text !== baseline && (text.length > 0 || baseline.length > 0);

  const guard = useLeaveGuard(dirty);
  const put = (patch: Partial<DraftLocal>) => { if (thread && d) setDrafts((xs) => ({ ...xs, [thread.id]: { ...d, ...patch } })); };
  /** fold a finished AI result into the draft before any further change */
  const committed = (): DraftLocal => (d && aiApplied ? { ...d, base: d.ai!.draft, text: d.ai!.draft.text, ai: undefined } : d!);

  const select = (id: string) => {
    setRead((xs) => (xs.includes(id) ? xs : [...xs, id]));
    setMobileThread(true);
    router.replace(`${R.comms}?thread=${encodeURIComponent(id)}`, { scroll: false });
  };

  const onEdit = (value: string) => { if (!thread) return; setDrafts((xs) => ({ ...xs, [thread.id]: { ...committed(), text: value } })); };

  const saveDraft = () => {
    if (!thread || !d) return;
    const prev = drafts[thread.id];
    const next = { ...committed(), savedText: text, savedAt: now };
    setDrafts((xs) => ({ ...xs, [thread.id]: next }));
    toast.push({ title: "הטיוטה נשמרה", detail: "נשמרה ב־Mytiv בלבד. לא נשלחה לאף אחד.", undo: { onUndo: () => setDrafts((xs) => { const c = { ...xs }; if (prev) c[thread.id] = prev; else delete c[thread.id]; return c; }) } });
  };

  const regenerate = () => {
    if (!thread || !d) return;
    const alt = thread.alternates[d.alt % Math.max(1, thread.alternates.length)];
    if (!alt) return;
    const cur = committed();
    const jobId = `mail-ai-${thread.id}-${cur.alt + 1}`;
    demo.startJob({ id: jobId, kind: "ai_directions", label: `טיוטת תשובה ל${thread.from.name}`, detail: "", durationMs: AI_MS, outcome: "success", href: `${R.comms}?thread=${thread.id}` });
    setDrafts((xs) => ({ ...xs, [thread.id]: { ...cur, alt: cur.alt + 1, ai: { jobId, draft: alt } } }));
  };
  const revertAi = () => put({ ai: undefined });

  const confirmSend = () => {
    if (!thread || !d) return;
    setSendOpen(false);
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    const cur = committed();
    const jobId = `mail-send-${thread.id}-${Date.now()}`;
    demo.startJob({ id: jobId, kind: "reconnect", label: `תשובה ל${thread.from.name}`, detail: "", durationMs: SEND_MS, outcome: fail ? "failure" : "success", href: `${R.comms}?thread=${thread.id}` });
    setDrafts((xs) => ({ ...xs, [thread.id]: { ...cur, savedText: text, send: { jobId, text } } }));
  };

  const linkThread = () => {
    const id = linkFor;
    const c = Object.values(CLIENTS).find((x) => x.id === linkChoice);
    if (!id || !c) return;
    const prev = links[id];
    setLinks((xs) => ({ ...xs, [id]: { kind: "client", client: c, label: c.name, href: c.id === CLIENTS.umino.id ? R.client("umino") : R.projects } }));
    setLinkFor(null);
    toast.push({ title: `השיחה שויכה ל${c.name}`, undo: { onUndo: () => setLinks((xs) => { const n = { ...xs }; if (prev) n[id] = prev; else delete n[id]; return n; }) } });
  };

  const syncLabel = `${MAILBOX.source.label} · ${fmtAgo(MAILBOX.syncedAt, now)}`;
  const draftStatus = sent ? "נשלחה" : sending ? "בשליחה…" : d?.savedAt && !dirty ? `נשמרה · ${fmtTime(d.savedAt)}` : dirty ? "שינויים שלא נשמרו" : "לא נשלחה";

  return (
    <div className={`f-cm-mail${mobileThread ? " f-cm-mail--thread" : ""}`}>
      <LoadableView value={MAILBOX.threads} label="דואר">
        {() => (
          <ThreadList
            threads={shown} total={live.length} selectedId={selectedId} onSelect={select} query={query} onQuery={setQuery}
            filter={filter} onFilter={setFilter} counts={counts} syncLabel={syncLabel} onLink={(id) => setLinkFor(id)} now={now}
          />
        )}
      </LoadableView>

      {thread && d ? (
        <>
          <section className="f-cm-thread-view" aria-labelledby="cm-thread-subject">
            <MessageHeader
              thread={thread} to={MAILBOX.account.name} now={now} id="cm-thread-subject"
              back={<button type="button" className="f-cm-back f-hit" onClick={() => setMobileThread(false)}><Icon name="chevron-right" size={16} />כל השיחות</button>}
            />
            <div className="f-cm-thread-view__body">
              <MessageBody lines={thread.body} />

              {sent ? (
                <section className="f-cm-sent" aria-labelledby="cm-sent-h">
                  <Banner kind="done" title={<span id="cm-sent-h">התשובה נשלחה</span>} detail={<>{MAILBOX.source.label} אישר את השליחה ב־{fmtTime(new Date(send?.state === "done" ? send.at : 0).toISOString())} · מ־<Bdi>{MAILBOX.account.address}</Bdi></>} />
                  <MessageBody lines={(d.send?.text ?? text).split("\n")} />
                </section>
              ) : base || d.ai ? (
                <section className="f-cm-reply" aria-labelledby="cm-draft-h" aria-busy={aiRunning || sending || undefined}>
                  <div className="f-cm-reply__head">
                    <h3 id="cm-draft-h" className="f-cm-reply__title">טיוטת תשובה</h3>
                    <OriginTag origin="ai_suggested" label={`טיוטה של AI · ${draftStatus}`} size="sm" />
                  </div>
                  {aiRunning && <div className="f-cm-reply__state"><SystemLine status="processing">מנסח מחדש… הטיוטה הנוכחית נשמרת עד שהניסוח החדש מוכן.</SystemLine></div>}
                  {aiApplied && (
                    <div className="f-cm-reply__state">
                      <SystemLine status="done">נוסח מחדש. בדוק את הפרטים המסומנים.</SystemLine>
                      <Button variant="link" size="sm" onClick={revertAi}>↺ חזור לניסוח הקודם</Button>
                    </div>
                  )}
                  {ai?.state === "failed" && (
                    <div className="f-cm-reply__state">
                      <SystemLine status="failed">הניסוח מחדש נכשל. הטיוטה הקודמת נשמרה.</SystemLine>
                      <Button variant="link" size="sm" onClick={regenerate}>נסה שוב</Button>
                    </div>
                  )}
                  {base ? (
                    <DraftEditor text={text} onChange={onEdit} claims={claims} labelledBy="cm-draft-h" describedBy="cm-draft-legend" disabled={aiRunning || sending} />
                  ) : aiRunning ? (
                    <div className="f-cm-reply__placeholder" role="status">יוצר טיוטה ראשונה…</div>
                  ) : null}
                  {base && <DraftLegend id="cm-draft-legend" claims={claims} text={text} />}
                  {sending && <div className="f-cm-reply__state" role="status"><SystemLine status="processing">שולח דרך {MAILBOX.source.label}… דבר עדיין לא סומן כנשלח.</SystemLine></div>}
                  {sendFailed && (
                    <Banner kind="error" title="השליחה נכשלה" detail={`${MAILBOX.source.label} לא אישר. הטיוטה נשמרה ולא סומנה כנשלחה.`}
                      action={<Button variant="secondary" size="sm" onClick={() => setSendOpen(true)}>נסה שוב</Button>} />
                  )}
                  <div className="f-cm-reply__foot">
                    <Button variant="primary" onClick={() => setSendOpen(true)} disabled={!base || aiRunning || sending}>בדוק ושלח</Button>
                    {thread.alternates.length > 0 && <Button variant="neutral" onClick={regenerate} disabled={aiRunning || sending} loading={aiRunning} loadingLabel="מנסח…">נסח מחדש</Button>}
                    <Button variant="neutral" onClick={saveDraft} disabled={!base || aiRunning || sending}>שמור טיוטה</Button>
                    <span className="f-grow" />
                    <span className="f-meta-sm">אין שליחה אוטומטית</span>
                  </div>
                </section>
              ) : (
                <section className="f-cm-reply f-cm-reply--empty" aria-label="טיוטת תשובה">
                  <EmptyState
                    glyph="✎"
                    title={thread.alternates.length ? "אין עדיין טיוטת תשובה" : "אין טיוטה מוצעת"}
                    hint={thread.alternates.length ? "AI יכין טיוטה מהנתונים במערכת. שום דבר לא יישלח בלי אישורך." : "זו הודעה שלא דורשת תשובה."}
                    action={thread.alternates.length ? <Button variant="secondary" onClick={regenerate}>צור טיוטת תשובה</Button> : undefined}
                  />
                </section>
              )}
            </div>
          </section>

          <aside className="f-cm-context" aria-labelledby="cm-ctx-h">
            <h2 id="cm-ctx-h" className="f-cm-context__title">הקשר עסקי</h2>
            {thread.context ? (
              <div className="f-cm-context__card">
                <b>{thread.context.title}</b>
                <span className="f-meta">{thread.context.meta}</span>
                {thread.context.link && <Link href={thread.context.link.href} className="f-link f-hit f-cm-context__link">{thread.context.link.label}</Link>}
              </div>
            ) : (
              <div className="f-cm-context__card">
                <b>לא משויך ללקוח</b>
                <span className="f-meta">שייך את השיחה כדי לראות את ההקשר שלה.</span>
                <Button variant="link" size="sm" className="f-hit f-cm-context__link" onClick={() => setLinkFor(thread.id)}>שייך ללקוח</Button>
              </div>
            )}
            {base && (
              <>
                <h3 className="f-cm-context__sub">על מה הטיוטה הסתמכה</h3>
                <ClaimList claims={claims} text={text} />
              </>
            )}
            <p className="f-cm-context__note">הטיוטה מבוססת על נתונים מהמערכת. לפני שליחה כדאי לבדוק את הפרטים המסומנים.</p>
            <label className="f-cm-demo">
              <input type="checkbox" checked={state.failNext} onChange={(e) => demo.setFailNext(e.target.checked)} />
              <span>דמו: הדמה כשל של {MAILBOX.source.label} בשליחה הבאה</span>
            </label>
          </aside>

          <SendReviewDialog
            open={sendOpen} onClose={() => setSendOpen(false)} onConfirm={confirmSend}
            to={thread.from} from={MAILBOX.account} subject={thread.subject} text={text} claims={claims} via={MAILBOX.source.label}
          />
        </>
      ) : (
        <section className="f-cm-thread-view">
          <EmptyState title="לא נבחרה שיחה" hint="בחר שיחה מהרשימה כדי לקרוא ולענות." />
        </section>
      )}

      <Dialog open={!!linkFor} onClose={() => setLinkFor(null)} labelledBy="cm-link-title" className="f-cm-modal">
        <form className="f-cm-dlg" onSubmit={(e) => { e.preventDefault(); linkThread(); }}>
          <h2 id="cm-link-title" className="f-cm-dlg__title">שיוך השיחה ללקוח</h2>
          <SelectField label="לקוח" value={linkChoice} onChange={(e) => setLinkChoice(e.target.value)} help="השיוך נשמר ב־Mytiv בלבד. Gmail לא משתנה."
            options={Object.values(CLIENTS).map((c) => ({ value: c.id, label: c.name }))} />
          <div className="f-cm-dlg__actions">
            <Button type="submit" variant="primary">שייך</Button>
            <Button variant="neutral" onClick={() => setLinkFor(null)}>ביטול</Button>
          </div>
        </form>
      </Dialog>

      <LeaveDialog
        open={!!guard.pendingHref} what="שינויים בטיוטת התשובה לא יישמרו."
        onStay={guard.stay} onLeave={guard.leave} onSaveAndLeave={() => { saveDraft(); guard.leave(); }}
      />
    </div>
  );
}

export default function CommsMailScreen() {
  return <Suspense><Inner /></Suspense>;
}
