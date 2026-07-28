"use client";

/**
 * Ported from src/modules/leads/LeadsPage.jsx (simplified for Phase 1 —
 * table/card view toggle and Discover Leads land later with the discovery
 * job queue, per the plan's Phase 4).
 */
import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function LeadsPage() {
  const api = useApi();
  const t = useT();
  const { businessSlug } = useStudio();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [company, setCompany] = useState("");

  async function load() {
    setLeads((await api.leads.list()) as Lead[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    await api.leads.create({ company });
    setCompany("");
    await load();
  }

  if (!leads) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Lead CRM")}</h1>

      <form onSubmit={handleCreate} className="lead-form">
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={t("New lead company name…")}
        />
        <button type="submit">{t("Add")}</button>
      </form>

      <div className="lead-list">
        {leads.length === 0 && <p className="empty">{t("No leads yet.")}</p>}
        {leads.map((lead) => (
          <Link key={lead.id} href={`/${businessSlug}/leads/${lead.id}`} className="lead-row">
            <span className="lead-company">{lead.company}</span>
            {lead.category && <span className="lead-meta">{lead.category}</span>}
            {(lead.city || lead.country) && (
              <span className="lead-meta">
                {[lead.city, lead.country].filter(Boolean).join(", ")}
              </span>
            )}
            <span className="pill">{lead.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
