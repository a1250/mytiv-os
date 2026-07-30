"use client";

import { useEffect, useState } from "react";
import { askClaude } from "@/lib/ai/ask-claude";
import { buildReplyDraft, type ThreadMessage as ReplySource } from "@/lib/services/email-reply";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type GoogleStatus = { connected: boolean; email: string; gmail: boolean };
type Message = {
  googleMessageId: string;
  googleThreadId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string | null;
  unread: boolean;
};
type ThreadMessage = { googleMessageId: string; fromEmail: string; fromName: string; subject: string; bodyPreview: string; date: string | null };

export default function MailPage() {
  const api = useApi();
  const t = useT();
  const { settings, businessName } = useStudio();
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[] | null>(null);
  const [error, setError] = useState("");
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState<string>("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyNote, setReplyNote] = useState<string | null>(null);

  async function load() {
    const s = (await api.google.status()) as GoogleStatus;
    setGoogleStatus(s);
    if (s.connected && s.gmail) {
      try {
        setMessages((await api.gmail.list("inbox")) as Message[]);
      } catch {
        setError(t("Could not load inbox."));
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openThread(threadId: string) {
    const thread = (await api.gmail.readThread(threadId)) as { messages: ThreadMessage[] };
    setThreadMessages(thread.messages);
    setOpenThreadId(threadId);
    setReply("");
    setReplyNote(null);
  }

  async function draftReply() {
    if (!threadMessages) return;
    setReplyBusy(true);
    setReplyNote(null);

    const brand = (settings.studio_name as string) || businessName;
    const subject = messages?.find((m) => m.googleThreadId === openThreadId)?.subject ?? "";
    const local = buildReplyDraft(subject, threadMessages as ReplySource[], brand);
    setReply(local.body);

    const recent = threadMessages
      .slice(-4)
      .map((m) => `${m.fromEmail}: ${(m.bodyPreview || "").slice(0, 500)}`)
      .join("\n---\n");

    const refined = await askClaude<string>(api, {
      json: false,
      maxTokens: 500,
      onError: (msg) => setReplyNote(`${t("Written without Claude")}: ${msg}`),
      prompt: [
        `Email thread with a potential client (subject: "${subject}"):`,
        recent,
        "",
        `Write our next reply in ${local.language === "he" ? "Hebrew" : "English"}, matching their language.`,
        `Max 90 words, move toward a concrete next step (short call or scope), sign as ${brand}.`,
        "Return only the reply text.",
      ].join("\n"),
    });

    if (typeof refined === "string" && refined.trim().length > 20) {
      setReply(refined.trim());
      setReplyNote(t("Written by Claude — edit before creating the draft."));
    }
    setReplyBusy(false);
  }

  /** Creates a Gmail draft in the same thread. Sending happens in Gmail, never here. */
  async function createReplyDraft() {
    const thread = messages?.find((m) => m.googleThreadId === openThreadId);
    if (!openThreadId || !reply.trim() || !thread) return;
    setReplyBusy(true);
    try {
      await api.gmail.createDraft({
        to: thread.fromEmail,
        subject: thread.subject?.startsWith("Re:") ? thread.subject : `Re: ${thread.subject ?? ""}`,
        body: reply,
        googleThreadId: openThreadId,
      });
      setReplyNote(t("Draft created in Gmail — review and send it from there."));
    } catch {
      setReplyNote(t("Could not create the draft in Gmail."));
    }
    setReplyBusy(false);
  }

  if (!googleStatus) return <div className="page">{t("Loading…")}</div>;

  if (!googleStatus.connected) {
    return (
      <div className="page">
        <h1>{t("Mail")}</h1>
        <p className="empty">{t("Connect your Google account in Settings to see real Gmail here.")}</p>
        <button onClick={() => api.google.connect()}>{t("Connect Google Account")}</button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{t("Mail")}</h1>
      <p className="lead-meta" style={{ marginBottom: 12 }}>{googleStatus.email}</p>
      {error && <p className="empty">{error}</p>}

      <div style={{ display: "flex", gap: 24 }}>
        <div className="task-list" style={{ flex: 1 }}>
          {messages?.length === 0 && <p className="empty">{t("No messages.")}</p>}
          {messages?.map((m) => (
            <div key={m.googleMessageId} className="task-row" onClick={() => openThread(m.googleThreadId)} style={{ cursor: "pointer" }}>
              <span className="task-title">
                <strong>{m.fromName || m.fromEmail}</strong> — {m.subject}
                <br />
                <span className="lead-meta">{m.snippet}</span>
              </span>
              {m.unread && <span className="pill">{t("Unread")}</span>}
            </div>
          ))}
        </div>

        {threadMessages && (
          <div style={{ flex: 1 }}>
            {threadMessages.map((tm) => (
              <div key={tm.googleMessageId} className="task-row" style={{ display: "block" }}>
                <div>
                  <strong>{tm.fromName || tm.fromEmail}</strong> <span className="lead-meta">{tm.date && new Date(tm.date).toLocaleString()}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{tm.bodyPreview}</div>
              </div>
            ))}

            <div className="settings-form" style={{ marginTop: 12 }}>
              <div className="settings-field">
                <label>{t("Reply")}</label>
                <textarea
                  className="editor-textarea"
                  rows={7}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t("Draft a reply, or let Claude write one…")}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="secondary" onClick={draftReply} disabled={replyBusy}>
                  {replyBusy ? t("Working…") : t("Draft reply")}
                </button>
                <button onClick={createReplyDraft} disabled={replyBusy || !reply.trim()}>
                  {t("Create Gmail draft")}
                </button>
              </div>
              <p className="empty">{t("Creates a draft only — nothing is sent from here.")}</p>
              {replyNote && <span className="empty">{replyNote}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
