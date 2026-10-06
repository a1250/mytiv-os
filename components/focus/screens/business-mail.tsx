"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Inbox, InboxThread } from "@/lib/external/mail";
import { sendRefusalText, sendStatus, type MailAttempt } from "@/lib/focus/adapters/mail";
import { fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { TARGET_CHECK } from "@/lib/focus/state/jobs";
import { SendReviewDialog } from "@/components/focus/patterns/comms/mail";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useFocusScope } from "@/components/focus/shell/scope";
import { useNavGuard } from "@/components/focus/shell/nav-guard";
import { Button } from "@/components/focus/ui/button";
import { Banner, EmptyState } from "@/components/focus/ui/feedback";
import { TextAreaField } from "@/components/focus/ui/field";
import { Bdi } from "@/components/focus/ui/misc";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Mail of a real business: its own Gmail inbox (read on the server), a thread, and a reply. A reply is saved as a
 * Gmail draft and sent ONLY through the backend-owned attempt (POST …/external/gmail/send): the server records the
 * attempt before calling Gmail and settles it with Gmail's answer. "נשלח" appears only when Gmail confirmed; when
 * Gmail did not answer the outcome is UNKNOWN and a new send needs the explicit target check — enforced by the server.
 * A retry after a lost answer re-sends the SAME request id, so it can never send twice.
 */
type ThreadMessage = { googleMessageId: string; fromName: string; fromEmail: string; subject: string; bodyPreview: string; date: string | null; isSent: boolean };
type Loaded = { messages: ThreadMessage[]; attempts: MailAttempt[] } | "loading" | "error";
const RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function BusinessMailScreen({ inbox }: { inbox: Inbox }) {
  if (inbox.state === "not_connected") {
    return (
      <Page className="f-bmail">
        <PageHeader title="דואר" size="page" status="Gmail לא מחובר לעסק הזה." />
        <EmptyState glyph="✉" title="אין חיבור ל־Gmail" hint="בעלי העסק מחברים את Gmail בהגדרות המערכת. אחרי החיבור הדואר יופיע כאן." />
      </Page>
    );
  }
  if (inbox.state === "error") {
    return (
      <Page className="f-bmail">
        <PageHeader title="דואר" size="page" status="לא הצלחנו לקרוא את תיבת הדואר." />
        <Banner kind="error" live={false} title="Gmail לא זמין כרגע" detail="נסו לרענן בעוד רגע. שום דבר לא נשלח." />
      </Page>
    );
  }
  return <Mailbox account={inbox.account} threads={inbox.threads} />;
}

