"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type Proposal = { id: string; title: string; clientName: string | null; status: string };

export default function ProposalsPage() {
  const api = useApi();
  const t = useT();
  const { businessSlug } = useStudio();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [title, setTitle] = useState("");

  async function load() {
    setProposals((await api.proposals.list()) as Proposal[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.proposals.create({ title });
    setTitle("");
    await load();
  }

  if (!proposals) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Proposals")}</h1>

      <form onSubmit={handleCreate} className="lead-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("New proposal title…")} />
        <button type="submit">{t("Add")}</button>
      </form>

      <div className="lead-list">
        {proposals.length === 0 && <p className="empty">{t("No proposals yet.")}</p>}
        {proposals.map((p) => (
          <Link key={p.id} href={`/${businessSlug}/proposals/${p.id}`} className="lead-row">
            <span className="lead-company">{p.title}</span>
            {p.clientName && <span className="lead-meta">{p.clientName}</span>}
            <span className="pill">{p.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
