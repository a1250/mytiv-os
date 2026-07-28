"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type Proposal = {
  id: string;
  title: string;
  clientName: string | null;
  status: string;
  description: string | null;
  goal: string | null;
};

export default function ProposalEditorPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const t = useT();
  const { settings } = useStudio();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setProposal((await api.proposals.get(id)) as Proposal);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSave(patch: Partial<Proposal>) {
    setSaving(true);
    await api.proposals.update(id, patch);
    setSaving(false);
    await load();
  }

  if (!proposal) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <div className="report-kicker" style={{ color: "var(--text-dim)", fontSize: 12 }}>
        {(settings.studio_name as string) || "Mytiv"} — {t("Proposal")}
      </div>
      <h1>{proposal.title}</h1>

      <div className="settings-form">
        <div className="settings-field">
          <label>{t("Client name")}</label>
          <input
            defaultValue={proposal.clientName ?? ""}
            onBlur={(e) => handleSave({ clientName: e.target.value })}
          />
        </div>
        <div className="settings-field">
          <label>{t("Status")}</label>
          <select defaultValue={proposal.status} onChange={(e) => handleSave({ status: e.target.value })}>
            {["draft", "sent", "accepted", "declined"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-field">
          <label>{t("The Goal")}</label>
          <textarea
            defaultValue={proposal.goal ?? ""}
            onBlur={(e) => handleSave({ goal: e.target.value })}
            rows={4}
            style={{ width: "100%", background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
          />
        </div>
        {saving && <span className="empty">{t("Saved")}…</span>}
      </div>
    </div>
  );
}
