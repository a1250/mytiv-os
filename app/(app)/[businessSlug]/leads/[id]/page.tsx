"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type Lead = {
  id: string;
  company: string;
  category: string | null;
  status: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  opportunityType: string | null;
  contactName: string | null;
};

type LinkedProposal = { id: string; title: string; status: string; updatedAt: string };

type Note = { id: string; body: string; createdAt: string };

type Contact = { id: string; fullName: string; jobTitle: string | null; email: string | null; emailStatus: string | null; linkedinUrl: string | null };

type ContactCandidate = {
  full_name: string;
  job_title: string;
  department: string;
  seniority: string;
  linkedin_url: string;
  email: string;
  email_status: string;
  source_url: string;
  source_type: string;
  confidence: number;
  relevance: number;
  why_relevant: string;
  suggested_angle: string;
  suggested_service: string;
  existing?: boolean;
};

type ContactJob = {
  id: string;
  status: "queued" | "running" | "done" | "error";
  result: { candidates: ContactCandidate[]; throttled: boolean; partial: boolean; failedAll: boolean } | null;
  errorMessage: string | null;
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const t = useT();
  const router = useRouter();
  const { businessSlug } = useStudio();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [proposals, setProposals] = useState<LinkedProposal[]>([]);
  const [job, setJob] = useState<ContactJob | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    setLead((await api.leads.get(id)) as Lead);
    setNotes((await api.leads.listNotes(id)) as Note[]);
    setContacts((await api.contacts.listByLead(id)) as Contact[]);
    setProposals((await api.proposals.listByLead(id)) as LinkedProposal[]);
  }

  useEffect(() => {
    load();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  async function handleFindContacts() {
    if (!lead) return;
    const { jobId } = (await api.contacts.discover({
      company: lead.company,
      website: lead.website || "",
      opportunityType: lead.opportunityType || "",
      leadId: id,
    })) as { jobId: string };
    setJob({ id: jobId, status: "queued", result: null, errorMessage: null });
    pollRef.current = setInterval(async () => {
      const latest = (await api.jobs.get(jobId)) as ContactJob;
      setJob(latest);
      if (latest.status === "done" || latest.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  async function handleAddContact(c: ContactCandidate) {
    await api.contacts.create({ leadId: id, ...c });
    await load();
  }

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

  /** Seeds the proposal from what the lead already knows, then opens the editor. */
  async function handleCreateProposal() {
    if (!lead) return;
    const created = (await api.proposals.create({
      title: `${t("Proposal")} — ${lead.company}`,
      leadId: lead.id,
      clientCompany: lead.company,
      clientName: lead.contactName || "",
      clientEmail: lead.email || "",
      date: new Date().toISOString().slice(0, 10),
    })) as { id: string };
    router.push(`/${businessSlug}/proposals/${created.id}`);
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

      <h2 style={{ marginTop: 24, fontSize: 15 }}>{t("Proposals")}</h2>
      <button onClick={handleCreateProposal} style={{ marginBottom: 12 }}>
        {t("Create proposal for this lead")}
      </button>
      <div className="lead-list">
        {proposals.length === 0 && <p className="empty">{t("No proposals for this lead yet.")}</p>}
        {proposals.map((p) => (
          <Link key={p.id} href={`/${businessSlug}/proposals/${p.id}`} className="lead-row">
            <span className="lead-company">{p.title}</span>
            <span className="lead-meta">{new Date(p.updatedAt).toLocaleDateString()}</span>
            <span className="pill">{p.status}</span>
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: 24, fontSize: 15 }}>{t("Contact Finder")}</h2>
      <button onClick={handleFindContacts} disabled={job?.status === "queued" || job?.status === "running"} style={{ marginBottom: 12 }}>
        {job?.status === "queued" || job?.status === "running" ? t("Searching… (up to a minute)") : t("Find contacts")}
      </button>

      {job?.status === "error" && <p className="empty">{t("Search failed")}: {job.errorMessage}</p>}
      {job?.status === "done" && job.result?.throttled && <p className="empty">{t("Search was rate-limited — results may be partial.")}</p>}

      {job?.status === "done" && job.result && (
        <div className="lead-list" style={{ marginBottom: 20 }}>
          {job.result.candidates.length === 0 && <p className="empty">{t("No candidates found.")}</p>}
          {job.result.candidates.map((c) => (
            <div key={c.full_name} className="lead-row">
              <span className="lead-company">{c.full_name}</span>
              <span className="lead-meta">{c.job_title}</span>
              <span className="pill">{c.email_status}</span>
              {c.existing ? (
                <span className="pill priority-low">{t("Already saved")}</span>
              ) : (
                <button className="task-remove" onClick={() => handleAddContact(c)}>
                  {t("Add contact")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="task-list">
        {contacts.map((c) => (
          <div key={c.id} className="task-row">
            <span className="task-title">{c.fullName}</span>
            <span className="lead-meta">{c.jobTitle}</span>
            <span className="pill">{c.emailStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