function Mailbox({ account, threads }: { account: string; threads: InboxThread[] }) {
  const [selected, setSelected] = useState<string | null>(threads[0]?.threadId ?? null);
  const thread = threads.find((t) => t.threadId === selected) ?? null;
  const unread = threads.filter((t) => t.unread).length;
  return (
    <Page className="f-bmail">
      <PageHeader title="דואר" size="page" status={threads.length ? `${threads.length} שיחות בתיבה${unread ? ` · ${unread} לא נקראו` : ""}.` : "התיבה ריקה."} />
      <p className="f-meta-sm">החשבון: <Bdi>{account}</Bdi> · שליחה רק אחרי אישור שלך, ו״נשלח״ רק אחרי ש־Gmail אישר.</p>
      {threads.length === 0 ? <EmptyState glyph="✉" title="אין הודעות בתיבה" hint="הודעות חדשות יופיעו כאן." /> : (
        <div className="f-bmail__grid">
          <nav aria-label="שיחות" className="f-bmail__list">
            <ul>
              {threads.map((t) => (
                <li key={t.threadId}>
                  <button type="button" className="f-bmail__item" aria-current={t.threadId === selected ? "true" : undefined} onClick={() => setSelected(t.threadId)}>
                    <span className="f-bmail__from">{t.unread && <span className="f-bmail__dot" aria-label="לא נקרא" />}<Bdi>{t.fromName || t.fromEmail}</Bdi></span>
                    <span className="f-bmail__subj">{t.subject || "(ללא נושא)"}</span>
                    <span className="f-meta-sm">{t.date ? `${fmtDayMonth(t.date)} ${fmtTime(t.date)}` : ""}{t.count > 1 ? ` · ${t.count}` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {thread && <ThreadView key={thread.threadId} thread={thread} account={account} />}
        </div>
      )}
    </Page>
  );
}

function ThreadView({ thread, account }: { thread: InboxThread; account: string }) {
  const { slug } = useFocusScope();
  const toast = useToast();
  const api = `/api/${encodeURIComponent(slug)}`;
  const [loaded, setLoaded] = useState<Loaded>("loading");
  const [text, setText] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // the draft made for the text being sent, and the request id of the send attempt in progress: a retry after a lost
  // answer re-sends the SAME id (the server replays the recorded attempt, Gmail is not called again)
  const draft = useRef<{ text: string; draftId: string } | null>(null);
  const sendRequest = useRef<{ key: string; requestId: string } | null>(null);
  useNavGuard({ dirty: text.trim().length > 0, what: `התשובה ל"${thread.subject}" עוד לא נשלחה.` });

  const load = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([
        fetch(`${api}/gmail/threads/${encodeURIComponent(thread.threadId)}`, { cache: "no-store" }),
        fetch(`${api}/external/attempts?target=gmail:thread:${encodeURIComponent(thread.threadId)}`, { cache: "no-store" }),
      ]);
      if (!t.ok || !a.ok) { setLoaded("error"); return; }
      setLoaded({ messages: (await t.json()).messages ?? [], attempts: (await a.json()).attempts ?? [] });
    } catch { setLoaded("error"); }
  }, [api, thread.threadId]);
  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- loading the thread from the server

  const status = typeof loaded === "object" ? sendStatus(loaded.attempts) : { kind: "none" as const };
  const replyTo = thread.fromEmail;

  const post = async (path: string, body: Record<string, unknown>) => {
    for (let i = 0; i < RETRIES; i++) {
      try {
        const res = await fetch(`${api}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        if (res.status >= 500 && i < RETRIES - 1) { await sleep(400 * (i + 1)); continue; }
        return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
      } catch { await sleep(400 * (i + 1)); }
    }
    return null;
  };

  const send = async (targetChecked: boolean) => {
    setReview(false); setBusy(true); setError(null);
    const attested = targetChecked && status.kind === "unknown" ? status.unknownAttemptId : null;
    try {
      if (!draft.current || draft.current.text !== text) {
        const d = await post("/external/gmail/draft", { requestId: crypto.randomUUID(), threadId: thread.threadId, to: replyTo, subject: thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`, body: text });
        if (!d || d.status !== 200) { setError(d ? sendRefusalText(d.body.error as string) : "אין תשובה מהשרת. שום דבר לא נשלח."); return; }
        draft.current = { text, draftId: String(d.body.draftId) };
      }
      const key = `${draft.current.draftId}:${attested ?? ""}`;
      if (sendRequest.current?.key !== key) sendRequest.current = { key, requestId: crypto.randomUUID() };
      const r = await post("/external/gmail/send", { requestId: sendRequest.current.requestId, threadId: thread.threadId, draftId: draft.current.draftId, attestedUnknownAttemptId: attested });
      if (!r) { setError("אין תשובה מהשרת. לא ידוע אם נשלח — שליחה חוזרת תישלח עם אותו מזהה ולא תצא פעמיים."); return; }
      const attempt = r.body.attempt as MailAttempt | undefined;
      if (r.status === 200 && attempt?.state === "confirmed") {
        toast.push({ kind: "success", title: "נשלח", detail: "Gmail אישר את השליחה." });
        setText(""); draft.current = null; sendRequest.current = null;
      } else if (r.status === 200 && attempt?.state === "failed") {
        setError("Gmail סירב לשלוח. שום דבר לא נשלח — אפשר לנסות שוב."); sendRequest.current = null;
      } else if (r.status === 200 && attempt?.state === "unknown") {
        setError("Gmail לא ענה. לא ידוע אם נשלח — בדקו בתיקיית נשלח ב־Gmail לפני שליחה חדשה."); sendRequest.current = null;
      } else {
        setError(sendRefusalText(r.body.error as string)); sendRequest.current = null;
      }
    } finally {
      setBusy(false);
      await load();
    }
  };

  return (
    <section className="f-panel f-bmail__thread" aria-labelledby="bmail-subj">
      <h2 id="bmail-subj" className="f-bmail__title">{thread.subject || "(ללא נושא)"}</h2>
      {loaded === "loading" && <p className="f-meta" role="status">טוען את השיחה…</p>}
      {loaded === "error" && <Banner kind="error" live title="לא הצלחנו לטעון את השיחה" detail="נסו שוב בעוד רגע." />}
      {typeof loaded === "object" && (
        <>
          <ol className="f-bmail__msgs">
            {loaded.messages.map((m) => (
              <li key={m.googleMessageId} className={m.isSent ? "f-bmail__msg f-bmail__msg--sent" : "f-bmail__msg"}>
                <p className="f-meta-sm"><Bdi>{m.isSent ? "את/ה" : m.fromName || m.fromEmail}</Bdi>{m.date ? ` · ${fmtDayMonth(m.date)} ${fmtTime(m.date)}` : ""}</p>
                <p className="f-bmail__body">{m.bodyPreview}</p>
              </li>
            ))}
          </ol>
          {status.kind !== "none" && (
            <p className={`f-bmail__status f-bmail__status--${status.kind}`} role="status" data-send-status={status.kind}>{status.text}</p>
          )}
        </>
      )}
      <div className="f-bmail__reply">
        <TextAreaField label={`תשובה אל ${replyTo}`} rows={4} maxLength={20000} value={text} error={error ?? undefined}
          onChange={(e) => { setText(e.target.value); setError(null); }} />
        <div className="f-bmail__actions">
          <Button variant="primary" loading={busy} loadingLabel="שולח…" disabled={status.kind === "in_flight"}
            onClick={() => { if (!text.trim()) { setError("אין מה לשלוח."); return; } setReview(true); }}>שלח…</Button>
          <span className="f-meta-sm">נשמר כטיוטה ב־Gmail ונשלח רק אחרי אישור</span>
        </div>
      </div>
      <SendReviewDialog open={review} onClose={() => setReview(false)} onConfirm={(checked) => void send(checked)}
        to={{ name: thread.fromName || replyTo, address: replyTo }} from={{ name: account, address: account }}
        subject={thread.subject} text={text} claims={[]} via="Gmail" targetCheck={status.kind === "unknown" ? TARGET_CHECK.gmail : undefined} />
    </section>
  );
}
