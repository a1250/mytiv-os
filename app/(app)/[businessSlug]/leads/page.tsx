"use client";

/**
 * Ported from src/modules/leads/LeadsPage.jsx, now with Discover Leads
 * wired to the QStash-backed job queue (Phase 4) — search is slow
 * (DuckDuckGo pacing), so this triggers a background job and polls for
 * results rather than blocking the request.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type Lead = {
  id: string;
  company: string;
  category: string | null;
  status: string;
  relevance: number;
  city: string | null;
  country: string | null;
};

type LeadCandidate = {
  url: string;
  domain: string;
  kind: string;
  title: string;
  snippet: string;
  score: number;
  opportunity: string;
  why: string;
  company: string;
  existing: boolean;
};

type Job = { id: string; status: "queued" | "running" | "done" | "error"; result: LeadCandidate[] | null; errorMessage: string | null };

export default function LeadsPage() {
  const api = useApi();
  const t = useT();
  const { businessSlug } = useStudio();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [company, setCompany] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    setLeads((await api.leads.list()) as Lead[]);
  }

  useEffect(() => {
    load();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    await api.leads.create({ company });
    setCompany("");
    await load();
  }

  async function handleDiscover(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const { jobId } = (await api.leads.discover({ query, category, limit: 12 })) as { jobId: string };
    setJob({ id: jobId, status: "queued", result: null, errorMessage: null });
    pollRef.current = setInterval(async () => {
      const latest = (await api.jobs.get(jobId)) as Job;
      setJob(latest);
      if (latest.status === "done" || latest.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  async function handleAddCandidate(c: LeadCandidate) {
    await api.leads.create({ company: c.company, website: c.url, category, opportunityType: c.opportunity, notes: c.why, source: "discover_leads" });
    await load();
  }

  if (!leads) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Lead CRM")}</h1>

      <form onSubmit={handleCreate} className="lead-form">
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("New lead company name…")} />
        <button type="submit">{t("Add")}</button>
      </form>

      <h2 style={{ fontSize: 15, margin: "20px 0 8px" }}>{t("Discover Leads")}</h2>
      <form onSubmit={handleDiscover} className="lead-form">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search query (e.g. boutique hotels Tel Aviv)…")} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("Category (optional)")} />
        <button type="submit" disabled={job?.status === "queued" || job?.status === "running"}>
          {job?.status === "queued" || job?.status === "running" ? t("Searching… (up to a minute)") : t("Discover")}
        </button>
      </form>

      {job?.status === "error" && <p className="empty">{t("Search failed")}: {job.errorMessage}</p>}

      {job?.status === "done" && job.result && (
        <div className="lead-list" style={{ marginBottom: 20 }}>
          {job.result.length === 0 && <p className="empty">{t("No candidates found.")}</p>}
          {job.result.map((c) => (
            <div key={c.url} className="lead-row">
              <span className="lead-company">{c.company}</span>
              <span className="lead-meta">{c.why}</span>
              <span className="pill">{c.kind}</span>
              {c.existing ? (
                <span className="pill priority-low">{t("Already a lead")}</span>
              ) : (
                <button className="task-remove" onClick={() => handleAddCandidate(c)}>
                  {t("Add to CRM")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 15, margin: "20px 0 8px" }}>{t("Saved leads")}</h2>
      <div className="lead-list">
        {leads.length === 0 && <p className="empty">{t("No leads yet.")}</p>}
        {leads.map((lead) => (
          <Link key={lead.id} href={`/${businessSlug}/leads/${lead.id}`} className="lead-row">
            <span className="lead-company">{lead.company}</span>
            {lead.category && <span className="lead-meta">{lead.category}</span>}
            {(lead.city || lead.country) && <span className="lead-meta">{[lead.city, lead.country].filter(Boolean).join(", ")}</span>}
            <span className="pill">{lead.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
