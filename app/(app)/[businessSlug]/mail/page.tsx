"use client";

import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";

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
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[] | null>(null);
  const [error, setError] = useState("");

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
          </div>
        )}
      </div>
    </div>
  );
}
