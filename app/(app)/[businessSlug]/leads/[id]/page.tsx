"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi, useT } from "@/components/studio-provider";

type Lead = {
  id: string;
  company: string;
  category: string | null;
  status: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type Note = { id: string; body: string; createdAt: string };

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const t = useT();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState("");

  async function load() {
    setLead((await api.leads.get(id)) as Lead);
    setNotes((await api.leads.listNotes(id)) as Note[]);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    await api.leads.addNote(id, noteBody);
    setNoteBody("");
    await load();
  }

  async function handleStatusChange(status: string) {
    await api.leads.update(id, { status });
    await load();
  }

  if (!lead) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{lead.company}</h1>
      <div className="lead-form">
        <select value={lead.status} onChange={(e) => handleStatusChange(e.target.value)}>
          {["new", "researching", "ready_to_contact", "contacted", "replied", "won", "lost"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {lead.website && <a href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a>}
      </div>

      <h2 style={{ marginTop: 24, fontSize: 15 }}>{t("Notes")}</h2>
      <form onSubmit={handleAddNote} className="lead-form">
        <input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder={t("Add a note…")} />
        <button type="submit">{t("Add")}</button>
      </form>
      <div className="task-list">
        {notes.map((note) => (
          <div key={note.id} className="task-row">
            <span className="task-title">{note.body}</span>
            <span className="task-due">{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
