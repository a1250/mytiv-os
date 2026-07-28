"use client";

import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";

type GoogleStatus = { connected: boolean; calendar: boolean };
type CalEvent = { id: string; title: string; startTime: string; endTime: string; allDay: boolean; syncState: string };

export default function CalendarPage() {
  const api = useApi();
  const t = useT();
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setGoogleStatus((await api.google.status()) as GoogleStatus);
    setEvents((await api.calendar.listEvents()) as CalEvent[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;
    await api.calendar.createEvent({ title, startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString() });
    setTitle("");
    setStart("");
    setEnd("");
    await load();
  }

  async function handleSync() {
    setSyncing(true);
    await api.calendar.sync();
    await load();
    setSyncing(false);
  }

  async function handleRemove(id: string) {
    await api.calendar.deleteEvent(id);
    await load();
  }

  if (!events) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Calendar")}</h1>

      {googleStatus?.connected && googleStatus.calendar ? (
        <button className="secondary" onClick={handleSync} style={{ marginBottom: 16 }}>
          {syncing ? t("Syncing…") : t("Sync now")}
        </button>
      ) : (
        <p className="empty" style={{ marginBottom: 16 }}>{t("Connect Google Calendar in Settings to sync — local events still work without it.")}</p>
      )}

      <form onSubmit={handleCreate} className="lead-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Event title…")} />
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button type="submit">{t("Add")}</button>
      </form>

      <div className="task-list">
        {events.length === 0 && <p className="empty">{t("No events yet.")}</p>}
        {events
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .map((ev) => (
            <div key={ev.id} className="task-row">
              <span className="task-title">{ev.title}</span>
              <span className="task-due">{new Date(ev.startTime).toLocaleString()}</span>
              <span className="pill">{ev.syncState}</span>
              <button className="task-remove" onClick={() => handleRemove(ev.id)}>
                {t("Remove")}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
